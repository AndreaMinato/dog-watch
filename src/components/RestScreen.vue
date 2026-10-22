<script setup lang="ts">
import ViewerList from './ViewerList.vue'

const emit = defineEmits<{ wake: [] }>()
</script>

<template>
  <section class="rest" aria-label="Schermata a riposo" @click="emit('wake')">
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

.wake {
  margin-top: 2rem;
  border: none;
  background: none;
  color: inherit;
  font: inherit;
}
</style>
