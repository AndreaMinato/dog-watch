<script setup lang="ts">
import { generate } from 'lean-qr'
import { toSvgDataURL } from 'lean-qr/extras/svg'
import { computed, shallowRef, useId, useTemplateRef } from 'vue'
import { useRouter } from 'vue-router'
import BottomSheet from './BottomSheet.vue'
import RoomKeyWords from './RoomKeyWords.vue'

const { roomName, roomKey } = defineProps<{ roomName: string, roomKey: string }>()

const router = useRouter()
const sheet = useTemplateRef('sheet')
const titleId = useId()
const feedback = shallowRef('')
const canShare = 'share' in navigator

/** /entra#<Chiave>&<Nome della Stanza>: whoever opens it sees where they are going before entering. */
const link = computed(() => {
  const url = new URL(router.resolve({ name: 'join' }).href, location.origin)
  url.hash = `${roomKey}&${encodeURIComponent(roomName)}`
  return url.href
})
const qr = computed(() => toSvgDataURL(generate(link.value), { on: '#26305c', off: '#ffffff', pad: 2 }))

function open() {
  feedback.value = ''
  sheet.value?.open()
}

async function share() {
  feedback.value = ''
  try {
    await navigator.share({ url: link.value })
  }
  catch (cause) {
    // Closing the share sheet without choosing is the user's choice, not a failure.
    if (cause instanceof DOMException && cause.name === 'AbortError')
      return
    console.error(cause)
    feedback.value = 'Condivisione non riuscita: copia il link.'
  }
}

async function copy() {
  try {
    await navigator.clipboard.writeText(link.value)
    feedback.value = 'Link copiato'
  }
  catch (cause) {
    console.error(cause)
    feedback.value = 'Copia non riuscita: seleziona il link e copialo a mano.'
  }
}

defineExpose({ open })
</script>

<template>
  <BottomSheet ref="sheet" :aria-labelledby="titleId">
    <h2 :id="titleId">
      Invita qualcuno
    </h2>
    <p>Chi apre il link entra in {{ roomName }} e sceglie se guardare o fare da telecamera.</p>
    <div class="share">
      <img class="qr" :src="qr" alt="QR del link per entrare">
      <div class="actions">
        <output class="link" aria-label="Link per entrare">{{ link }}</output>
        <button v-if="canShare" type="button" class="button primary" @click="share">
          Condividi il link
        </button>
        <button type="button" @click="copy">
          Copia il link
        </button>
        <p role="status">
          {{ feedback }}
        </p>
      </div>
    </div>
    <div class="key">
      <p>Oppure detta la Chiave</p>
      <RoomKeyWords :room-key="roomKey" />
    </div>
    <button type="button" @click="sheet?.close()">
      Chiudi
    </button>
  </BottomSheet>
</template>

<style scoped>
.share {
  display: grid;
  grid-template-columns: 8.25rem minmax(0, 1fr);
  gap: 1rem;
  align-items: center;
}
.qr {
  width: 8.25rem;
  height: 8.25rem;
  border-radius: 0.75rem;
  image-rendering: pixelated;
}
.actions {
  display: grid;
  gap: 0.5rem;
}
.actions p {
  margin: 0;
}
.link {
  font-size: 0.875rem;
  color: var(--text-muted);
  overflow-wrap: anywhere;
}
.key {
  display: grid;
  gap: 0.5rem;
  padding: 0.875rem;
  border-radius: 1.25rem;
  background: var(--background);
}
.key p {
  margin: 0;
}
</style>
