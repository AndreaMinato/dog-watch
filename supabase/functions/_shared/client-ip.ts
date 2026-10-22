import { hmacSha256Hex } from './hmac.ts'

// Cloudflare sets cf-connecting-ip and overwrites any client value. x-forwarded-for is
// client-controlled except for its last entry, appended by the nearest proxy.
function clientIp(req: Request): string {
  return req.headers.get('cf-connecting-ip')
    ?? req.headers.get('x-forwarded-for')?.split(',').at(-1)?.trim()
    ?? ''
}

export function hashClientIp(req: Request, salt: string): Promise<string> {
  return hmacSha256Hex(clientIp(req), salt)
}
