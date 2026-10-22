<script setup lang="ts">
import type { CameraSession } from '../room/camera-session'
import { onBeforeUnmount, ref, shallowRef } from 'vue'

const { session } = defineProps<{ session: CameraSession }>()

const cameras = shallowRef<MediaDeviceInfo[]>([])
const selected = ref(session.preview.getVideoTracks()[0]?.getSettings().deviceId ?? '')

async function listCameras() {
  const devices = await navigator.mediaDevices.enumerateDevices()
  cameras.value = devices.filter(device => device.kind === 'videoinput')
}

void listCameras()
navigator.mediaDevices.addEventListener('devicechange', listCameras)
onBeforeUnmount(() => navigator.mediaDevices.removeEventListener('devicechange', listCameras))

function choose() {
  session.useCamera(selected.value).catch(console.error)
}
</script>

<template>
  <label v-if="cameras.length > 1">
    Obiettivo
    <select v-model="selected" @change="choose">
      <option v-for="(camera, index) in cameras" :key="camera.deviceId" :value="camera.deviceId">
        {{ camera.label || `Obiettivo ${index + 1}` }}
      </option>
    </select>
  </label>
</template>
