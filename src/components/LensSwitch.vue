<script setup lang="ts">
import type { CameraSession } from '../room/camera-session'
import { onBeforeUnmount, shallowRef } from 'vue'

const { session } = defineProps<{ session: CameraSession }>()

const lenses = shallowRef<string[]>([])

async function listLenses() {
  const devices = await navigator.mediaDevices.enumerateDevices()
  lenses.value = devices.filter(device => device.kind === 'videoinput').map(device => device.deviceId)
}

void listLenses()
navigator.mediaDevices.addEventListener('devicechange', listLenses)
onBeforeUnmount(() => navigator.mediaDevices.removeEventListener('devicechange', listLenses))

function switchLens() {
  const filming = lenses.value.indexOf(session.preview.getVideoTracks()[0]?.getSettings().deviceId ?? '')
  session.useCamera(lenses.value[(filming + 1) % lenses.value.length]!).catch(console.error)
}
</script>

<template>
  <button v-if="lenses.length > 1" type="button" class="round" aria-label="Cambia obiettivo" @click="switchLens">
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M20 11a8 8 0 0 0-14.9-3" />
      <path d="M4 4v4h4" />
      <path d="M4 13a8 8 0 0 0 14.9 3" />
      <path d="M20 20v-4h-4" />
    </svg>
  </button>
</template>
