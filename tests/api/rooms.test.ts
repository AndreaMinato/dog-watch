import type { SupabaseClient } from '@supabase/supabase-js'
import { describe, expect, it } from 'vitest'
import { createAdminClient, invokeFunction, signInAnonymously } from './local-supabase'

async function createRoom(name = 'Casa al mare') {
  const user = await signInAnonymously()
  const response = await invokeFunction('create-room', { user, body: { name } })
  return { response, ...(await response.json()) as { roomId: string, key: string } }
}

describe('create room', () => {
  it('returns a four-word key and stores only its hash', async () => {
    const { response, roomId, key } = await createRoom()

    expect(response.status).toBe(200)
    expect(key).toMatch(/^[a-z]+(?:-[a-z]+){3}$/)

    const { data: room } = await createAdminClient().from('rooms').select().eq('id', roomId).single()
    expect(room).toMatchObject({ name: 'Casa al mare', key_hash: expect.stringMatching(/^[0-9a-f]{64}$/) })
    expect(JSON.stringify(room)).not.toContain(key)
  })
})

describe('join room', () => {
  it.each([
    ['as created', (key: string) => key],
    ['in uppercase', (key: string) => key.toUpperCase()],
    ['with spaces', (key: string) => ` ${key.replaceAll('-', '  ')} `],
    ['with mixed separators', (key: string) => key.replace('-', ' - ')],
  ])('accepts the key %s', async (_, typeKey) => {
    const { roomId, key } = await createRoom()
    const user = await signInAnonymously()

    const response = await invokeFunction('join-room', {
      user,
      body: { key: typeKey(key), role: 'viewer', name: 'Andrea' },
    })

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({
      roomId,
      topic: `room:${roomId}`,
      iceServers: [{ urls: 'stun:stun.cloudflare.com:3478' }],
    })
  })

  it('answers unknown and malformed keys identically', async () => {
    const user = await signInAnonymously()
    const join = async (key: unknown) => {
      const response = await invokeFunction('join-room', { user, body: { key, role: 'viewer', name: 'Andrea' } })
      return { status: response.status, body: await response.text() }
    }

    const unknown = await join('abaco-abete-abisso-zuppa')

    expect(unknown).toEqual({ status: 403, body: JSON.stringify({ error: 'invalid_key' }) })
    expect(await join('non è una chiave!')).toEqual(unknown)
    expect(await join('abaco-abete-abisso')).toEqual(unknown)
    expect(await join(42)).toEqual(unknown)
  })
})

describe('room channel', () => {
  async function subscribe(user: SupabaseClient, topic: string) {
    await user.realtime.setAuth()
    const channel = user.channel(topic, { config: { private: true } })
    const status = await new Promise<string>((resolve) => {
      channel.subscribe(status => resolve(status))
    })
    await user.removeChannel(channel)
    return status
  }

  it('admits room members', async () => {
    const { key } = await createRoom()
    const member = await signInAnonymously()
    const { topic } = await (await invokeFunction('join-room', {
      user: member,
      body: { key, role: 'camera', name: 'soggiorno' },
    })).json()

    expect(await subscribe(member, topic)).toBe('SUBSCRIBED')
  })

  it('rejects anonymous users who are not members', async () => {
    const { roomId } = await createRoom()
    const outsider = await signInAnonymously()

    expect(await subscribe(outsider, `room:${roomId}`)).toBe('CHANNEL_ERROR')
  })

  it('rejects members who left the room', async () => {
    const { roomId, key } = await createRoom()
    const member = await signInAnonymously()
    await invokeFunction('join-room', { user: member, body: { key, role: 'viewer', name: 'Andrea' } })

    const response = await invokeFunction('leave-room', { user: member, body: { roomId } })

    expect(response.status).toBe(204)
    expect(await subscribe(member, `room:${roomId}`)).toBe('CHANNEL_ERROR')
  })
})
