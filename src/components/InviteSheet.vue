<script setup lang="ts">
import { generate } from 'lean-qr'
import { toSvgDataURL } from 'lean-qr/extras/svg'
import { computed, shallowRef, useId, useTemplateRef } from 'vue'
import { useRouter } from 'vue-router'

const { roomName, roomKey } = defineProps<{ roomName: string, roomKey: string }>()

const router = useRouter()
const dialog = useTemplateRef('dialog')
const titleId = useId()
const copied = shallowRef(false)
const canShare = 'share' in navigator

const link = computed(() => {
  const url = new URL(router.resolve({ name: 'join' }).href, location.origin)
  url.hash = roomKey
  return url.href
})
const qr = computed(() => toSvgDataURL(generate(link.value), { on: '#26305c', off: '#ffffff', pad: 2 }))
const words = computed(() => roomKey.split('-'))

function open() {
  copied.value = false
  dialog.value?.showModal()
}

async function share() {
  await navigator.share({ url: link.value })
}

async function copy() {
  await navigator.clipboard.writeText(link.value)
  copied.value = true
}

function closeOnTapOutside(event: MouseEvent) {
  if (event.target === dialog.value)
    dialog.value?.close()
}

defineExpose({ open })
</script>

<template>
  <dialog ref="dialog" class="invite" :aria-labelledby="titleId" @click="closeOnTapOutside">
    <div class="sheet">
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
            {{ copied ? 'Link copiato' : '' }}
          </p>
        </div>
      </div>
      <div class="key">
        <p>Oppure detta la Chiave</p>
        <ol class="words" aria-label="Chiave della Stanza">
          <li v-for="word in words" :key="word">
            {{ word }}
          </li>
        </ol>
      </div>
      <button type="button" @click="dialog?.close()">
        Chiudi
      </button>
    </div>
  </dialog>
</template>

<style scoped>
.invite {
  width: 100%;
  max-width: 100%;
  margin-bottom: 0;
  padding: 0;
  border-radius: 1.5rem 1.5rem 0 0;
}
.invite::backdrop {
  background: var(--scrim);
}
@media (min-width: 700px) {
  .invite {
    width: min(32.5rem, 100% - 2rem);
    margin-bottom: auto;
    border-radius: 1.5rem;
  }
}
.sheet {
  display: grid;
  gap: 1rem;
  padding: 1.5rem 1.25rem calc(1.25rem + env(safe-area-inset-bottom));
}
.sheet > * {
  margin: 0;
}
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
.words {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin: 0;
  padding: 0;
  list-style: none;
}
.words li {
  padding: 0.125rem 0.75rem;
  border-radius: 0.625rem;
  background: var(--surface);
  font-family: var(--font-display);
  font-size: 1.5rem;
}
</style>
