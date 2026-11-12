<script setup lang="ts">
import type { MascotState, Pose, Species } from '../mascot/mascot'
import { computed } from 'vue'
import { mascotSvg, mascotViewBox } from '../mascot/drawing'
import { speciesLabels } from '../room/messages'

const { species, pose, state = 'awake', crop = false } = defineProps<{
  species: Species
  pose: Pose
  state?: MascotState
  /** Only the head, in a circle: the avatar next to a name. */
  crop?: boolean
}>()

const poseWords: Record<Pose, string> = { sitting: 'seduto', peeking: 'affacciato' }
const stateWords: Record<MascotState, string> = { awake: '', asleep: ' che dorme', searching: ' che si guarda intorno' }

const label = computed(() => `${speciesLabels[species]} ${poseWords[pose]}${stateWords[state]}`)
</script>

<template>
  <!-- eslint-disable-next-line vue/no-v-html -- markup built in drawing.ts from fixed values, never from user input -->
  <svg class="mascot" :class="{ crop }" :viewBox="mascotViewBox(pose, crop)" role="img" :aria-label="label" v-html="mascotSvg(species, pose, state)" />
</template>

<style scoped>
.mascot {
  display: block;
}
.crop {
  border-radius: 50%;
  background: var(--surface);
}
.mascot :deep(.look) {
  animation: look 5s ease-in-out infinite;
}
.mascot :deep(.breathe) {
  transform-box: fill-box;
  transform-origin: 50% 100%;
  animation: breathe 4.5s ease-in-out infinite;
}
@keyframes look {
  0%,
  20%,
  100% {
    transform: translateX(0);
  }
  35%,
  55% {
    transform: translateX(-2.4px);
  }
  70%,
  90% {
    transform: translateX(2.4px);
  }
}
@keyframes breathe {
  0%,
  100% {
    transform: scale(1, 1);
  }
  50% {
    transform: scale(1.015, 1.03);
  }
}
</style>
