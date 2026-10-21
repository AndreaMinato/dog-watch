import type { SupabaseClient } from '@supabase/supabase-js'
import { execFileSync } from 'node:child_process'
import { createClient } from '@supabase/supabase-js'

interface LocalSupabaseStatus {
  API_URL: string
  FUNCTIONS_URL: string
  PUBLISHABLE_KEY: string
  SECRET_KEY: string
}

const status: LocalSupabaseStatus = JSON.parse(
  execFileSync('supabase', ['status', '--output', 'json'], { encoding: 'utf8' }),
)

const clientOptions = { auth: { persistSession: false, autoRefreshToken: false } }

interface InvokeOptions {
  user?: SupabaseClient
  body?: unknown
}

export async function invokeFunction(name: string, { user, body }: InvokeOptions = {}): Promise<Response> {
  const headers: Record<string, string> = { apikey: status.PUBLISHABLE_KEY }
  if (user) {
    const { data } = await user.auth.getSession()
    headers.Authorization = `Bearer ${data.session?.access_token}`
  }
  return fetch(`${status.FUNCTIONS_URL}/${name}`, {
    method: body === undefined ? 'GET' : 'POST',
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  })
}

export async function signInAnonymously(): Promise<SupabaseClient> {
  const client = createClient(status.API_URL, status.PUBLISHABLE_KEY, clientOptions)
  const { error } = await client.auth.signInAnonymously()
  if (error)
    throw error
  return client
}

export function createAdminClient(): SupabaseClient {
  return createClient(status.API_URL, status.SECRET_KEY, clientOptions)
}
