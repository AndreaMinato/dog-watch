import type { Species } from '../mascot/mascot'
import type { CameraStatus, Refusal, Role } from './room-client'
import { FunctionsFetchError } from '@supabase/supabase-js'
import { appName } from '../brand'
import { InvalidKeyError, MEMBER_LIMITS, RoomRefusedError, TooManyAttemptsError } from './room-client'

export const roleLabels: Record<Role, string> = { camera: 'Telecamera', viewer: 'Spettatore' }

/** A camera says "Collegamento…" until its own stream exists. */
export type ShownStatus = CameraStatus | 'connecting'

export const statusLabels: Record<ShownStatus, string> = { connecting: 'Collegamento…', live: 'In diretta', paused: 'In pausa' }

export const speciesLabels: Record<Species, string> = { dog: 'Cane', cat: 'Gatto', rabbit: 'Coniglio' }

export const somethingWentWrong = 'Qualcosa è andato storto, riprova.'

export const serviceUnreachable = `${appName} non riesce a raggiungere il servizio. Controlla la connessione a internet e riprova.`

const thenReload = 'poi ricarica la pagina o riapri l\'app.'

export function cameraErrorMessage(cause: unknown): string {
  switch (cause instanceof DOMException && cause.name) {
    case 'NotAllowedError':
      return `Permesso negato per fotocamera e microfono: consentili nelle impostazioni del sito, ${thenReload}`
    case 'NotFoundError':
      return `Fotocamera o microfono non trovati: collegali, ${thenReload}`
    case 'NotReadableError':
      return `Fotocamera o microfono occupati da un'altra app: chiudila, ${thenReload}`
    default:
      return somethingWentWrong
  }
}

export const installedCameraNeedsIos184 = 'Con l\'app installata su iPhone o iPad serve iOS 18.4 o successivo, perché lo schermo resti acceso.'

export const screenMayTurnOff = 'Il browser non tiene acceso lo schermo: se si spegne, la telecamera smette di trasmettere. Disattiva il risparmio energetico o metti in carica il dispositivo.'

const clock = new Intl.DateTimeFormat('it-IT', { hour: '2-digit', minute: '2-digit' })

export function offlineSinceLabel(since: Date): string {
  return `scollegata dalle ${clock.format(since)}`
}

const minutes = new Intl.NumberFormat('it-IT', { style: 'unit', unit: 'minute', unitDisplay: 'long' })
const hours = new Intl.NumberFormat('it-IT', { style: 'unit', unit: 'hour', unitDisplay: 'long' })

export function watchingFor(joinedAt: string, now: number): string {
  const elapsed = Math.floor((now - Date.parse(joinedAt)) / 60_000)
  if (elapsed < 1)
    return 'da meno di un minuto'
  if (elapsed < 60)
    return `da ${minutes.format(elapsed)}`
  return `da ${hours.format(Math.floor(elapsed / 60))}`
}

const DAY_MS = 24 * 60 * 60 * 1000
const relativeDays = new Intl.RelativeTimeFormat('it', { numeric: 'auto' })

/** "oggi", "ieri", "3 giorni fa", counted in calendar days. */
export function daysSince(isoDate: string): string {
  const calendarDay = (date: Date) => Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
  return relativeDays.format((calendarDay(new Date(isoDate)) - calendarDay(new Date())) / DAY_MS, 'day')
}

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
  if (cause instanceof FunctionsFetchError)
    return serviceUnreachable
  return somethingWentWrong
}
