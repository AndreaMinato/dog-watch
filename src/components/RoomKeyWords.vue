<script setup lang="ts">
import { computed } from 'vue'

const { roomKey } = defineProps<{ roomKey: string }>()

const words = computed(() => roomKey.split('-'))
</script>

<template>
  <ol class="words" aria-label="Chiave della Stanza">
    <li v-for="word in words" :key="word">
      {{ word }}
    </li>
  </ol>
</template>

<style scoped>
.words {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin: 0;
  padding: 0;
  list-style: none;
}
.words li {
  padding: 0.125rem 0.75rem;
  border-radius: 0.625rem;
  background: var(--surface);
  font-family: var(--font-display);
  font-size: 1.5rem;
}
</style>
