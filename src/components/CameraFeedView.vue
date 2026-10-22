<script setup lang="ts">
import type { CameraFeed } from '../room/viewer-session'
import { shallowRef } from 'vue'

const { feed } = defineProps<{ feed: CameraFeed }>()
defineEmits<{ enlarge: [] }>()

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
      @click="$emit('enlarge')"
    />
    <p v-if="feed.camera.status === 'paused'" class="status">
      Camera in pausa
    </p>
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
  position: relative;
  margin: 0;
}
.status {
  position: absolute;
  inset: 0 0 auto;
  margin: 0;
  padding: 0.5rem;
  color: white;
  background: rgb(0 0 0 / 60%);
}
.feed video {
  width: 100%;
  background: black;
}
</style>
