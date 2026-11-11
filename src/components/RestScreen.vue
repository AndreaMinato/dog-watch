<script setup lang="ts">
import { screenMayTurnOff } from '../room/messages'
import ViewerList from './ViewerList.vue'

defineProps<{ screenKeptOn: boolean }>()
const emit = defineEmits<{ wake: [] }>()
</script>

<template>
  <section class="rest" aria-label="Schermata a riposo" @click="emit('wake')">
    <p v-if="!screenKeptOn" role="alert" class="warning">
      {{ screenMayTurnOff }}
    </p>
    <ViewerList />
    <button type="button" class="wake">
      Tocca lo schermo per svegliarlo
    </button>
  </section>
</template>

<style scoped>
.rest {
  position: fixed;
  inset: 0;
  overflow: auto;
  padding: 1rem;
  background: black;
  color: #555;
}

.warning {
  color: #e0a000;
}

.wake {
  width: 100%;
  margin-top: 2rem;
  border: none;
  background: none;
  color: inherit;
  font: inherit;
}
</style>
