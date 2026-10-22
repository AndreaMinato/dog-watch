import { withSupabase } from '@supabase/server'
import '@supabase/functions-js/edge-runtime.d.ts'

export default {
  fetch: withSupabase({ auth: 'user' }, async (req, ctx) => {
    const { roomId } = await req.json()
    if (typeof roomId !== 'string')
      return Response.json({ error: 'invalid_request' }, { status: 400 })

    const { data: closed, error } = await ctx.supabaseAdmin.rpc('close_room', {
      target_room: roomId,
      caller: ctx.userClaims!.id,
    })
    if (error)
      throw error
    if (!closed)
      return Response.json({ error: 'not_a_camera' }, { status: 403 })

    return new Response(null, { status: 204 })
  }),
}
