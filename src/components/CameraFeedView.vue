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
  background: black;
}
</style>
