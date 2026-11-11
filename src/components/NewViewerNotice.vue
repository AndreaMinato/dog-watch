<script setup lang="ts">
import type { Member, RoomClient } from '../room/room-client'
import { shallowRef } from 'vue'
import { useRoom } from '../room/use-room'

const { room } = defineProps<{ room: RoomClient }>()

const { onViewerArrival } = useRoom()

const newcomers = shallowRef<Member[]>([])

onViewerArrival((viewer) => {
  if (viewer.id !== room.self.id)
    newcomers.value = [...newcomers.value, viewer]
})

function dismiss() {
  newcomers.value = []
}
</script>

<template>
  <div class="newcomers" :class="{ 'shown surface': newcomers.length > 0 }">
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
.newcomers {
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
  box-shadow: 0 0.25rem 1rem var(--scrim);
}
p {
  margin: 0;
}
</style>
