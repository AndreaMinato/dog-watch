import { InvalidKeyError, RoomRefusedError, TooManyAttemptsError } from '../room/room-client'
import { refusalMessages } from './refusal-messages'

export function joinErrorMessage(cause: unknown): string {
  if (cause instanceof InvalidKeyError)
    return 'Chiave non valida'
  if (cause instanceof TooManyAttemptsError)
    return 'Troppi tentativi, riprova più tardi.'
  if (cause instanceof RoomRefusedError)
    return refusalMessages[cause.refusal]
  return 'Qualcosa è andato storto, riprova.'
}
