<script setup lang="ts">
import { install, installMethod } from '../device/install'
import { installedCameraNeedsIos184 } from '../room/messages'
</script>

<template>
  <p v-if="installMethod === 'prompt'">
    <button type="button" @click="install">
      Installa l'app
    </button>
  </p>
  <!-- Safari keeps the screen on from iOS 16.4, the installed app only from 18.4: the camera must know before installing. -->
  <p v-else-if="installMethod === 'share'">
    Per installare l'app tocca <strong>Condividi</strong>, poi <strong>Aggiungi alla schermata Home</strong>.
    {{ installedCameraNeedsIos184 }}
  </p>
</template>
