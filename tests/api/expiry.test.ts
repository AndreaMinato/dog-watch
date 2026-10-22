import { describe, expect, it } from 'vitest'
import { createAdminClient, createRoom, invokeFunction, signInAnonymously } from './local-supabase'

const admin = createAdminClient()
const dayInMs = 24 * 60 * 60 * 1000

function hoursAgo(hours: number): string {
  return new Date(Date.now() - hours * 60 * 60 * 1000).toISOString()
}

async function roomLastJoined(daysAgo: number): Promise<string> {
  const { roomId, key } = await createRoom()
  const user = await signInAnonymously()
  await invokeFunction('join-room', { user, body: { key, role: 'camera', name: 'soggiorno' } })
  const { error } = await admin
    .from('rooms')
    .update({ last_joined_at: new Date(Date.now() - daysAgo * dayInMs).toISOString() })
    .eq('id', roomId)
  if (error)
    throw error
  return roomId
}

async function purgeExpired() {
  const { error } = await admin.rpc('purge_expired')
  if (error)
    throw error
}

describe('cleanup', () => {
  it('deletes rooms nobody joined for more than 30 days, with their members', async () => {
    const expired = await roomLastJoined(31)
    const active = await roomLastJoined(29)

    await purgeExpired()

    const { data: rooms } = await admin.from('rooms').select('id').in('id', [expired, active])
    expect(rooms).toEqual([{ id: active }])
    const { data: members } = await admin.from('room_members').select('room_id').eq('room_id', expired)
    expect(members).toEqual([])
  })

  it('deletes failed join attempts older than 24 hours', async () => {
    const { data: attempts, error } = await admin
      .from('failed_join_attempts')
      .insert([
        { ip_hash: 'expired', attempted_at: hoursAgo(25) },
        { ip_hash: 'recent', attempted_at: hoursAgo(23) },
      ])
      .select('id, ip_hash')
    if (error)
      throw error

    await purgeExpired()

    const { data: remaining } = await admin
      .from('failed_join_attempts')
      .select('id, ip_hash')
      .in('id', attempts.map(attempt => attempt.id))
    expect(remaining).toEqual([attempts.find(attempt => attempt.ip_hash === 'recent')])
  })

  it('is not callable by clients', async () => {
    const user = await signInAnonymously()

    const { error } = await user.rpc('purge_expired')

    expect(error).toMatchObject({ code: '42501' })
  })
})
