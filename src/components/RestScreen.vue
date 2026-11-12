<script setup lang="ts">
import type { ShownStatus } from '../room/messages'
import { screenMayTurnOff, statusLabels } from '../room/messages'
import ViewerList from './ViewerList.vue'

defineProps<{ status: ShownStatus, screenKeptOn: boolean }>()
const emit = defineEmits<{ wake: [] }>()
</script>

<template>
  <section class="rest" aria-label="Schermata a riposo" @click="emit('wake')">
    <p v-if="!screenKeptOn" role="alert" class="warning">
      {{ screenMayTurnOff }}
    </p>
    <p class="status">
      {{ statusLabels[status] }}
    </p>
    <ViewerList />
    <button type="button" class="wake">
      Tocca per riaccendere lo schermo
    </button>
  </section>
</template>

<style scoped>
.rest {
  position: fixed;
  inset: 0;
  display: flex;
  flex-direction: column;
  justify-content: safe center;
  align-items: center;
  overflow: auto;
  padding: 1rem;
  background: var(--rest);
  color: var(--on-rest);
  font-size: 0.875rem;
  text-align: center;
}

.rest :focus-visible {
  outline-color: var(--on-rest);
}

.warning,
.status {
  font-weight: 700;
}

.wake {
  border: none;
  color: inherit;
  font-weight: 400;
}
</style>
