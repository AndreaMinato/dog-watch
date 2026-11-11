<script setup lang="ts">
import { shallowRef } from 'vue'
import { useRoom } from '../room/use-room'

const SHOWN_FOR_MS = 8_000

const { onViewerArrival } = useRoom()

const arrivals = shallowRef<{ id: number, name: string }[]>([])
let lastArrival = 0

onViewerArrival(viewer => announce(viewer.name))

function announce(name: string) {
  const arrival = { id: ++lastArrival, name }
  arrivals.value = [...arrivals.value, arrival]
  setTimeout(() => {
    arrivals.value = arrivals.value.filter(shown => shown !== arrival)
  }, SHOWN_FOR_MS)
}
</script>

<template>
  <div role="status" class="arrivals">
    <p v-for="arrival in arrivals" :key="arrival.id" class="arrival">
      {{ arrival.name }} sta guardando.
    </p>
  </div>
</template>

<style scoped>
.arrivals {
  display: grid;
  gap: 0.5rem;
}
.arrival {
  margin: 0;
  padding: 0.75rem 1rem;
  border-radius: 1rem;
  background: var(--surface);
  font-size: 0.875rem;
}
</style>
