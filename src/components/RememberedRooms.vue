<script setup lang="ts">
import type { RememberedRoom } from '../room/remembered-rooms'
import type { Role } from '../room/room-client'
import { shallowRef } from 'vue'
import { useRouter } from 'vue-router'
import { forgetRoom, rememberedRooms } from '../room/remembered-rooms'
import { useRoom } from '../room/use-room'

const router = useRouter()
const { join } = useRoom()

const rooms = shallowRef(rememberedRooms())
const pending = shallowRef(false)

const roleLabels: Record<Role, string> = { camera: 'Camera', viewer: 'Spettatore' }

function forget(room: RememberedRoom) {
  forgetRoom(room.roomId)
  rooms.value = rememberedRooms()
}

async function enter(room: RememberedRoom) {
  pending.value = true
  try {
    await join(room)
    await router.push({ name: 'room' })
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
      <li v-for="room in rooms" :key="room.roomId">
        <button type="button" :disabled="pending" @click="enter(room)">
          {{ room.roomName }}
        </button>
        {{ roleLabels[room.role] }}: {{ room.name }}
        <button type="button" @click="forget(room)">
          Dimentica questa Stanza
        </button>
      </li>
    </ul>
  </section>
</template>

<style scoped>
.rooms {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 0;
  list-style: none;
}
</style>
