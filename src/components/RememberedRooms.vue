<script setup lang="ts">
import type { RememberedRoom } from '../room/remembered-rooms'
import type { Role } from '../room/room-client'
import { shallowRef } from 'vue'
import { useRouter } from 'vue-router'
import { forgetRoom, rememberedRooms } from '../room/remembered-rooms'
import { InvalidKeyError } from '../room/room-client'
import { useRoom } from '../room/use-room'
import { joinErrorMessage } from './join-error-message'

const router = useRouter()
const { join } = useRoom()

const rooms = shallowRef(rememberedRooms())
const pending = shallowRef(false)
const failure = shallowRef<{ roomId: string, message: string } | null>(null)
const askingKeyFor = shallowRef<string | null>(null)
const newKey = shallowRef('')

const roleLabels: Record<Role, string> = { camera: 'Camera', viewer: 'Spettatore' }

function forget(room: RememberedRoom) {
  forgetRoom(room.roomId)
  rooms.value = rememberedRooms()
}

async function enter(room: RememberedRoom, key = room.key) {
  pending.value = true
  failure.value = null
  try {
    await join({ key, role: room.role, name: room.name })
    await router.push({ name: 'room' })
  }
  catch (cause) {
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
