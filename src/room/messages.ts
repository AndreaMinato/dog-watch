import type { Species } from '../mascot/mascot'
import type { Refusal, Role } from './room-client'
import { InvalidKeyError, MEMBER_LIMITS, RoomRefusedError, TooManyAttemptsError } from './room-client'

export const roleLabels: Record<Role, string> = { camera: 'Telecamera', viewer: 'Spettatore' }

export const speciesLabels: Record<Species, string> = { dog: 'Cane', cat: 'Gatto', rabbit: 'Coniglio' }

export const somethingWentWrong = 'Qualcosa è andato storto, riprova.'

export const screenMayTurnOff = 'Il browser non tiene acceso lo schermo: se si spegne, la telecamera smette di trasmettere. Disattiva il risparmio energetico o metti in carica il dispositivo.'

export const refusalMessages: Record<Refusal, string> = {
  cameras_full: `La Stanza ha già ${MEMBER_LIMITS.camera} telecamere: non puoi entrare come telecamera.`,
  viewers_full: `La Stanza ha già ${MEMBER_LIMITS.viewer} Spettatori: non puoi entrare come Spettatore.`,
  camera_name_taken: 'Nella Stanza c\'è già una telecamera con questo nome: scegline un altro.',
}

export function joinErrorMessage(cause: unknown): string {
  if (cause instanceof InvalidKeyError)
    return 'Chiave non valida'
  if (cause instanceof TooManyAttemptsError)
    return 'Troppi tentativi, riprova più tardi.'
  if (cause instanceof RoomRefusedError)
    return refusalMessages[cause.refusal]
  return somethingWentWrong
}
