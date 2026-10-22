#!/usr/bin/env bash
# Gives this worktree its own local Supabase stack and Vite port, so parallel agents don't collide.
# The edits are local-only and hidden from git (skip-worktree): never commit them.
# Usage, from a worktree root: scripts/worktree-slot.sh on <k> | off | status
set -euo pipefail
files=(.env supabase/config.toml playwright.config.ts)
case "${1:-}" in
  on)
    k="${2:?slot number, 1-9}"; offset=$((k * 1000)); vite_port=$((5173 + k * 10))
    git update-index --no-skip-worktree "${files[@]}"
    git checkout -- "${files[@]}"
    perl -pi -e "s/^project_id = .*/project_id = \"dog-watch-s$k\"/; s/^(\s*(?:port|shadow_port)\s*=\s*)(54\d\d\d)/\$1.(\$2+$offset)/e; s/^(inspector_port\s*=\s*)(\d+)/\$1.(\$2+$k)/e" supabase/config.toml
    perl -pi -e "s/(127\.0\.0\.1|localhost):54321/\$1:$((54321 + offset))/" .env
    perl -pi -e "s/: 5173/: $vite_port/; s/'pnpm dev'/'pnpm dev --port $vite_port --strictPort'/" playwright.config.ts
    git update-index --skip-worktree "${files[@]}"
    echo "slot $k: supabase api :$((54321 + offset)), vite :$vite_port" ;;
  off)
    git update-index --no-skip-worktree "${files[@]}"
    git checkout -- "${files[@]}"
    echo "slot off" ;;
  status)
    git ls-files -v "${files[@]}"
    grep -E '^project_id' supabase/config.toml ;;
  *)
    echo "usage: $0 on <k> | off | status" >&2; exit 1 ;;
esac
