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

export async function hashRoomKey(key: string, pepper: string): Promise<string> {
  const encoder = new TextEncoder()
  const hmacKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(pepper),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const signature = await crypto.subtle.sign('HMAC', hmacKey, encoder.encode(key))
  return Array.from(new Uint8Array(signature), byte => byte.toString(16).padStart(2, '0')).join('')
}
