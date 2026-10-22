import type { Refusal } from './room-client'
import { InvalidKeyError, MEMBER_LIMITS, RoomRefusedError, TooManyAttemptsError } from './room-client'

export const refusalMessages: Record<Refusal, string> = {
  cameras_full: `La Stanza ha già ${MEMBER_LIMITS.camera} Camere: non puoi entrare come Camera.`,
  viewers_full: `La Stanza ha già ${MEMBER_LIMITS.viewer} Spettatori: non puoi entrare come Spettatore.`,
  camera_name_taken: 'Nella Stanza c\'è già una Camera con questo nome: scegline un altro.',
}

export function joinErrorMessage(cause: unknown): string {
  if (cause instanceof InvalidKeyError)
    return 'Chiave non valida'
  if (cause instanceof TooManyAttemptsError)
    return 'Troppi tentativi, riprova più tardi.'
  if (cause instanceof RoomRefusedError)
    return refusalMessages[cause.refusal]
  return 'Qualcosa è andato storto, riprova.'
}
