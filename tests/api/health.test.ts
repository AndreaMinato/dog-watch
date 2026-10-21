import { describe, expect, it } from 'vitest'
import { invokeFunction } from './local-supabase'

describe('health', () => {
  it('risponde che le Edge Functions sono attive', async () => {
    const response = await invokeFunction('health')

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ status: 'ok' })
  })
})
