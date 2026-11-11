<script setup lang="ts">
import type { RememberedRoom } from '../room/remembered-rooms'
import { onBeforeUnmount, shallowRef, useId } from 'vue'
import { useRouter } from 'vue-router'
import { rolePoses } from '../mascot/mascot'
import { joinErrorMessage, roleLabels } from '../room/messages'
import { cameraRoomToReenter, forgetRoom, rememberedRooms, rememberLeftRoom } from '../room/remembered-rooms'
import { InvalidKeyError, RoomRefusedError } from '../room/room-client'
import { useRoom } from '../room/use-room'
import MascotFigure from './MascotFigure.vue'

const router = useRouter()
const { join } = useRoom()
const id = useId()

/** "Telecamera soggiorno", "Spettatore · Andrea". */
function howEntered(room: RememberedRoom): string {
  return room.role === 'camera' ? `${roleLabels.camera} ${room.memberName}` : `${roleLabels.viewer} · ${room.memberName}`
}

const DAY_MS = 24 * 60 * 60 * 1000
const relativeDays = new Intl.RelativeTimeFormat('it', { numeric: 'auto' })

/** "oggi", "ieri", "3 giorni fa", counted in calendar days. */
function daysSince(isoDate: string): string {
  const calendarDay = (date: Date) => Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
  return relativeDays.format((calendarDay(new Date(isoDate)) - calendarDay(new Date())) / DAY_MS, 'day')
}

const rooms = shallowRef(rememberedRooms())
const pending = shallowRef(false)
const failure = shallowRef<{ roomId: string, message: string } | null>(null)
const askingKeyFor = shallowRef<string | null>(null)
const newKey = shallowRef('')

function forget(room: RememberedRoom) {
  forgetRoom(room.roomId)
  rooms.value = rememberedRooms()
}

const FIRST_RETRY_DELAY_MS = 1_000
const MAX_RETRY_DELAY_MS = 30_000
let retry: ReturnType<typeof setTimeout> | undefined

/** With a retry delay, failures other than a definitive answer are retried with backoff. */
async function enter(room: RememberedRoom, key = room.key, retryDelay?: number) {
  clearTimeout(retry)
  pending.value = true
  failure.value = null
  try {
    await join({ key, role: room.role, name: room.memberName, mascot: room.mascot })
    await router.push({ name: 'room' })
  }
  catch (cause) {
    const definitive = cause instanceof InvalidKeyError || cause instanceof RoomRefusedError
    if (retryDelay !== undefined && !definitive) {
      console.error(cause)
      retry = setTimeout(() => enter(room, key, Math.min(retryDelay * 2, MAX_RETRY_DELAY_MS)), retryDelay)
      return
    }
    if (retryDelay !== undefined)
      rememberLeftRoom()
    const keyRejected = cause instanceof InvalidKeyError
    if (keyRejected)
      askingKeyFor.value = room.roomId
    const message = keyRejected && key === room.key
      ? 'La Chiave ricordata non funziona più: probabilmente è stata rigenerata. Inserisci la Chiave nuova.'
      : joinErrorMessage(cause)
    failure.value = { roomId: room.roomId, message }
  }
  finally {
    pending.value = false
  }
}

const cameraRoom = cameraRoomToReenter()
if (cameraRoom)
  enter(cameraRoom, cameraRoom.key, FIRST_RETRY_DELAY_MS)
onBeforeUnmount(() => clearTimeout(retry))
</script>

<template>
  <section v-if="rooms.length > 0" :aria-labelledby="`${id}-heading`">
    <h1 :id="`${id}-heading`" tabindex="-1">
      Le tue Stanze
    </h1>
    <ul :aria-labelledby="`${id}-heading`" class="rooms">
      <li v-for="room in rooms" :key="room.roomId" class="room surface">
        <button
          type="button"
          class="enter"
          :disabled="pending"
          :aria-labelledby="`${id}-${room.roomId}`"
          :aria-describedby="`${id}-${room.roomId}-detail`"
          @click="enter(room)"
        >
          <MascotFigure class="avatar" :species="room.mascot" :pose="rolePoses[room.role]" crop />
          <span class="text">
            <span :id="`${id}-${room.roomId}`" class="name">{{ room.roomName }}</span>
            <span :id="`${id}-${room.roomId}-detail`" class="detail">
              {{ howEntered(room) }}<template v-if="room.lastVisit"> · ultima visita {{ daysSince(room.lastVisit) }}</template>
            </span>
          </span>
          <span class="go" aria-hidden="true">→</span>
        </button>
        <button
          :id="`${id}-${room.roomId}-forget`"
          type="button"
          class="forget"
          :aria-labelledby="`${id}-${room.roomId}-forget ${id}-${room.roomId}`"
          @click="forget(room)"
        >
          Dimentica
        </button>
        <p v-if="failure?.roomId === room.roomId" role="alert">
          {{ failure.message }}
        </p>
        <form v-if="askingKeyFor === room.roomId" class="new-key" @submit.prevent="enter(room, newKey)">
          <label class="field">
            Chiave nuova
            <input v-model="newKey" required autocomplete="off" autocapitalize="none" spellcheck="false">
          </label>
          <button type="submit" :disabled="pending">
            Entra
          </button>
        </form>
      </li>
    </ul>
  </section>
</template>

<style scoped>
.rooms {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 0;
  list-style: none;
}
.room {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 0.25rem 0.5rem;
  padding: 0.375rem 0.625rem 0.375rem 0.375rem;
  border-radius: 1.375rem;
}
.room > :not(.enter, .forget) {
  grid-column: 1 / -1;
  margin: 0.25rem 0.5rem 0.5rem;
}
.enter {
  justify-content: flex-start;
  gap: 0.75rem;
  min-width: 0;
  padding: 0.5rem;
  border: none;
  border-radius: 1rem;
  font-weight: 400;
  text-align: start;
}
.avatar {
  flex: none;
  width: 3.25rem;
  height: 3.25rem;
}
.text {
  display: grid;
  min-width: 0;
  line-height: 1.25;
}
.name {
  font-family: var(--font-display);
  font-size: 1.375rem;
}
.detail {
  color: var(--text-muted);
  font-size: 0.875rem;
}
.go {
  margin-inline-start: auto;
  font-size: 1.25rem;
}
.forget {
  padding-inline: 0.5rem;
  border: none;
  color: var(--text-muted);
  font-size: 0.875rem;
  font-weight: 400;
  text-decoration: underline;
}
.new-key,
.field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
</style>
