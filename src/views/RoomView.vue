<script setup lang="ts">
import type { Role } from '../room/room-client'
import { useRouter } from 'vue-router'
import CameraFeeds from '../components/CameraFeeds.vue'
import CameraPreview from '../components/CameraPreview.vue'
import JoinLink from '../components/JoinLink.vue'
import NewViewerNotice from '../components/NewViewerNotice.vue'
import ViewerList from '../components/ViewerList.vue'
import { useRoom } from '../room/use-room'

const router = useRouter()
const { room, members, leave } = useRoom()

const roleLabels: Record<Role, string> = { camera: 'Camera', viewer: 'Spettatore' }

async function exit() {
  await leave()
  await router.push({ name: 'home' })
}
</script>

<template>
  <main>
    <h1>Stanza</h1>
    <template v-if="room">
      <CameraPreview v-if="room.self.role === 'camera'" :room="room" />
      <CameraFeeds v-else :room="room" />
      <JoinLink v-if="room.self.role === 'camera'" :room-key="room.key" />
    </template>
    <ViewerList v-if="room?.self.role === 'camera'" :room="room" />
    <NewViewerNotice v-if="room?.self.role === 'viewer'" :room="room" />
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
