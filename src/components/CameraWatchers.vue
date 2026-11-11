<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, shallowRef, useId, useTemplateRef } from 'vue'
import { rolePoses } from '../mascot/mascot'
import { somethingWentWrong } from '../room/messages'
import { useRoom } from '../room/use-room'
import BottomSheet from './BottomSheet.vue'
import ConfirmButton from './ConfirmButton.vue'
import MascotFigure from './MascotFigure.vue'
import RoomKeyWords from './RoomKeyWords.vue'

const { roomKey } = defineProps<{ roomKey: string }>()

const { members, rotateKey } = useRoom()

const sheet = useTemplateRef('sheet')
const newKeyNote = useTemplateRef('newKeyNote')
const titleId = useId()
const rotated = shallowRef(false)
const error = shallowRef(false)
const now = shallowRef(Date.now())
const ticking = setInterval(() => {
  now.value = Date.now()
}, 30_000)
onBeforeUnmount(() => clearInterval(ticking))

const viewers = computed(() => members.value.filter(member => member.role === 'viewer'))
const watching = computed(() => {
  switch (viewers.value.length) {
    case 0:
      return 'Nessuno guarda'
    case 1:
      return '1 persona guarda'
    default:
      return `${viewers.value.length} persone guardano`
  }
})

const minutes = new Intl.NumberFormat('it-IT', { style: 'unit', unit: 'minute', unitDisplay: 'long' })
const hours = new Intl.NumberFormat('it-IT', { style: 'unit', unit: 'hour', unitDisplay: 'long' })

function watchingFor(joinedAt: string): string {
  const elapsed = Math.floor((now.value - Date.parse(joinedAt)) / 60_000)
  if (elapsed < 1)
    return 'da meno di un minuto'
  if (elapsed < 60)
    return `da ${minutes.format(elapsed)}`
  return `da ${hours.format(Math.floor(elapsed / 60))}`
}

function open() {
  now.value = Date.now()
  rotated.value = false
  error.value = false
  sheet.value?.open()
}

async function rotate() {
  error.value = false
  try {
    await rotateKey()
  }
  catch (cause) {
    console.error(cause)
    error.value = true
    return
  }
  rotated.value = true
  // The button that had the focus is gone: the focus moves to what replaced it.
  await nextTick()
  newKeyNote.value?.focus()
}
</script>

<template>
  <button type="button" class="watchers" :aria-label="watching" aria-haspopup="dialog" @click="open">
    <template v-if="viewers.length > 0">
      <span class="faces">
        <MascotFigure
          v-for="viewer in viewers"
          :key="viewer.id"
          class="face"
          :species="viewer.mascot"
          :pose="rolePoses.viewer"
          crop
        />
      </span>
      {{ viewers.length }}
    </template>
    <template v-else>
      {{ watching }}
    </template>
  </button>
  <BottomSheet ref="sheet" :aria-labelledby="titleId">
    <h2 :id="titleId">
      Stanno guardando
    </h2>
    <ul v-if="viewers.length > 0" class="list" :aria-labelledby="titleId">
      <li v-for="viewer in viewers" :key="viewer.id" class="viewer">
        <MascotFigure class="avatar" :species="viewer.mascot" :pose="rolePoses.viewer" crop />
        <span class="name">{{ viewer.name }}</span> <span class="since">{{ watchingFor(viewer.joinedAt) }}</span>
      </li>
    </ul>
    <p v-else>
      Nessuno, per ora.
    </p>
    <div v-if="rotated" class="stranger">
      <p ref="newKeyNote" tabindex="-1">
        Tutti gli altri sono usciti dalla Stanza. Ecco la Chiave nuova: dalla solo a chi deve guardare.
      </p>
      <RoomKeyWords :room-key="roomKey" />
    </div>
    <div v-else class="stranger">
      <p>Qualcuno che non conosci?</p>
      <ConfirmButton
        label="Rigenera la Chiave"
        question="Rigenerare la Chiave? Tutti gli altri dispositivi verranno espulsi e dovranno rientrare con la Chiave nuova."
        confirm-label="Rigenera"
        @confirm="rotate"
      />
      <p v-if="error" role="alert">
        {{ somethingWentWrong }}
      </p>
    </div>
    <button type="button" @click="sheet?.close()">
      Chiudi
    </button>
  </BottomSheet>
</template>

<style scoped>
.watchers {
  gap: 0.5rem;
  padding: 0.25rem 1rem 0.25rem 0.75rem;
  border: none;
  background: var(--surface);
  color: var(--text);
}
.faces {
  display: flex;
}
.face {
  width: 2rem;
  margin-left: -0.5rem;
  background: var(--background);
  box-shadow: 0 0 0 2px var(--surface);
}
.face:first-child {
  margin-left: 0;
}
.list {
  display: grid;
  gap: 0.75rem;
  padding: 0;
  list-style: none;
}
.viewer {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.75rem;
}
.avatar {
  flex: none;
  width: 2.5rem;
  background: var(--background);
}
.name {
  font-family: var(--font-display);
  font-size: 1.125rem;
}
.since {
  margin-left: auto;
  color: var(--text-muted);
  font-size: 0.875rem;
}
.stranger {
  display: grid;
  gap: 0.75rem;
  padding: 0.875rem;
  border-radius: 1.25rem;
  background: var(--background);
}
.stranger p {
  margin: 0;
}
</style>
