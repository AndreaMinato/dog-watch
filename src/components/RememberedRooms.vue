<script setup lang="ts">
import type { RememberedRoom } from '../room/remembered-rooms'
import { onBeforeUnmount, shallowRef } from 'vue'
import { useRouter } from 'vue-router'
import { joinErrorMessage, roleLabels } from '../room/messages'
import { cameraRoomToReenter, forgetRoom, rememberedRooms, rememberLeftRoom } from '../room/remembered-rooms'
import { InvalidKeyError, RoomRefusedError } from '../room/room-client'
import { useRoom } from '../room/use-room'

const router = useRouter()
const { join } = useRoom()

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
    await join({ key, role: room.role, name: room.name })
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
  <section v-if="rooms.length > 0" aria-labelledby="recent-rooms-heading">
    <h2 id="recent-rooms-heading">
      Stanze recenti
    </h2>
    <ul aria-labelledby="recent-rooms-heading" class="rooms">
      <li v-for="room in rooms" :key="room.roomId" class="room">
        <button type="button" :disabled="pending" @click="enter(room)">
          {{ room.roomName }}
        </button>
        {{ roleLabels[room.role] }}: {{ room.name }}
        <button type="button" @click="forget(room)">
          Dimentica questa Stanza
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
.new-key,
.field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
</style>
