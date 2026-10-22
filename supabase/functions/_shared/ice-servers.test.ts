import { describe, expect, it } from 'vitest'
import { createIceServers, readTurnKey } from './ice-servers.ts'

describe('ice servers without a TURN key', () => {
  it.each([
    ['unset', {}],
    ['empty', { CLOUDFLARE_TURN_KEY_ID: '', CLOUDFLARE_TURN_KEY_API_TOKEN: '' }],
  ])('are only the Cloudflare STUN server when the key is %s', async (_, env: Record<string, string>) => {
    const iceServers = await createIceServers(readTurnKey(name => env[name]))

    expect(iceServers).toEqual([{ urls: 'stun:stun.cloudflare.com:3478' }])
  })
})
