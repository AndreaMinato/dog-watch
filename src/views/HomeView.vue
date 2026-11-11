<script setup lang="ts">
import { appName } from '../brand'
import RememberedRooms from '../components/RememberedRooms.vue'
</script>

<template>
  <main>
    <h1>{{ appName }}</h1>
    <nav class="actions">
      <RouterLink class="button primary" :to="{ name: 'create' }">
        Crea una Stanza
      </RouterLink>
      <RouterLink class="button primary" :to="{ name: 'join' }">
        Entra in una Stanza
      </RouterLink>
      <RouterLink class="button" :to="{ name: 'how-it-works' }">
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
  gap: 0.75rem;
  margin-block: 1.5rem;
}
</style>
