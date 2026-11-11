<script setup lang="ts">
import type { Member, RoomClient } from '../room/room-client'
import { onBeforeUnmount, shallowRef } from 'vue'

const { room } = defineProps<{ room: RoomClient }>()

const newcomers = shallowRef<Member[]>([])

// Viewers already in the Presence state that first lists this device were there
// before it joined: only later arrivals are news.
let joined = false
let present = new Set<string>()
const stopWatching = room.onMembersChange((members) => {
  const others = members.filter(member => member.role === 'viewer' && member.id !== room.self.id)
  if (joined) {
    const arrived = others.filter(viewer => !present.has(viewer.id))
    if (arrived.length > 0)
      newcomers.value = [...newcomers.value, ...arrived]
  }
  present = new Set(others.map(viewer => viewer.id))
  joined ||= members.some(member => member.id === room.self.id)
})
onBeforeUnmount(stopWatching)

function dismiss() {
  newcomers.value = []
}
</script>

<template>
  <div class="notice" :class="{ shown: newcomers.length > 0 }">
    <div role="status">
      <p v-for="(newcomer, index) in newcomers" :key="index">
        Nuovo Spettatore: {{ newcomer.name }}
      </p>
    </div>
    <button v-if="newcomers.length > 0" type="button" @click="dismiss">
      Chiudi
    </button>
  </div>
</template>

<style scoped>
.notice {
  position: fixed;
  inset: 1rem 1rem auto;
  z-index: 1;
  max-width: 30rem;
  margin-inline: auto;
}
.shown {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.5rem 0.5rem 0.5rem 1rem;
  border-radius: 1.25rem;
  background: var(--surface);
  box-shadow: 0 0.25rem 1rem var(--scrim);
}
p {
  margin: 0;
}
</style>
