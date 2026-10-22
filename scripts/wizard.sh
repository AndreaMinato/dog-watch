#!/usr/bin/env bash
set -euo pipefail

readonly ENVIRONMENTS=(staging production)
readonly NETLIFY_CLI=(npx --yes netlify-cli@27.14.1)
readonly SUPABASE_API=https://api.supabase.com/v1
readonly SUPABASE_REGION=eu-central-1
readonly JWT_EXPIRY_SECONDS=600
readonly GENERATED_FUNCTION_SECRETS=(ROOM_KEY_PEPPER IP_HASH_SALT)
readonly ASKED_FUNCTION_SECRETS=(CLOUDFLARE_TURN_KEY_ID CLOUDFLARE_TURN_KEY_API_TOKEN)

root=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)

step() { printf '\n== %s\n' "$*" >&2; }
fail() { printf '%s\n' "$*" >&2; exit 1; }

open_page() {
  printf 'Apro %s\n' "$1" >&2
  open "$1" 2>/dev/null || xdg-open "$1" 2>/dev/null || true
}

ask() {
  local answer
  read -r -p "$1${2:+ [$2]}: " answer
  printf '%s' "${answer:-${2:-}}"
}

ask_secret() {
  local answer=''
  while [[ -z $answer ]]; do
    read -r -s -p "$1: " answer
    echo >&2
  done
  printf '%s' "$answer"
}

