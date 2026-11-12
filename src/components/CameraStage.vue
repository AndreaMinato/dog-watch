<script setup lang="ts">
import type { CameraFeed } from '../room/viewer-session'
import { computed, onBeforeUnmount, shallowRef, useTemplateRef } from 'vue'
import { missingVideoMascots, rolePoses } from '../mascot/mascot'
import { offlineSinceLabel } from '../room/messages'
import { feedState } from '../room/viewer-session'
import MascotFigure from './MascotFigure.vue'
import StatusPill from './StatusPill.vue'

const { feed } = defineProps<{ feed: CameraFeed }>()

const muted = shallowRef(true)
const state = computed(() => feedState(feed))
const cover = computed(() => missingVideoMascots[state.value])

/** Safari on iPhone fills the screen only with a video, in its own player. */
type IphoneVideo = HTMLVideoElement & { webkitEnterFullscreen: () => void }

const stage = useTemplateRef('stage')
const video = useTemplateRef<IphoneVideo>('video')
const canFillTheScreen = document.fullscreenEnabled || 'webkitEnterFullscreen' in HTMLVideoElement.prototype
const fillsTheScreen = shallowRef(false)

function onFullscreenChange() {
  fillsTheScreen.value = document.fullscreenElement === stage.value
}
document.addEventListener('fullscreenchange', onFullscreenChange)
onBeforeUnmount(() => document.removeEventListener('fullscreenchange', onFullscreenChange))

async function toggleFullscreen() {
  if (fillsTheScreen.value)
    await document.exitFullscreen()
  else if (document.fullscreenEnabled)
    await stage.value?.requestFullscreen()
  else
    video.value?.webkitEnterFullscreen()
}
</script>

<template>
  <section ref="stage" class="stage" :aria-label="feed.camera.name">
    <div class="screen surface">
      <video
        ref="video"
        :aria-label="`Telecamera ${feed.camera.name}`"
        :srcObject="feed.stream"
        :muted="muted"
        autoplay
        playsinline
      />
      <div v-if="cover" class="cover">
        <MascotFigure class="figure" :species="feed.camera.mascot" :pose="rolePoses[feed.camera.role]" :state="cover" />
        <p v-if="state === 'connecting'" class="caption">
          Collegamento a {{ feed.camera.name }}…
        </p>
        <p v-else-if="state === 'paused'" class="caption">
          {{ feed.camera.name }} è in pausa
        </p>
      </div>
      <div class="overlay">
        <span class="chip">
          <MascotFigure
            v-if="!cover"
            class="avatar"
            :species="feed.camera.mascot"
            :pose="rolePoses[feed.camera.role]"
            crop
          />
          <span class="name">{{ feed.camera.name }}</span>
        </span>
        <StatusPill v-if="!cover || state === 'paused'" :status="feed.camera.status" />
      </div>
    </div>
    <p v-if="feed.offlineSince" class="note">
      {{ feed.camera.name }} è {{ offlineSinceLabel(feed.offlineSince) }}. Controlla che il telefono sia acceso e connesso al Wi-Fi.
    </p>
    <div class="actions">
      <button type="button" @click="muted = !muted">
        {{ muted ? 'Attiva audio' : 'Disattiva audio' }}
      </button>
      <button v-if="canFillTheScreen" type="button" @click="toggleFullscreen">
        {{ fillsTheScreen ? 'Esci dallo schermo intero' : 'Schermo intero' }}
      </button>
    </div>
  </section>
</template>

<style scoped>
.stage {
  display: grid;
  gap: 0.5rem;
}
.stage:fullscreen {
  grid-template-rows: minmax(0, 1fr) auto auto;
  padding: 1rem;
  background: var(--background);
}
.stage:fullscreen .screen {
  min-height: 0;
}
.screen {
  position: relative;
  overflow: hidden;
}
video {
  display: block;
  width: 100%;
  max-height: 70dvh;
  object-fit: contain;
}
:fullscreen video {
  height: 100%;
  max-height: none;
}
.cover {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding-bottom: 3.5rem;
  background: var(--surface);
}
.figure {
  min-height: 0;
  flex: 0 1 60%;
}
.caption {
  margin: 0;
  font-family: var(--font-display);
  font-size: 1.25rem;
}
.overlay {
  position: absolute;
  inset: auto 0 0;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  padding: 0.75rem;
}
.avatar {
  flex: none;
  width: 2rem;
}
.name {
  font-family: var(--font-display);
  font-size: 1.125rem;
}
.note {
  margin: 0;
}
.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}
</style>
