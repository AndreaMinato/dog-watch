import { withSupabase } from '@supabase/server'
import { hashClientIp } from '../_shared/client-ip.ts'
import { parseName } from '../_shared/name.ts'
import { hashRoomKey, normalizeRoomKey } from '../_shared/room-key.ts'
import '@supabase/functions-js/edge-runtime.d.ts'

const pepper = Deno.env.get('ROOM_KEY_PEPPER')
if (!pepper)
  throw new Error('ROOM_KEY_PEPPER is not set')
const ipHashSalt = Deno.env.get('IP_HASH_SALT')
if (!ipHashSalt)
  throw new Error('IP_HASH_SALT is not set')

const roles = ['camera', 'viewer']
const maxFailedAttemptsPerHour = 10
const hourInMs = 60 * 60 * 1000

export default {
  fetch: withSupabase({ auth: 'user' }, async (req, ctx) => {
    const { key, role, name } = await req.json()
    const memberName = parseName(name)
    if (!roles.includes(role) || !memberName)
      return Response.json({ error: 'invalid_request' }, { status: 400 })

    const ipHash = await hashClientIp(req, ipHashSalt)
    const { count: recentFailures, error: countError } = await ctx.supabaseAdmin
      .from('failed_join_attempts')
      .select('*', { count: 'exact', head: true })
      .eq('ip_hash', ipHash)
      .gt('attempted_at', new Date(Date.now() - hourInMs).toISOString())
    if (countError)
      throw countError
    if (recentFailures! >= maxFailedAttemptsPerHour)
      return Response.json({ error: 'too_many_attempts' }, { status: 429 })

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
    if (!room) {
      const { error: attemptError } = await ctx.supabaseAdmin.from('failed_join_attempts').insert({ ip_hash: ipHash })
      if (attemptError)
        throw attemptError
      return Response.json({ error: 'invalid_key' }, { status: 403 })
    }

    const { error: memberError } = await ctx.supabaseAdmin
      .from('room_members')
      .upsert({ room_id: room.id, user_id: ctx.userClaims!.id, role, name: memberName, joined_at: now })
    if (memberError)
      throw memberError

    return Response.json({ roomId: room.id, topic: `room:${room.id}` })
  }),
}
