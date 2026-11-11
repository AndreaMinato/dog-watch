<script setup lang="ts">
import type { CameraSession } from '../room/camera-session'
import type { RoomClient } from '../room/room-client'
import { onBeforeUnmount, onMounted, shallowRef, useTemplateRef } from 'vue'
import { keepScreenAndCameraOn } from '../device/screen-and-camera-keeper'
import { rolePoses } from '../mascot/mascot'
import { startCameraSession } from '../room/camera-session'
import { screenMayTurnOff } from '../room/messages'
import { cameraNoticeUnderstood, rememberCameraNoticeUnderstood } from '../room/remembered-rooms'
import CameraMenu from './CameraMenu.vue'
import CameraWatchers from './CameraWatchers.vue'
import LensSwitch from './LensSwitch.vue'
import MascotFigure from './MascotFigure.vue'
import RestScreen from './RestScreen.vue'
import StatusPill from './StatusPill.vue'
import WatchingNotice from './WatchingNotice.vue'

const { room, roomKey } = defineProps<{
  room: RoomClient
  /** The client's key changes when rotated, but only useRoom() tells when. */
  roomKey: string
}>()
defineEmits<{ exit: [] }>()

const IDLE_BEFORE_RESTING_MS = 120_000

const screen = useTemplateRef('screen')
const session = shallowRef<CameraSession | null>(null)
const paused = shallowRef(false)
const resting = shallowRef(false)
const screenKeptOn = shallowRef(true)
const lensFailed = shallowRef(false)
const firstStart = shallowRef(!cameraNoticeUnderstood())
let unmounted = false
let releaseScreenAndCamera = () => {}
let idle: ReturnType<typeof setTimeout> | undefined

function rest() {
  // An open sheet is modal: it would leave the rest screen deaf to the tap that wakes it.
  screen.value?.querySelectorAll('dialog').forEach(dialog => dialog.close())
  resting.value = true
}

function understood() {
  rememberCameraNoticeUnderstood()
  firstStart.value = false
}

function restartIdle() {
  clearTimeout(idle)
  idle = setTimeout(rest, IDLE_BEFORE_RESTING_MS)
}

onMounted(async () => {
  restartIdle()
  window.addEventListener('pointerdown', restartIdle)
  window.addEventListener('keydown', restartIdle)
  const started = await startCameraSession(room)
  if (unmounted) {
    started.close()
    return
  }
  session.value = started
  releaseScreenAndCamera = keepScreenAndCameraOn(started, (keptOn) => {
    screenKeptOn.value = keptOn
  })
})

onBeforeUnmount(() => {
  unmounted = true
  clearTimeout(idle)
  window.removeEventListener('pointerdown', restartIdle)
  window.removeEventListener('keydown', restartIdle)
  releaseScreenAndCamera()
  session.value?.close()
})
</script>

<template>
  <main v-show="!resting" ref="screen" class="camera-screen">
    <video
      v-if="session"
      class="mirror"
      aria-label="Anteprima"
      :srcObject="session.preview"
      autoplay
      muted
      playsinline
    />
    <div class="top">
      <div class="self">
        <MascotFigure class="avatar" :species="room.self.mascot" :pose="rolePoses.camera" crop />
        <h1 class="name">
          {{ room.self.name }}
        </h1>
        <StatusPill :status="paused ? 'paused' : 'live'" />
      </div>
      <CameraWatchers :room-key="roomKey" />
    </div>
    <div class="notices">
      <p v-if="!screenKeptOn" role="alert" class="notice">
        {{ screenMayTurnOff }}
      </p>
      <p v-if="lensFailed" role="alert" class="notice">
        Impossibile usare l'altro obiettivo: potrebbe essere occupato da un'altra app o non essere più collegato.
      </p>
      <p class="notice">
        Tieni il dispositivo in carica e questa pagina in primo piano: se lo schermo si spegne o passi a un'altra app, la telecamera smette di trasmettere.
      </p>
      <div v-if="firstStart" class="notice first-start">
        <p>
          Tieni l'app aperta e il telefono in carica: se blocchi lo schermo la trasmissione si ferma. Lo schermo si oscura da solo dopo 2 minuti.
        </p>
        <button type="button" @click="understood">
          Ho capito
        </button>
      </div>
      <WatchingNotice />
    </div>
    <div class="bottom">
      <LensSwitch v-if="session" v-model:failed="lensFailed" :session="session" />
      <button type="button" class="button primary dim" @click="resting = true">
        Oscura lo schermo
      </button>
      <CameraMenu
        v-model:paused="paused"
        :session="session"
        :room-name="room.roomName"
        :room-key="roomKey"
        @exit="$emit('exit')"
      />
    </div>
  </main>
  <RestScreen v-if="resting" :status="paused ? 'paused' : 'live'" :screen-kept-on="screenKeptOn" @wake="resting = false" />
</template>

<style scoped>
.camera-screen {
  position: fixed;
  inset: 0;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  max-width: none;
  padding: max(0.75rem, env(safe-area-inset-top)) max(0.75rem, env(safe-area-inset-right))
    max(1rem, env(safe-area-inset-bottom)) max(0.75rem, env(safe-area-inset-left));
  overflow-y: auto;
}
.mirror {
  position: absolute;
  inset: 0;
  z-index: -1;
  width: 100%;
  height: 100%;
  object-fit: contain;
}
.top {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: flex-start;
  gap: 0.5rem;
}
.self {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  min-height: var(--touch);
  padding: 0.25rem 0.75rem 0.25rem 0.25rem;
  border-radius: 999px;
  background: var(--surface);
}
.avatar {
  flex: none;
  width: 2.25rem;
  background: var(--background);
}
.name {
  margin: 0;
  font-size: 1.125rem;
}
.notices {
  display: grid;
  gap: 0.5rem;
  max-width: 28rem;
}
.notice {
  margin: 0;
  padding: 0.75rem 1rem;
  border-radius: 1rem;
  background: var(--surface);
  font-size: 0.875rem;
}
.first-start {
  display: grid;
  justify-items: start;
  gap: 0.5rem;
}
.first-start p {
  margin: 0;
}
.bottom {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
  max-width: 28rem;
  margin: auto auto 0;
}
.dim {
  flex: 1;
}
</style>
