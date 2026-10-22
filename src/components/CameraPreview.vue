<script setup lang="ts">
import type { CameraSession } from '../room/camera-session'
import type { RoomClient } from '../room/room-client'
import { onBeforeUnmount, onMounted, shallowRef } from 'vue'
import { keepDevice } from '../device/device-keeper'
import { startCameraSession } from '../room/camera-session'

const { room } = defineProps<{ room: RoomClient }>()

const session = shallowRef<CameraSession | null>(null)
let unmounted = false
let releaseDevice = () => {}

onMounted(async () => {
  const started = await startCameraSession(room)
  if (unmounted) {
    started.close()
    return
  }
  session.value = started
  releaseDevice = keepDevice(started)
})

onBeforeUnmount(() => {
  unmounted = true
  releaseDevice()
  session.value?.close()
})
</script>

<template>
  <p>
    Tieni il dispositivo in carica e questa pagina in primo piano: se lo schermo si spegne o passi a un'altra app, la Camera smette di trasmettere.
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
</template>

<style scoped>
.preview {
  width: 100%;
  max-width: 40rem;
  background: black;
}
</style>
