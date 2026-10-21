import { execFileSync } from 'node:child_process'

interface LocalSupabaseStatus {
  FUNCTIONS_URL: string
  PUBLISHABLE_KEY: string
}

const status: LocalSupabaseStatus = JSON.parse(
  execFileSync('supabase', ['status', '--output', 'json'], { encoding: 'utf8' }),
)

export function invokeFunction(name: string): Promise<Response> {
  return fetch(`${status.FUNCTIONS_URL}/${name}`, {
    headers: { apikey: status.PUBLISHABLE_KEY },
  })
}
