import { describe, expect, it } from 'vitest'
import { createAdminClient, createRoom, invokeFunction, randomIp, signInAnonymously } from './local-supabase'

const wrongKey = 'abaco-abete-abisso-zuppa'

async function join(key: string, ip: string) {
  const user = await signInAnonymously()
  const response = await invokeFunction('join-room', { user, ip, body: { key, role: 'viewer', name: 'Andrea' } })
  return { status: response.status, body: await response.json() }
}

async function failTimes(times: number, ip: string) {
  for (let attempt = 0; attempt < times; attempt++)
    expect(await join(wrongKey, ip)).toEqual({ status: 403, body: { error: 'invalid_key' } })
}

describe('failed join attempts', () => {
  it('block an IP after ten failures in an hour', async () => {
    const ip = randomIp()
    await failTimes(10, ip)

    expect(await join(wrongKey, ip)).toEqual({ status: 429, body: { error: 'too_many_attempts' } })
  })
  it('do not count successful joins', async () => {
    const { roomId, key } = await createRoom()
    const ip = randomIp()
    await failTimes(9, ip)
    for (let attempt = 0; attempt < 3; attempt++)
      expect(await join(key, ip)).toMatchObject({ status: 200, body: { roomId } })

    expect(await join(wrongKey, ip)).toEqual({ status: 403, body: { error: 'invalid_key' } })
    expect(await join(key, ip)).toEqual({ status: 429, body: { error: 'too_many_attempts' } })
  })

  it('never lock the right key out of a room from another IP', async () => {
    const { roomId, key } = await createRoom()
    const attackerIp = randomIp()
    await failTimes(10, attackerIp)
    expect(await join(key, attackerIp)).toMatchObject({ status: 429 })

    expect(await join(key, randomIp())).toMatchObject({ status: 200, body: { roomId } })
  })

  it('store the IP only as a hash', async () => {
    const ip = randomIp()
    await failTimes(1, ip)

    const { data: attempts } = await createAdminClient()
      .from('failed_join_attempts')
      .select()
      .gt('attempted_at', new Date(Date.now() - 60_000).toISOString())
    expect(attempts!.length).toBeGreaterThan(0)
    expect(attempts).toContainEqual(expect.objectContaining({ ip_hash: expect.stringMatching(/^[0-9a-f]{64}$/) }))
    expect(JSON.stringify(attempts)).not.toContain(ip)
  })
})
