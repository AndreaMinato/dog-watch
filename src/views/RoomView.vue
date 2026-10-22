<script setup lang="ts">
import type { ControlEvent } from '../room/room-client'
import { shallowRef } from 'vue'
import { useRouter } from 'vue-router'
import CameraFeeds from '../components/CameraFeeds.vue'
import CameraPreview from '../components/CameraPreview.vue'
import ConfirmButton from '../components/ConfirmButton.vue'
import JoinLink from '../components/JoinLink.vue'
import NewViewerNotice from '../components/NewViewerNotice.vue'
import RestScreen from '../components/RestScreen.vue'
import { refusalMessages, roleLabels, somethingWentWrong } from '../room/messages'
import { useRoom } from '../room/use-room'

const router = useRouter()
const { room, members, ended, leave, rotateKey, closeRoom } = useRoom()

const resting = shallowRef(false)

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

const rotated = shallowRef(false)
const error = shallowRef(false)

async function run(action: () => Promise<void>) {
  error.value = false
  try {
    await action()
  }
  catch {
    error.value = true
  }
}

async function rotate() {
  await rotateKey()
  rotated.value = true
}

async function exit() {
  await leave()
  await router.push({ name: 'home' })
}
</script>

<template>
  <main v-show="!resting || !room">
    <h1>Stanza</h1>
    <template v-if="room">
      <template v-if="room.self.role === 'camera'">
        <CameraPreview :room="room" />
        <button type="button" @click="resting = true">
          Schermata a riposo
        </button>
        <JoinLink :room-key="room.key" />
      </template>
      <template v-else>
        <CameraFeeds :room="room" />
        <NewViewerNotice :room="room" />
      </template>
      <h2 id="members-heading">
        Nella Stanza
      </h2>
      <ul aria-labelledby="members-heading">
        <li v-for="member in members" :key="member.id">
          {{ roleLabels[member.role] }}: {{ member.name }}
          <template v-if="member.id === room.self.id">
            (tu)
          </template>
        </li>
      </ul>
      <template v-if="room.self.role === 'camera'">
        <template v-if="rotated">
          <p>Ecco la nuova Chiave della Stanza: dalla ai dispositivi fidati.</p>
          <output class="room-key" aria-label="Chiave della Stanza">{{ room.key }}</output>
        </template>
        <ConfirmButton
          label="Rigenera la Chiave"
          question="Rigenerare la Chiave? Tutti gli altri dispositivi verranno espulsi e dovranno rientrare con la Chiave nuova."
          confirm-label="Rigenera"
          @confirm="run(rotate)"
        />
        <ConfirmButton
          label="Chiudi la Stanza"
          question="Chiudere la Stanza? Verrà cancellata con tutti i suoi dati e la Chiave smetterà di funzionare."
          confirm-label="Chiudi"
          @confirm="run(closeRoom)"
        />
        <p v-if="error" role="alert">
          {{ somethingWentWrong }}
        </p>
      </template>
      <button type="button" @click="exit">
        Esci
      </button>
    </template>
    <template v-else-if="ended">
      <p role="alert">
        {{ endMessage(ended) }}
      </p>
      <RouterLink :to="{ name: 'join' }">
        Entra in una Stanza
      </RouterLink>
      <RouterLink :to="{ name: 'home' }">
        Torna alla home
      </RouterLink>
    </template>
  </main>
  <RestScreen v-if="resting && room" @wake="resting = false" />
</template>

<style scoped>
.room-key {
  display: block;
  font-size: 1.5rem;
  font-weight: bold;
}
</style>
