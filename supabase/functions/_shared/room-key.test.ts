import { describe, expect, it } from 'vitest'
import { italianWords } from './italian-words.ts'
import { generateRoomKey, hashRoomKey, normalizeRoomKey } from './room-key.ts'

describe('room key word list', () => {
  it('has 2048 distinct lowercase words without accents', () => {
    expect(italianWords).toHaveLength(2048)
    expect(new Set(italianWords).size).toBe(2048)
    expect(italianWords.every(word => /^[a-z]+$/.test(word))).toBe(true)
  })
})

describe('generateRoomKey', () => {
  it('returns four listed words in canonical hyphenated form', () => {
    const words = generateRoomKey().split('-')

    expect(words).toHaveLength(4)
    expect(words.every(word => italianWords.includes(word))).toBe(true)
  })

  it('returns a different key each time', () => {
    expect(generateRoomKey()).not.toBe(generateRoomKey())
  })
})

describe('normalizeRoomKey', () => {
  it.each([
    'lupo-mela-tetto-sette',
    'LUPO-Mela-TeTTo-sette',
    'lupo mela tetto sette',
    '  lupo  mela - tetto--sette  ',
    'Lupo Mela-Tetto Sette',
  ])('turns "%s" into the canonical form', (input) => {
    expect(normalizeRoomKey(input)).toBe('lupo-mela-tetto-sette')
  })
})

describe('hashRoomKey', () => {
  it('is the HMAC-SHA256 of the key with the pepper, in hex', async () => {
    expect(await hashRoomKey('lupo-mela-tetto-sette', 'test-pepper'))
      .toBe('fd7f4c8f995bdaab8049ac5de461cfa677568db8cfc1275e47ec4a275f142654')
  })
})
