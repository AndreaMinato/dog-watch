import type { SupabaseContext } from '@supabase/server'
import { withSupabase } from '@supabase/server'
import { createIceServers, iceServersTtl, readTurnKey } from '../_shared/ice-servers.ts'
import { withRoomId } from '../_shared/room-request.ts'
import '@supabase/functions-js/edge-runtime.d.ts'

const turnKey = readTurnKey(name => Deno.env.get(name))

export default {
  fetch: withSupabase({ auth: 'user' }, withRoomId<SupabaseContext>(async (roomId, ctx) => {
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

    return Response.json({ iceServers: await createIceServers(turnKey), iceServersTtl })
  })),
}
