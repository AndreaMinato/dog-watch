<script setup lang="ts">
import { useRoute } from 'vue-router'
import JoinRoomForm from '../components/JoinRoomForm.vue'

const roomKey = useRoute().hash.slice(1) || undefined
</script>

<template>
  <main>
    <h1>Entra in una Stanza</h1>
    <JoinRoomForm :room-key="roomKey" />
  </main>
</template>
