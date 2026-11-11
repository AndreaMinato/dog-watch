<script setup lang="ts">
const { watching } = defineProps<{ watching: number }>()
defineEmits<{ wake: [] }>()
</script>

<template>
  <button type="button" class="rest" @click="$emit('wake')">
    <span class="dot" />
    <span>In diretta · {{ watching === 1 ? '1 persona sta guardando' : `${watching} persone stanno guardando` }}</span>
    <span class="hint">Tocca per riaccendere lo schermo</span>
  </button>
</template>

<style scoped>
.rest {
  position: absolute;
  inset: 0;
  z-index: 20;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border: 0;
  font: inherit;
  font-size: 14px;
  background: var(--rest);
  color: rgb(238 241 232 / 38%);
  cursor: pointer;
}
.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: rgb(241 176 124 / 55%);
}
.hint {
  font-size: 12px;
  color: rgb(238 241 232 / 24%);
}
</style>
