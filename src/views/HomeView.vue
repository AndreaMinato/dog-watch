<script setup lang="ts">
import JoinQuestions from '../components/JoinQuestions.vue'
import RememberedRooms from '../components/RememberedRooms.vue'
</script>

<template>
  <main>
    <JoinQuestions />
    <RememberedRooms />
    <p>
      <RouterLink class="button" :to="{ name: 'how-it-works' }">
        Come funziona e cosa salviamo
      </RouterLink>
    </p>
  </main>
</template>
