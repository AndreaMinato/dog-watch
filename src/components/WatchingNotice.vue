<script setup lang="ts">
import type { Member } from '../room/room-client'
import { shallowRef, watch } from 'vue'
import { useRoom } from '../room/use-room'

const SHOWN_FOR_MS = 8_000

const { members } = useRoom()

const arrivals = shallowRef<{ id: number, name: string }[]>([])
let lastArrival = 0

function viewerIds(current: readonly Member[]): Set<string> {
  return new Set(current.filter(member => member.role === 'viewer').map(member => member.id))
}

// Who watched before this screen opened is no news: only later arrivals are.
let watching = viewerIds(members.value)
watch(members, (current) => {
  for (const member of current) {
    if (member.role === 'viewer' && !watching.has(member.id))
      announce(member.name)
  }
  watching = viewerIds(current)
})

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
