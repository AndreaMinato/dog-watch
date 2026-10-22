import { describe, expect, it } from 'vitest'
import { createRoom, invokeFunction, signInAnonymously } from './local-supabase'

const dayInSeconds = 24 * 60 * 60

function expectTurnAndStun(iceServers: RTCIceServer[]) {
  const urls = iceServers.flatMap(server => [server.urls].flat())
  expect(urls).toContain('stun:stun.cloudflare.com:3478')
  expect(iceServers).toContainEqual({
    urls: expect.arrayContaining([expect.stringMatching(/^turns?:turn\.cloudflare\.com:\d+/)]),
    username: expect.any(String),
    credential: expect.any(String),
  })
  expect(urls.filter(url => /:53(?:\?|$)/.test(url))).toEqual([])
}

async function joinAsCamera() {
  const { roomId, key } = await createRoom()
  const member = await signInAnonymously()
  const response = await invokeFunction('join-room', { user: member, body: { key, role: 'camera', name: 'soggiorno' } })
  return { roomId, member, response }
}

describe('ice servers', () => {
  it('come with joining: TURN and STUN valid for 24 hours, nothing on port 53', async () => {
    const { response } = await joinAsCamera()

    const { iceServers, iceServersTtl } = await response.json()

    expectTurnAndStun(iceServers)
    expect(iceServersTtl).toBe(dayInSeconds)
  })

  it('are renewed for a member with fresh TURN credentials', async () => {
    const { roomId, member, response } = await joinAsCamera()
    const { iceServers: joined } = await response.json()

    const renewal = await invokeFunction('ice-credentials', { user: member, body: { roomId } })

    expect(renewal.status).toBe(200)
    const { iceServers, iceServersTtl } = await renewal.json()
    expectTurnAndStun(iceServers)
    expect(iceServersTtl).toBe(dayInSeconds)
    const turnUsername = (servers: RTCIceServer[]) => servers.find(server => server.username)!.username
    expect(turnUsername(iceServers)).not.toBe(turnUsername(joined))
  })

  it('are refused to anyone who is not a member of the room', async () => {
    const { roomId } = await createRoom()
    const outsider = await signInAnonymously()

    const response = await invokeFunction('ice-credentials', { user: outsider, body: { roomId } })

    expect(response.status).toBe(403)
    expect(await response.json()).toEqual({ error: 'not_a_member' })
  })

  it('are refused to a member who left the room', async () => {
    const { roomId, member } = await joinAsCamera()
    await invokeFunction('leave-room', { user: member, body: { roomId } })

    const response = await invokeFunction('ice-credentials', { user: member, body: { roomId } })

    expect(response.status).toBe(403)
  })
})
