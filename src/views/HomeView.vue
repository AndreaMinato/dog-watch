<script setup lang="ts">
import RememberedRooms from '../components/RememberedRooms.vue'
</script>

<template>
  <main>
    <h1>dog-watch</h1>
    <nav class="actions">
      <RouterLink :to="{ name: 'create' }">
        Crea una Stanza
      </RouterLink>
      <RouterLink :to="{ name: 'join' }">
        Entra in una Stanza
      </RouterLink>
      <RouterLink :to="{ name: 'how-it-works' }">
        Come funziona e cosa salviamo
      </RouterLink>
    </nav>
    <RememberedRooms />
  </main>
</template>

<style scoped>
.actions {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
</style>
