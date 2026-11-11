<script setup lang="ts">
import type { CameraSession } from '../room/camera-session'
import type { RoomClient } from '../room/room-client'
import { onBeforeUnmount, onMounted, shallowRef } from 'vue'
import { keepScreenAndCameraOn } from '../device/screen-and-camera-keeper'
import { startCameraSession } from '../room/camera-session'
import LensSelector from './LensSelector.vue'

const { room } = defineProps<{ room: RoomClient }>()
const emit = defineEmits<{ rest: [], screenKeptOn: [keptOn: boolean] }>()

const session = shallowRef<CameraSession | null>(null)
const paused = shallowRef(false)
const muted = shallowRef(false)
let unmounted = false
let releaseScreenAndCamera = () => {}

onMounted(async () => {
  const started = await startCameraSession(room)
  if (unmounted) {
    started.close()
    return
  }
  session.value = started
  releaseScreenAndCamera = keepScreenAndCameraOn(started, keptOn => emit('screenKeptOn', keptOn))
})

async function togglePause(session: CameraSession) {
  paused.value = !paused.value
  await session.setPaused(paused.value)
}

function toggleMute(session: CameraSession) {
  muted.value = !muted.value
  session.setMuted(muted.value)
}

onBeforeUnmount(() => {
  unmounted = true
  releaseScreenAndCamera()
  session.value?.close()
})
</script>

<template>
  <p>
    Tieni il dispositivo in carica e questa pagina in primo piano: se lo schermo si spegne o passi a un'altra app, la telecamera smette di trasmettere.
  </p>
  <video
    v-if="session"
    class="preview"
    aria-label="Anteprima"
    :srcObject="session.preview"
    autoplay
    muted
    playsinline
  />
  <div class="controls">
    <template v-if="session">
      <button type="button" @click="togglePause(session)">
        {{ paused ? 'Riprendi' : 'Metti in pausa' }}
      </button>
      <button type="button" @click="toggleMute(session)">
        {{ muted ? 'Riattiva audio' : 'Silenzia' }}
      </button>
    </template>
    <button type="button" @click="$emit('rest')">
      Schermata a riposo
    </button>
  </div>
  <LensSelector v-if="session" :session="session" />
</template>

<style scoped>
.preview {
  display: block;
  width: 100%;
  border-radius: 0.5rem;
  background: var(--surface);
}
</style>
