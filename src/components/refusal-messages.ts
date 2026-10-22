import type { Refusal } from '../room/room-client'

export const refusalMessages: Record<Refusal, string> = {
  cameras_full: 'La Stanza ha già 4 Camere: non puoi entrare come Camera.',
  viewers_full: 'La Stanza ha già 3 Spettatori: non puoi entrare come Spettatore.',
  camera_name_taken: 'Nella Stanza c\'è già una Camera con questo nome: scegline un altro.',
}
