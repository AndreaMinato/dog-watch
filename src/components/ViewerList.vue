<script setup lang="ts">
import type { Member, RoomClient } from '../room/room-client'
import { computed, onBeforeUnmount, shallowRef } from 'vue'

const { room } = defineProps<{ room: RoomClient }>()

const members = shallowRef<Member[]>([])
const stopWatching = room.onMembersChange((current) => {
  members.value = current
})
onBeforeUnmount(stopWatching)

const viewers = computed(() => members.value.filter(member => member.role === 'viewer'))
</script>

<template>
  <section>
    <h2 id="viewers-heading">
      Spettatori
    </h2>
    <ul v-if="viewers.length > 0" aria-labelledby="viewers-heading">
      <li v-for="viewer in viewers" :key="viewer.id">
        {{ viewer.name }}
      </li>
    </ul>
    <p v-else>
      Nessuno Spettatore collegato
    </p>
  </section>
</template>
