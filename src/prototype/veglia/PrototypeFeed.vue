<script setup lang="ts">
import type { Cam } from './mock'
import PrototypeMascot from './PrototypeMascot.vue'

const { cam } = defineProps<{ cam: Cam }>()
</script>

<template>
  <div class="feed" :class="[`scene-${cam.scene}`, cam.status]">
    <div v-if="cam.status === 'off'" class="figure">
      <PrototypeMascot :species="cam.species" state="dorme" :label="`${cam.name}, scollegata`" />
    </div>
    <div v-else-if="cam.status === 'connecting'" class="wait-msg">
      <span class="avatar"><PrototypeMascot :species="cam.species" pose="affacciato" state="cerca" crop :label="cam.name" /></span>
      <span>Collegamento a {{ cam.name }}…</span>
    </div>
    <slot />
  </div>
</template>

<style scoped>
.feed {
  position: relative;
  overflow: hidden;
  background: var(--feed);
  min-height: 0;
}
.feed::after {
  content: '';
  position: absolute;
  background: var(--sofa);
}
.scene-0::after {
  left: 12%;
  bottom: 20%;
  width: 46%;
  height: 24%;
  border-radius: 999px 999px 12px 12px;
}
.scene-1::after {
  right: 14%;
  bottom: 18%;
  width: 30%;
  height: 30%;
  border-radius: 8px 8px 2px 2px;
}
.scene-2::after {
  left: 20%;
  bottom: 10%;
  width: 62%;
  height: 20%;
  border-radius: 18px 18px 4px 4px;
}
.off,
.connecting {
  background: var(--off);
}
.off::after,
.connecting::after {
  display: none;
}
.figure {
  position: absolute;
  left: 50%;
  bottom: 0;
  height: 78%;
  aspect-ratio: 1;
  transform: translateX(-50%);
}
.figure svg {
  display: block;
  width: 100%;
  height: 100%;
}
.wait-msg {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  font-size: 15px;
  color: var(--ink);
}
.wait-msg .avatar {
  width: 56px;
  height: 56px;
}
</style>
