import { withSupabase } from '@supabase/server'
import { createIceServers, iceServersTtl } from '../_shared/ice-servers.ts'
import '@supabase/functions-js/edge-runtime.d.ts'

export default {
  fetch: withSupabase({ auth: 'user' }, async (req, ctx) => {
    const { roomId } = await req.json()
    if (typeof roomId !== 'string')
      return Response.json({ error: 'invalid_request' }, { status: 400 })

    const { data: member, error } = await ctx.supabaseAdmin
      .from('room_members')
      .select('user_id')
      .eq('room_id', roomId)
      .eq('user_id', ctx.userClaims!.id)
      .maybeSingle()
    if (error)
      throw error
    if (!member)
      return Response.json({ error: 'not_a_member' }, { status: 403 })

    return Response.json({ iceServers: await createIceServers(), iceServersTtl })
  }),
}
