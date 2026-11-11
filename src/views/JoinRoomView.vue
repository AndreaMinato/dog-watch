<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import JoinRoomForm from '../components/JoinRoomForm.vue'

const roomKey = useRoute().hash.slice(1) || undefined

// Whoever uses this device later must not find the Chiave in the address bar or the history.
if (roomKey)
  useRouter().replace({ hash: '' })
</script>

<template>
  <main>
    <h1>Entra in una Stanza</h1>
    <JoinRoomForm :room-key="roomKey" />
  </main>
</template>
