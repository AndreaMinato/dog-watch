import type { SupabaseContext } from '@supabase/server'
import { withSupabase } from '@supabase/server'
import { withRoomId } from '../_shared/room-request.ts'
import '@supabase/functions-js/edge-runtime.d.ts'

export default {
  fetch: withSupabase({ auth: 'user' }, withRoomId<SupabaseContext>(async (roomId, ctx) => {
    const { data: closed, error } = await ctx.supabaseAdmin.rpc('close_room', {
      target_room: roomId,
      caller: ctx.userClaims!.id,
    })
    if (error)
      throw error
    if (!closed)
      return Response.json({ error: 'not_a_camera' }, { status: 403 })

    return new Response(null, { status: 204 })
  })),
}
