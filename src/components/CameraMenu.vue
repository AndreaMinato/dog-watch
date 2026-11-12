<script setup lang="ts">
import type { CameraSession } from '../room/camera-session'
import { shallowRef, useTemplateRef } from 'vue'
import { somethingWentWrong } from '../room/messages'
import { useRoom } from '../room/use-room'
import BottomSheet from './BottomSheet.vue'
import ConfirmButton from './ConfirmButton.vue'
import InviteSheet from './InviteSheet.vue'

const { session } = defineProps<{ session: CameraSession | null, roomName: string, roomKey: string }>()
defineEmits<{ exit: [] }>()
const paused = defineModel<boolean>('paused', { required: true })

const { closeRoom } = useRoom()

const sheet = useTemplateRef('sheet')
const invite = useTemplateRef('invite')
const muted = shallowRef(false)
const error = shallowRef(false)

function open() {
  error.value = false
  sheet.value?.open()
}

async function togglePause(session: CameraSession) {
  sheet.value?.close()
  const pause = !paused.value
  paused.value = pause
  await session.setPaused(pause)
}

function toggleMute(session: CameraSession) {
  sheet.value?.close()
  muted.value = !muted.value
  session.setMuted(muted.value)
}

function inviteSomeone() {
  // Closing the menu first gives the focus back to its button, where the invite sheet will return it.
  sheet.value?.close()
  invite.value?.open()
}

async function close() {
  error.value = false
  try {
    await closeRoom()
  }
  catch (cause) {
    console.error(cause)
    error.value = true
  }
}
</script>

<template>
  <button type="button" class="round" aria-label="Menu" aria-haspopup="dialog" @click="open">
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
      <circle cx="5" cy="12" r="2" />
      <circle cx="12" cy="12" r="2" />
      <circle cx="19" cy="12" r="2" />
    </svg>
  </button>
  <BottomSheet ref="sheet" aria-label="Menu">
    <template v-if="session">
      <button type="button" @click="togglePause(session)">
        {{ paused ? 'Riprendi' : 'Metti in pausa' }}
      </button>
      <button type="button" @click="toggleMute(session)">
        {{ muted ? 'Riattiva audio' : 'Silenzia' }}
      </button>
    </template>
    <button type="button" @click="inviteSomeone">
      Invita qualcuno
    </button>
    <ConfirmButton
      label="Chiudi la Stanza"
      question="Chiudere la Stanza? Verrà cancellata con tutti i suoi dati e la Chiave smetterà di funzionare."
      confirm-label="Chiudi"
      @confirm="close"
    />
    <p v-if="error" role="alert">
      {{ somethingWentWrong }}
    </p>
    <button type="button" @click="$emit('exit')">
      Esci
    </button>
    <button type="button" @click="sheet?.close()">
      Annulla
    </button>
  </BottomSheet>
  <InviteSheet ref="invite" :room-name="roomName" :room-key="roomKey" />
</template>
