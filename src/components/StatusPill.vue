<script setup lang="ts">
import type { CameraStatus } from '../room/room-client'
import { statusLabels } from '../room/messages'

const { status } = defineProps<{ status: CameraStatus }>()
</script>

<template>
  <span class="pill" :class="status">{{ statusLabels[status] }}</span>
</template>

<style scoped>
.pill {
  display: inline-block;
  padding: 0.125rem 0.75rem;
  border-radius: 999px;
  font-size: 0.875rem;
  font-weight: 700;
  white-space: nowrap;
}
.live {
  background: var(--live);
  color: var(--on-live);
}
.paused {
  background: var(--surface);
  color: var(--text);
  box-shadow: inset 0 0 0 2px var(--text-muted);
}
</style>
