<script setup lang="ts">
import type { CameraFeed } from '../room/viewer-session'
import { shallowRef } from 'vue'

const { feed } = defineProps<{ feed: CameraFeed }>()

const muted = shallowRef(true)
</script>

<template>
  <figure class="feed">
    <video
      :aria-label="`Camera ${feed.camera.name}`"
      :srcObject="feed.stream"
      :muted="muted"
      autoplay
      playsinline
    />
    <figcaption>
      {{ feed.camera.name }}
      <button type="button" @click="muted = !muted">
        {{ muted ? 'Attiva audio' : 'Disattiva audio' }}
      </button>
    </figcaption>
  </figure>
</template>

<style scoped>
.feed {
  margin: 0;
}
.feed video {
  width: 100%;
  max-width: 40rem;
  background: black;
}
</style>
