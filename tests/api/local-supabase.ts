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
  ip?: string
}

export function randomIp(): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(4))).join('.')
}

/**
 * The local gateway is not behind Cloudflare, so tests set its client IP header themselves.
 * Each call gets its own IP by default, so failed attempts never leak between tests.
 */
export async function invokeFunction(name: string, { user, body, ip = randomIp() }: InvokeOptions = {}): Promise<Response> {
  const headers: Record<string, string> = { 'apikey': status.PUBLISHABLE_KEY, 'cf-connecting-ip': ip }
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

export async function createRoom(name = 'Casa al mare') {
  const user = await signInAnonymously()
  const response = await invokeFunction('create-room', { user, body: { name } })
  return { response, ...(await response.json()) as { roomId: string, key: string } }
}

export async function channelStatus(user: SupabaseClient, topic: string): Promise<string> {
  await user.realtime.setAuth()
  const channel = user.channel(topic, { config: { private: true } })
  const status = await new Promise<string>((resolve) => {
    channel.subscribe(status => resolve(status))
  })
  await user.removeChannel(channel)
  return status
}
