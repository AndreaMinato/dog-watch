import type { Species } from '../mascot/mascot'
import type { Role } from './room-client'
import { speciesOrDefault } from '../mascot/mascot'

export interface RememberedRoom {
  roomId: string
  roomName: string
  key: string
  role: Role
  /** The Camera's name or the Spettatore's soprannome in this room. */
  memberName: string
  mascot: Species
  /** ISO date of the last time this device entered; rooms remembered before it was saved have none. */
  lastVisit?: string
}

const ROOMS = 'dog-watch:rooms'
const CAMERA_ROOM = 'dog-watch:camera-room'

// Storage can be missing or throw (private browsing, blocked site data): the app then
// simply remembers nothing.
function read<T>(item: string, fallback: T): T {
  try {
    const value = localStorage.getItem(item)
    return value === null ? fallback : JSON.parse(value) as T
  }
  catch {
    return fallback
  }
}

function write(item: string, value: unknown) {
  try {
    if (value === null)
      localStorage.removeItem(item)
    else
      localStorage.setItem(item, JSON.stringify(value))
  }
  catch {}
}

/** Most recently entered first. */
export function rememberedRooms(): RememberedRoom[] {
  // Rooms remembered before mascots existed have none.
  return read<RememberedRoom[]>(ROOMS, []).map(room => ({ ...room, mascot: speciesOrDefault(room.mascot) }))
}

export function rememberEnteredRoom(room: Omit<RememberedRoom, 'lastVisit'>) {
  const visited = { ...room, lastVisit: new Date().toISOString() }
  write(ROOMS, [visited, ...rememberedRooms().filter(other => other.roomId !== room.roomId)])
  write(CAMERA_ROOM, room.role === 'camera' ? room.roomId : null)
}

export function rememberLeftRoom() {
  write(CAMERA_ROOM, null)
}

export function forgetRoom(roomId: string) {
  write(ROOMS, rememberedRooms().filter(room => room.roomId !== roomId))
  if (read<string | null>(CAMERA_ROOM, null) === roomId)
    write(CAMERA_ROOM, null)
}

/** The room this device was a Camera in when the page went away without leaving it. */
export function cameraRoomToReenter(): RememberedRoom | undefined {
  const roomId = read<string | null>(CAMERA_ROOM, null)
  return rememberedRooms().find(room => room.roomId === roomId)
}
