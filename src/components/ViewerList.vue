<script setup lang="ts">
import { useId } from 'vue'
import { useRoom } from '../room/use-room'

const { viewers } = useRoom()

const headingId = useId()
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

<style scoped>
ul {
  padding: 0;
  list-style: none;
}
</style>
