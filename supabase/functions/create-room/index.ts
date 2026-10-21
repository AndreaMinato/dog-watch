import { withSupabase } from '@supabase/server'
import { parseName } from '../_shared/name.ts'
import { generateRoomKey, hashRoomKey } from '../_shared/room-key.ts'
import '@supabase/functions-js/edge-runtime.d.ts'

const pepper = Deno.env.get('ROOM_KEY_PEPPER')
if (!pepper)
  throw new Error('ROOM_KEY_PEPPER is not set')

export default {
  fetch: withSupabase({ auth: 'user' }, async (req, ctx) => {
    const { name } = await req.json()
    const roomName = parseName(name)
    if (!roomName)
      return Response.json({ error: 'invalid_request' }, { status: 400 })

    const key = generateRoomKey()
    const { data: room, error } = await ctx.supabaseAdmin
      .from('rooms')
      .insert({ name: roomName, key_hash: await hashRoomKey(key, pepper) })
      .select('id')
      .single()
    if (error)
      throw error

    return Response.json({ roomId: room.id, key })
  }),
}
