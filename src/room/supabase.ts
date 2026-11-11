import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
)

export async function ensureAnonymousSession(): Promise<void> {
  const { data } = await supabase.auth.getSession()
  if (data.session)
    return
  const { error } = await supabase.auth.signInAnonymously()
  if (error)
    throw error
}

/** A failed call to the service is tried again after 1 s, then twice as long each time, up to 30 s. */
export function nextRetryDelay(previous?: number): number {
  return previous === undefined ? 1_000 : Math.min(previous * 2, 30_000)
}
