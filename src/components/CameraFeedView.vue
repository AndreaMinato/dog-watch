<script setup lang="ts">
import type { CameraFeed } from '../room/viewer-session'
import { shallowRef } from 'vue'

const { feed } = defineProps<{ feed: CameraFeed }>()
defineEmits<{ enlarge: [] }>()

const muted = shallowRef(true)

const clock = new Intl.DateTimeFormat('it-IT', { hour: '2-digit', minute: '2-digit' })
</script>

<template>
  <figure class="feed">
    <video
      :aria-label="`Telecamera ${feed.camera.name}`"
      :srcObject="feed.stream"
      :muted="muted"
      autoplay
      playsinline
      @click="$emit('enlarge')"
    />
    <p v-if="feed.offlineSince" class="status">
      Telecamera {{ feed.camera.name }} offline dalle {{ clock.format(feed.offlineSince) }}
    </p>
    <p v-else-if="feed.camera.status === 'paused'" class="status">
      Telecamera in pausa
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
  display: block;
  width: 100%;
  border-radius: 0.5rem;
  background: black;
}
figcaption {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  padding-block: 0.25rem;
}
</style>
