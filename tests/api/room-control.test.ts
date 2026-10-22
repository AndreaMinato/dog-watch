import type { SupabaseClient } from '@supabase/supabase-js'
import { describe, expect, it } from 'vitest'
import { channelStatus, createRoom, invokeFunction, signInAnonymously } from './local-supabase'

async function join(key: string, role: 'camera' | 'viewer', name: string) {
  const user = await signInAnonymously()
  const response = await invokeFunction('join-room', { user, body: { key, role, name } })
  expect(response.status).toBe(200)
  return user
}

async function listenForControl(user: SupabaseClient, roomId: string) {
  await user.realtime.setAuth()
  const channel = user.channel(`room:${roomId}`, { config: { private: true } })
  const event = new Promise<unknown>((resolve) => {
    channel.on('broadcast', { event: 'control' }, ({ payload }) => resolve(payload))
  })
  await new Promise<void>((resolve, reject) => {
    channel.subscribe(status => status === 'SUBSCRIBED' ? resolve() : reject(new Error(status)))
  })
  return { received: event.finally(() => user.removeChannel(channel)) }
}

async function rotateKey(user: SupabaseClient, roomId: string) {
  return invokeFunction('rotate-key', { user, body: { roomId } })
}

describe('rotate key', () => {
  it('refuses viewers', async () => {
    const { roomId, key } = await createRoom()
    const viewer = await join(key, 'viewer', 'Andrea')

    const response = await rotateKey(viewer, roomId)

    expect(response.status).toBe(403)
    expect(await response.json()).toEqual({ error: 'not_a_camera' })
  })

  it('invalidates the previous key, expels every other member and returns a working key', async () => {
    const { roomId, key } = await createRoom()
    const camera = await join(key, 'camera', 'soggiorno')
    const otherCamera = await join(key, 'camera', 'cucina')
    const viewer = await join(key, 'viewer', 'Andrea')

    const response = await rotateKey(camera, roomId)

    expect(response.status).toBe(200)
    const { key: newKey } = await response.json()
    expect(newKey).toMatch(/^[a-z]+(?:-[a-z]+){3}$/)
    expect(newKey).not.toBe(key)
    const topic = `room:${roomId}`
    expect(await channelStatus(camera, topic)).toBe('SUBSCRIBED')
    expect(await channelStatus(otherCamera, topic)).toBe('CHANNEL_ERROR')
    expect(await channelStatus(viewer, topic)).toBe('CHANNEL_ERROR')
    const oldKeyJoin = await invokeFunction('join-room', { user: viewer, body: { key, role: 'viewer', name: 'Andrea' } })
    expect(oldKeyJoin.status).toBe(403)
    expect(await oldKeyJoin.json()).toEqual({ error: 'invalid_key' })
    await join(newKey, 'viewer', 'Andrea')
  })

  it('tells the members on the channel who rotated the key', async () => {
    const { roomId, key } = await createRoom()
    const camera = await join(key, 'camera', 'soggiorno')
    const viewer = await join(key, 'viewer', 'Andrea')
    const control = await listenForControl(viewer, roomId)

    await rotateKey(camera, roomId)

    const { data } = await camera.auth.getSession()
    expect(await control.received).toMatchObject({ event: { type: 'key_rotated', by: data.session!.user.id } })
  })
})

describe('close room', () => {
  async function closeRoom(user: SupabaseClient, roomId: string) {
    return invokeFunction('close-room', { user, body: { roomId } })
  }

  it('refuses viewers', async () => {
    const { roomId, key } = await createRoom()
    const viewer = await join(key, 'viewer', 'Andrea')

    const response = await closeRoom(viewer, roomId)

    expect(response.status).toBe(403)
    expect(await response.json()).toEqual({ error: 'not_a_camera' })
    await join(key, 'viewer', 'Andrea')
  })

  it('tells the members and makes the key stop working', async () => {
    const { roomId, key } = await createRoom()
    const camera = await join(key, 'camera', 'soggiorno')
    const viewer = await join(key, 'viewer', 'Andrea')
    const control = await listenForControl(viewer, roomId)

    const response = await closeRoom(camera, roomId)

    expect(response.status).toBe(204)
    expect(await control.received).toMatchObject({ event: { type: 'room_closed' } })
    expect(await channelStatus(camera, `room:${roomId}`)).toBe('CHANNEL_ERROR')
    const rejoin = await invokeFunction('join-room', { user: camera, body: { key, role: 'camera', name: 'soggiorno' } })
    expect(rejoin.status).toBe(403)
  })
})

describe('anonymous session', () => {
  it('expires after ten minutes, bounding how long an expelled device keeps the channel', async () => {
    const user = await signInAnonymously()

    const { data } = await user.auth.getSession()

    expect(data.session?.expires_in).toBe(600)
  })
})
