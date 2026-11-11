// PROTOTIPO: dati finti, niente Supabase né WebRTC.
import type { Species } from './mascot-svg'

export type CamStatus = 'live' | 'connecting' | 'off'

export interface Cam {
  id: string
  name: string
  species: Species
  status: CamStatus
  scene: number
}

export interface Watcher {
  name: string
  species: Species
  you?: boolean
  since: string
}

export interface RecentRoom {
  name: string
  role: 'camera' | 'viewer'
  memberName: string
  species: Species
  live: number
  total: number
}

export const room = { name: 'Casa al mare', key: 'tazza-ombra-vento-pino', link: 'veglia.app/entra#tazza-ombra-vento-pino' }

export const offSince = '14:32'

const allCams: Cam[] = [
  { id: 'soggiorno', name: 'Soggiorno', species: 'gatto', status: 'live', scene: 0 },
  { id: 'cucina', name: 'Cucina', species: 'cane', status: 'live', scene: 1 },
  { id: 'studio', name: 'Studio', species: 'coniglio', status: 'off', scene: 2 },
]

export function camsFor(scenario: string): Cam[] {
  if (scenario === 'vuota')
    return []
  if (scenario === 'collegamento')
    return allCams.map(cam => ({ ...cam, status: 'connecting' }))
  if (scenario === 'tutte')
    return allCams.map(cam => ({ ...cam, status: 'live' }))
  return allCams
}

export const you: Watcher = { name: 'Andrea', species: 'cane', you: true, since: 'adesso' }

export function viewersFor(scenario: string): Watcher[] {
  return scenario === 'vuota' ? [you] : [you, { name: 'Marta', species: 'gatto', since: '12 minuti' }]
}

export const thisCamera = allCams[0]!

export function watchersFor(scenario: string): Watcher[] {
  if (scenario === 'nessuno')
    return []
  if (scenario === 'arrivo')
    return [{ name: 'Marta', species: 'gatto', since: 'adesso' }, { name: 'Andrea', species: 'cane', since: '20 minuti' }]
  return [{ name: 'Marta', species: 'gatto', since: '12 minuti' }, { name: 'Andrea', species: 'cane', since: '2 minuti' }]
}

export function recentRoomsFor(scenario: string): RecentRoom[] {
  if (scenario !== 'stanze')
    return []
  return [
    { name: 'Casa al mare', role: 'viewer', memberName: 'Andrea', species: 'cane', live: 2, total: 3 },
    { name: 'Casa della nonna', role: 'camera', memberName: 'Cucina', species: 'coniglio', live: 0, total: 1 },
  ]
}

export function statusLabel(cam: Cam): string {
  if (cam.status === 'live')
    return 'In diretta'
  if (cam.status === 'connecting')
    return 'Collegamento…'
  return 'Scollegata'
}

export function offMessage(cam: Cam): string {
  return `Scollegata dalle ${offSince}. Controlla che il telefono in ${cam.name} sia acceso e connesso al Wi-Fi.`
}