choose() {
  local label=$1
  shift
  if (($# == 1)); then
    printf '%s' "$1"
    return
  fi
  local i=1 option
  for option in "$@"; do
    printf '%d) %s\n' "$i" "$option" >&2
    i=$((i + 1))
  done
  local options=("$@") picked
  picked=$(ask "$label" 1)
  printf '%s' "${options[picked - 1]}"
}

contains() {
  local needle=$1 item
  shift
  for item in "$@"; do
    [[ $item == "$needle" ]] && return 0
  done
  return 1
}

lines_to_array() {
  local line
  lines=()
  while IFS= read -r line; do
    [[ -n $line ]] && lines+=("$line")
  done
}

require_tools() {
  local tool
  for tool in gh jq curl openssl npx; do
    command -v "$tool" >/dev/null || fail "Serve $tool nel PATH"
  done
  gh auth status >/dev/null || fail "Esegui prima: gh auth login"
}

check_function_secrets_are_known() {
  local name
  while IFS='=' read -r name _; do
    [[ -z $name || $name == \#* ]] && continue
    contains "$name" "${GENERATED_FUNCTION_SECRETS[@]}" "${ASKED_FUNCTION_SECRETS[@]}" \
      || fail "Il wizard non sa impostare $name (supabase/functions/.env): aggiungilo a scripts/wizard.sh"
  done <"$root/supabase/functions/.env"
}

github_variable() {
  local args=("$1")
  [[ -n ${2:-} ]] && args+=(--env "$2")
  gh variable get "${args[@]}" 2>/dev/null || true
}

github_secret() {
  local args=("$1")
  [[ -n ${2:-} ]] && args+=(--env "$2")
  gh secret set "${args[@]}"
}

configure_github() {
  step "GitHub: Actions e ambienti"
  gh api -X PUT "repos/$repo/actions/permissions/workflow" \
    -f default_workflow_permissions=read -F can_approve_pull_request_reviews=true
  local environment
  for environment in "${ENVIRONMENTS[@]}"; do
    gh api -X PUT "repos/$repo/environments/$environment" --silent
  done
}

configure_netlify() {
  step "Netlify"
  open_page 'https://app.netlify.com/user/applications#personal-access-tokens'
  NETLIFY_AUTH_TOKEN=$(ask_secret "Personal access token di Netlify")
  export NETLIFY_AUTH_TOKEN
  printf '%s' "$NETLIFY_AUTH_TOKEN" | github_secret NETLIFY_AUTH_TOKEN

  local site_id
  site_id=$(github_variable NETLIFY_SITE_ID)
  if [[ -z $site_id ]]; then
    local lines account name
    lines_to_array < <("${NETLIFY_CLI[@]}" api listAccountsForUser | jq -r '.[].slug')
    account=$(choose "Team Netlify" "${lines[@]}")
    name=$(ask "Nome del sito, diventa <nome>.netlify.app" dog-watch)
    site_id=$("${NETLIFY_CLI[@]}" sites:create --name "$name" --account-slug "$account" --disable-linking --json | jq -r .id)
    gh variable set NETLIFY_SITE_ID --body "$site_id"
  fi
  site_url=$("${NETLIFY_CLI[@]}" api getSite --data "{\"site_id\":\"$site_id\"}" | jq -r .ssl_url)
  printf 'Sito: %s\n' "$site_url" >&2
}

supabase_api() {
  local method=$1 path=$2
  shift 2
  curl -fsS -X "$method" "$SUPABASE_API$path" \
    -K <(printf 'header = "Authorization: Bearer %s"\n' "$SUPABASE_ACCESS_TOKEN") \
    -H 'Content-Type: application/json' "$@"
}

wait_until_healthy() {
  local status
  while status=$(supabase_api GET "/projects/$1" | jq -r .status) && [[ $status != ACTIVE_HEALTHY ]]; do
    if [[ $status == INACTIVE ]]; then
      open_page "https://supabase.com/dashboard/project/$1"
      fail "Il progetto $1 è in pausa: ripristinalo dalla dashboard e rilancia il wizard"
    fi
    printf 'Progetto %s: %s, attendo...\n' "$1" "$status" >&2
    sleep 10
  done
}

create_supabase_project() {
  local environment=$1 db_password=$2 lines organization
  lines_to_array < <(supabase_api GET /organizations | jq -r '.[].slug')
  organization=$(choose "Organizzazione Supabase" "${lines[@]}")
  printf '%s' "$db_password" \
    | jq -Rs --arg name "dog-watch-$environment" --arg organization "$organization" --arg region "$SUPABASE_REGION" \
      '{db_pass: ., name: $name, organization_slug: $organization, region_selection: {type: "specific", code: $region}}' \
    | supabase_api POST /projects --data @- \
    | jq -r .ref
}

ask_turn_key() {
  [[ -n ${CLOUDFLARE_TURN_KEY_ID:-} ]] && return
  open_page 'https://dash.cloudflare.com/?to=/:account/calls'
  local name
  for name in "${ASKED_FUNCTION_SECRETS[@]}"; do
    printf -v "$name" '%s' "$(ask_secret "$name dalla chiave TURN di Cloudflare")"
  done
}

set_function_secret() {
  jq -Rs --arg name "$2" '[{name: $name, value: .}]' \
    | supabase_api POST "/projects/$1/secrets" --data @- >/dev/null
  printf 'Segreto %s impostato\n' "$2" >&2
}

configure_function_secrets() {
  local ref=$1 lines name
  lines_to_array < <(supabase_api GET "/projects/$ref/secrets" | jq -r '.[].name')
  local existing=(${lines[@]+"${lines[@]}"})
  for name in "${GENERATED_FUNCTION_SECRETS[@]}"; do
    contains "$name" ${existing[@]+"${existing[@]}"} || openssl rand -base64 32 | tr -d '\n' | set_function_secret "$ref" "$name"
  done
  for name in "${ASKED_FUNCTION_SECRETS[@]}"; do
    if ! contains "$name" ${existing[@]+"${existing[@]}"}; then
      ask_turn_key
      printf '%s' "${!name}" | set_function_secret "$ref" "$name"
    fi
  done
}

configure_supabase_project() {
  local environment=$1 ref
  step "Supabase: progetto $environment"
  ref=$(github_variable SUPABASE_PROJECT_REF "$environment")
  if [[ -z $ref ]]; then
    local db_password
    ref=$(ask "Ref di un progetto esistente per $environment, vuoto per crearne uno nuovo")
    if [[ -z $ref ]]; then
      db_password=$(openssl rand -hex 24)
      ref=$(create_supabase_project "$environment" "$db_password")
    else
      open_page "https://supabase.com/dashboard/project/$ref/database/settings"
      db_password=$(ask_secret "Password del database, reimpostabile dalla pagina aperta")
    fi
    printf '%s' "$db_password" | github_secret SUPABASE_DB_PASSWORD "$environment"
    gh variable set SUPABASE_PROJECT_REF --env "$environment" --body "$ref"
  fi
  wait_until_healthy "$ref"

  local publishable_key
  publishable_key=$(supabase_api GET "/projects/$ref/api-keys" | jq -r 'first(.[] | select(.type == "publishable") | .api_key) // empty')
  [[ -n $publishable_key ]] || fail "Il progetto $ref non ha una publishable key"
  gh variable set VITE_SUPABASE_URL --env "$environment" --body "https://$ref.supabase.co"
  gh variable set VITE_SUPABASE_PUBLISHABLE_KEY --env "$environment" --body "$publishable_key"

  jq -n --arg site_url "$site_url" --argjson jwt_exp "$JWT_EXPIRY_SECONDS" \
    '{external_anonymous_users_enabled: true, jwt_exp: $jwt_exp, site_url: $site_url}' \
    | supabase_api PATCH "/projects/$ref/config/auth" --data @- >/dev/null
  supabase_api PATCH "/projects/$ref/config/realtime" --data '{"private_only": true}' >/dev/null
  printf 'Auth: accesso anonimo attivo, JWT %ss. Realtime: solo canali privati\n' "$JWT_EXPIRY_SECONDS" >&2

  configure_function_secrets "$ref"
}

configure_supabase() {
  step "Supabase"
  open_page https://supabase.com/dashboard/account/tokens
  SUPABASE_ACCESS_TOKEN=$(ask_secret "Access token di Supabase")
  printf '%s' "$SUPABASE_ACCESS_TOKEN" | github_secret SUPABASE_ACCESS_TOKEN
  local environment
  for environment in "${ENVIRONMENTS[@]}"; do
    configure_supabase_project "$environment"
  done
}

main() {
  cd "$root"
  require_tools
  check_function_secrets_are_known
  repo=$(gh repo view --json nameWithOwner --jq .nameWithOwner)
  configure_github
  configure_netlify
  configure_supabase
  step "Fatto"
  printf 'Ogni PR pubblica un\x27anteprima su staging; la produzione (%s) cambia al merge della PR di release.\n' "$site_url" >&2
}

main "$@"
