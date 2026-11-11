<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import JoinQuestions from '../components/JoinQuestions.vue'

const roomKey = useRoute().hash.slice(1) || undefined

// Whoever uses this device later must not find the Chiave in the address bar or the history.
if (roomKey)
  useRouter().replace({ hash: '' })
</script>

<template>
  <main>
    <JoinQuestions :invitation-key="roomKey" />
  </main>
</template>
