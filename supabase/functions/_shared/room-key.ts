import { hmacSha256Hex } from './hmac.ts'
import { italianWords } from './italian-words.ts'

const wordsPerKey = 4

export function generateRoomKey(): string {
  // 2048 divides 2^16, so masking the low 11 bits keeps every word equally likely.
  const indexes = crypto.getRandomValues(new Uint16Array(wordsPerKey))
  return Array.from(indexes, index => italianWords[index & 2047]).join('-')
}

export function normalizeRoomKey(input: string): string {
  return input.toLowerCase().split(/[\s-]+/).filter(Boolean).join('-')
}

export function hashRoomKey(key: string, pepper: string): Promise<string> {
  return hmacSha256Hex(key, pepper)
}
