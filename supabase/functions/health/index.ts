import { withSupabase } from '@supabase/server'
import '@supabase/functions-js/edge-runtime.d.ts'

export default {
  fetch: withSupabase({ auth: 'publishable' }, () => Response.json({ status: 'ok' })),
}
