<script setup lang="ts">
import type { ControlEvent } from '../room/room-client'
import { useTemplateRef } from 'vue'
import { useRouter } from 'vue-router'
import CameraFeeds from '../components/CameraFeeds.vue'
import CameraScreen from '../components/CameraScreen.vue'
import InviteSheet from '../components/InviteSheet.vue'
import MascotFigure from '../components/MascotFigure.vue'
import NewViewerNotice from '../components/NewViewerNotice.vue'
import { rolePoses } from '../mascot/mascot'
import { refusalMessages, roleLabels } from '../room/messages'
import { useRoom } from '../room/use-room'

const router = useRouter()
const { room, members, ended, leave } = useRoom()

const invite = useTemplateRef('invite')

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
  <CameraScreen v-if="room?.self.role === 'camera'" :room="room" :room-key="room.key" @exit="exit" />
  <main v-else :class="{ wide: room?.self.role === 'viewer' }">
    <h1>Stanza</h1>
    <template v-if="room">
      <CameraFeeds :room="room" />
      <NewViewerNotice :room="room" />
      <h2 id="members-heading">
        Nella Stanza
      </h2>
      <ul aria-labelledby="members-heading" class="members">
        <li v-for="member in members" :key="member.id" class="member">
          <MascotFigure class="avatar" :species="member.mascot" :pose="rolePoses[member.role]" crop />
          {{ roleLabels[member.role] }}: {{ member.name }}
          <template v-if="member.id === room.self.id">
            (tu)
          </template>
        </li>
      </ul>
      <div class="controls">
        <button type="button" @click="invite?.open()">
          Invita qualcuno
        </button>
        <button type="button" @click="exit">
          Esci
        </button>
      </div>
      <InviteSheet ref="invite" :room-name="room.roomName" :room-key="room.key" />
    </template>
    <template v-else-if="ended">
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

<style scoped>
.wide {
  max-width: 72rem;
}
.members {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 0;
  list-style: none;
}
.member {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.avatar {
  flex: none;
  width: 2.5rem;
}
</style>
