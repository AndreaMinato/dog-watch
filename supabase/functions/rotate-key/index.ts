import type { SupabaseContext } from '@supabase/server'
import { withSupabase } from '@supabase/server'
import { generateRoomKey, hashRoomKey, readRoomKeyPepper } from '../_shared/room-key.ts'
import { withRoomId } from '../_shared/room-request.ts'
import '@supabase/functions-js/edge-runtime.d.ts'

const pepper = readRoomKeyPepper(name => Deno.env.get(name))

export default {
  fetch: withSupabase({ auth: 'user' }, withRoomId<SupabaseContext>(async (roomId, ctx) => {
    const key = generateRoomKey()
    const { data: rotated, error } = await ctx.supabaseAdmin.rpc('rotate_room_key', {
      target_room: roomId,
      caller: ctx.userClaims!.id,
      new_key_hash: await hashRoomKey(key, pepper),
    })
    if (error)
      throw error
    if (!rotated)
      return Response.json({ error: 'not_a_camera' }, { status: 403 })

    return Response.json({ key })
  })),
}
