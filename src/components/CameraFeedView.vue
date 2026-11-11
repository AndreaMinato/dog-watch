<script setup lang="ts">
import type { CameraFeed } from '../room/viewer-session'
import { shallowRef } from 'vue'
import StatusPill from './StatusPill.vue'

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
    <p v-if="feed.offlineSince" class="status offline">
      Telecamera {{ feed.camera.name }} offline dalle {{ clock.format(feed.offlineSince) }}
    </p>
    <StatusPill v-else class="status" :status="feed.camera.status" />
    <figcaption>
      <span class="name">{{ feed.camera.name }}</span>
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
  top: 0.5rem;
  left: 0.5rem;
  margin: 0;
}
.offline {
  right: 0.5rem;
  padding: 0.5rem;
  border-radius: 0.5rem;
  background: var(--surface);
}
.feed video {
  display: block;
  width: 100%;
  border-radius: 0.5rem;
  background: var(--surface);
}
.name {
  font-family: var(--font-display);
  font-size: 1.25rem;
}
figcaption {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  padding-block: 0.25rem;
}
</style>
