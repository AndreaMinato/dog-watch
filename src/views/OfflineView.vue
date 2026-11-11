<script setup lang="ts">
import { appName } from '../brand'

function retry() {
  location.reload()
}
</script>

<template>
  <main>
    <h1>Impossibile collegarsi</h1>
    <p>{{ appName }} non riesce a raggiungere il servizio. Controlla la connessione a internet e riprova.</p>
    <button type="button" class="button primary" @click="retry">
      Riprova
    </button>
  </main>
</template>
