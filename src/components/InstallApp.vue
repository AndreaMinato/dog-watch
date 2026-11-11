<script setup lang="ts">
import { install, installMethod } from '../device/install'
</script>

<template>
  <p v-if="installMethod === 'prompt'">
    <button type="button" @click="install">
      Installa l'app
    </button>
  </p>
  <p v-else-if="installMethod === 'share'">
    Per installare l'app tocca <strong>Condividi</strong>, poi <strong>Aggiungi alla schermata Home</strong>.
  </p>
</template>
