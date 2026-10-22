<script setup lang="ts">
import type { Role } from '../room/room-client'
import { useRouter } from 'vue-router'
import CameraFeeds from '../components/CameraFeeds.vue'
import CameraPreview from '../components/CameraPreview.vue'
import { refusalMessages } from '../components/refusal-messages'
import { useRoom } from '../room/use-room'

const router = useRouter()
const { room, members, refusal, leave } = useRoom()

const roleLabels: Record<Role, string> = { camera: 'Camera', viewer: 'Spettatore' }

async function exit() {
  await leave()
  await router.push({ name: 'home' })
}
</script>

<template>
  <main>
    <h1>Stanza</h1>
    <p v-if="refusal" role="alert">
      {{ refusalMessages[refusal] }}
    </p>
    <template v-if="room">
      <CameraPreview v-if="room.self.role === 'camera'" :room="room" />
      <CameraFeeds v-else :room="room" />
    </template>
    <h2 id="members-heading">
      Nella Stanza
    </h2>
    <ul aria-labelledby="members-heading">
      <li v-for="member in members" :key="member.id">
        {{ roleLabels[member.role] }}: {{ member.name }}
        <template v-if="member.id === room?.self.id">
          (tu)
        </template>
      </li>
    </ul>
    <button type="button" @click="exit">
      Esci
    </button>
  </main>
</template>
