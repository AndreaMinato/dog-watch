<script setup lang="ts">
import type { ControlEvent } from '../room/room-client'
import { useRouter } from 'vue-router'
import CameraScreen from '../components/CameraScreen.vue'
import ViewerScreen from '../components/ViewerScreen.vue'
import { refusalMessages } from '../room/messages'
import { useRoom } from '../room/use-room'

const router = useRouter()
const { room, ended, leave } = useRoom()

function endMessage(event: ControlEvent): string {
  switch (event.type) {
    case 'refused':
      return refusalMessages[event.refusal]
    case 'key_rotated':
      return 'La Chiave è stata rigenerata: per rientrare serve la Chiave nuova.'
    case 'room_closed':
      return 'Stanza chiusa'
  }
}

async function exit() {
  await leave()
  await router.push({ name: 'home' })
}
</script>

<template>
  <ViewerScreen v-if="room?.self.role === 'viewer'" :room="room" @exit="exit" />
  <CameraScreen v-else-if="room" :room="room" :room-key="room.key" @exit="exit" />
  <main v-else>
    <h1>Stanza</h1>
    <template v-if="ended">
      <p role="alert">
        {{ endMessage(ended) }}
      </p>
      <div class="controls">
        <RouterLink class="button primary" :to="{ name: 'join' }">
          Entra in una Stanza
        </RouterLink>
        <RouterLink class="button" :to="{ name: 'home' }">
          Torna alla home
        </RouterLink>
      </div>
    </template>
  </main>
</template>
