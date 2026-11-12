<script setup lang="ts">
import type { CameraFeed, FeedState } from '../room/viewer-session'
import { computed } from 'vue'
import { missingVideoMascots, rolePoses } from '../mascot/mascot'
import { offlineSinceLabel } from '../room/messages'
import { feedState } from '../room/viewer-session'
import MascotFigure from './MascotFigure.vue'

const { feed, picked } = defineProps<{ feed: CameraFeed, picked: boolean }>()

function describe(state: FeedState): string {
  switch (state) {
    case 'offline':
      return offlineSinceLabel(feed.offlineSince!)
    case 'connecting':
      return 'collegamento in corso'
    case 'live':
      return 'in diretta'
    case 'paused':
      return 'in pausa'
  }
}

const state = computed(() => feedState(feed))
const cover = computed(() => missingVideoMascots[state.value])
const label = computed(() => `${feed.camera.name}, ${describe(state.value)}`)
</script>

<template>
  <button type="button" class="thumbnail" :aria-label="label" :aria-current="picked ? 'true' : undefined">
    <span class="preview">
      <video :srcObject="feed.stream" muted autoplay playsinline />
      <MascotFigure
        v-if="cover"
        class="cover"
        :species="feed.camera.mascot"
        :pose="rolePoses[feed.camera.role]"
        :state="cover"
      />
      <MascotFigure
        v-else
        class="avatar"
        :species="feed.camera.mascot"
        :pose="rolePoses[feed.camera.role]"
        crop
      />
    </span>
    <span class="caption">
      <span class="dot" :class="state" />
      <span class="name">{{ feed.camera.name }}</span>
    </span>
  </button>
</template>

<style scoped>
.thumbnail {
  display: grid;
  gap: 0.375rem;
  width: 100%;
  padding: 0;
  border: none;
  border-radius: 0.75rem;
  text-align: start;
}
.preview {
  position: relative;
  display: block;
  aspect-ratio: 16 / 10;
  overflow: hidden;
  border-radius: 0.75rem;
  background: var(--surface);
}
[aria-current='true'] .preview {
  outline: 3px solid var(--text);
  outline-offset: 2px;
}
video {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.cover {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  padding-top: 0.5rem;
  background: var(--surface);
}
.avatar {
  position: absolute;
  bottom: 0.375rem;
  left: 0.375rem;
  width: 1.75rem;
}
.caption {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  min-width: 0;
  padding-inline: 0.25rem;
}
.dot {
  flex: none;
  width: 0.625rem;
  height: 0.625rem;
  border-radius: 50%;
  box-shadow: inset 0 0 0 2px var(--text-muted);
}
.dot.live {
  background: var(--live);
  box-shadow: none;
}

.name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
