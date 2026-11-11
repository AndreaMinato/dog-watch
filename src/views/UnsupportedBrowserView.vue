<script setup lang="ts">
import { appName } from '../brand'
import { installedCameraNeedsIos184 } from '../room/messages'
</script>

<template>
  <main>
    <h1>Browser non supportato</h1>
    <p>Questo browser non permette di trasmettere o guardare video da dispositivo a dispositivo.</p>
    <p>Apri {{ appName }} con:</p>
    <ul>
      <li>
        Telecamera: Safari su iPhone o iPad (iOS 16.4 o successivo) oppure Chrome su Android, aggiornato.
        {{ installedCameraNeedsIos184 }}
      </li>
      <li>Spettatore: gli stessi, oppure Chrome, Firefox o Safari su computer.</li>
    </ul>
  </main>
</template>
