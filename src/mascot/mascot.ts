import type { Role } from '../room/room-client'

export const SPECIES = ['dog', 'cat', 'rabbit'] as const

export type Species = typeof SPECIES[number]

export type Pose = 'sitting' | 'peeking'

export type MascotState = 'awake' | 'asleep' | 'searching'

export const rolePoses: Record<Role, Pose> = { camera: 'sitting', viewer: 'peeking' }

export function randomSpecies(): Species {
  return SPECIES[Math.floor(Math.random() * SPECIES.length)]!
}

/** A device on an older version sends no animal, a newer one may send one this version can't draw. */
export function speciesOrDefault(value: unknown): Species {
  return SPECIES.find(species => species === value) ?? 'dog'
}
