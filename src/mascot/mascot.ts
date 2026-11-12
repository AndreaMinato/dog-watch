import type { Role } from '../room/room-client'
import type { FeedState } from '../room/viewer-session'

export const SPECIES = ['dog', 'cat', 'rabbit'] as const

export type Species = typeof SPECIES[number]

export type Pose = 'sitting' | 'peeking'

export type MascotState = 'awake' | 'asleep' | 'searching'

export const rolePoses: Record<Role, Pose> = { camera: 'sitting', viewer: 'peeking' }

/** Where a camera's video is missing its animal stands in: looking around until the video arrives, awake while paused, asleep once the camera drops out. */
export const missingVideoMascots: Partial<Record<FeedState, MascotState>> = { connecting: 'searching', paused: 'awake', offline: 'asleep' }

export function randomSpecies(): Species {
  return SPECIES[Math.floor(Math.random() * SPECIES.length)]!
}

/** A device on an older version sends no animal. */
export function speciesOrDefault(value: unknown): Species {
  return SPECIES.find(species => species === value) ?? 'dog'
}
