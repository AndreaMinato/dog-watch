<script setup lang="ts">
import type { Member, RoomClient } from '../room/room-client'
import { computed, onBeforeUnmount, shallowRef, useId } from 'vue'

const { room } = defineProps<{ room: RoomClient }>()

const members = shallowRef<Member[]>([])
const stopWatching = room.onMembersChange((current) => {
  members.value = current
})
onBeforeUnmount(stopWatching)

const headingId = useId()
const viewers = computed(() => members.value.filter(member => member.role === 'viewer'))
</script>

<template>
  <section>
    <h2 :id="headingId">
      Spettatori
    </h2>
    <ul v-if="viewers.length > 0" :aria-labelledby="headingId">
      <li v-for="viewer in viewers" :key="viewer.id">
        {{ viewer.name }}
      </li>
    </ul>
    <p v-else>
      Nessuno Spettatore collegato
    </p>
  </section>
</template>
