<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import JoinQuestions from '../components/JoinQuestions.vue'

// /entra#<Chiave>&<Nome della Stanza>, or only the Chiave in links shared before the name.
// The router has already decoded the fragment, and a Chiave never contains "&".
const [key, ...nameParts] = useRoute().hash.slice(1).split('&')
const roomKey = key || undefined
const roomName = nameParts.join('&') || undefined

// Whoever uses this device later must not find the Chiave in the address bar or the history.
if (roomKey)
  useRouter().replace({ hash: '' })
</script>

<template>
  <main>
    <JoinQuestions :invitation-key="roomKey" :invitation-room-name="roomName" />
  </main>
</template>
