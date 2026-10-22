<script setup lang="ts">
import { computed, useId } from 'vue'
import { useRoom } from '../room/use-room'

const { members } = useRoom()

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
