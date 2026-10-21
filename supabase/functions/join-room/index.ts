import { withSupabase } from '@supabase/server'
import { parseName } from '../_shared/name.ts'
import { hashRoomKey, normalizeRoomKey } from '../_shared/room-key.ts'
import '@supabase/functions-js/edge-runtime.d.ts'

const pepper = Deno.env.get('ROOM_KEY_PEPPER')
if (!pepper)
  throw new Error('ROOM_KEY_PEPPER is not set')

const roles = ['camera', 'viewer']

export default {
  fetch: withSupabase({ auth: 'user' }, async (req, ctx) => {
    const { key, role, name } = await req.json()
    const memberName = parseName(name)
    if (!roles.includes(role) || !memberName)
      return Response.json({ error: 'invalid_request' }, { status: 400 })

    // Malformed and unknown keys follow the same path: hash, then look up a hash that
    // only a well-formed key can match, so both fail with the same work and response.
    const keyHash = await hashRoomKey(normalizeRoomKey(typeof key === 'string' ? key : ''), pepper)
    const now = new Date().toISOString()
    const { data: room, error } = await ctx.supabaseAdmin
      .from('rooms')
      .update({ last_joined_at: now })
      .eq('key_hash', keyHash)
      .select('id')
      .maybeSingle()
    if (error)
      throw error
    if (!room)
      return Response.json({ error: 'invalid_key' }, { status: 403 })

    const { error: memberError } = await ctx.supabaseAdmin
      .from('room_members')
      .upsert({ room_id: room.id, user_id: ctx.userClaims!.id, role, name: memberName, joined_at: now })
    if (memberError)
      throw memberError

    return Response.json({ roomId: room.id, topic: `room:${room.id}` })
  }),
}
