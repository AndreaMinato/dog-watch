import { withSupabase } from '@supabase/server'
import { generateRoomKey, hashRoomKey } from '../_shared/room-key.ts'
import '@supabase/functions-js/edge-runtime.d.ts'

const pepper = Deno.env.get('ROOM_KEY_PEPPER')
if (!pepper)
  throw new Error('ROOM_KEY_PEPPER is not set')

export default {
  fetch: withSupabase({ auth: 'user' }, async (req, ctx) => {
    const { roomId } = await req.json()
    if (typeof roomId !== 'string')
      return Response.json({ error: 'invalid_request' }, { status: 400 })

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
  }),
}
