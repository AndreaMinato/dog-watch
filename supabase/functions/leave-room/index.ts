import { withSupabase } from '@supabase/server'
import '@supabase/functions-js/edge-runtime.d.ts'

export default {
  fetch: withSupabase({ auth: 'user' }, async (req, ctx) => {
    const { roomId } = await req.json()
    if (typeof roomId !== 'string')
      return Response.json({ error: 'invalid_request' }, { status: 400 })

    const { error } = await ctx.supabaseAdmin
      .from('room_members')
      .delete()
      .eq('room_id', roomId)
      .eq('user_id', ctx.userClaims!.id)
    if (error)
      throw error

    return new Response(null, { status: 204 })
  }),
}
