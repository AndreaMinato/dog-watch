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
