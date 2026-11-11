<script setup lang="ts">
// Creazione di una Stanza, condivisa dalle varianti A e B della Home.
import { shallowRef } from 'vue'
import { room } from './mock'
import PrototypeEntry from './PrototypeEntry.vue'

const step = shallowRef<'name' | 'key' | 'enter'>('name')
const words = room.key.split('-')
</script>

<template>
  <form v-if="step === 'name'" class="create" @submit.prevent="step = 'key'">
    <label class="field">
      <span class="lbl">Come si chiama la Stanza?</span>
      <input id="create-name" type="text" placeholder="Casa al mare">
      <small class="soft">È solo un'etichetta per riconoscerla, non serve a entrare.</small>
    </label>
    <button type="submit" class="btn">
      Crea la Stanza
    </button>
  </form>
  <div v-else-if="step === 'key'" class="create">
    <p class="lbl">
      La Chiave di {{ room.name }}
    </p>
    <p class="words">
      <span v-for="w in words" :key="w">{{ w }}</span>
    </p>
    <p class="soft">
      È l'unico modo per entrare nella Stanza: tienila da parte. La trovi anche dopo, dentro la Stanza, con il link e il QR.
    </p>
    <button type="button" class="btn" @click="step = 'enter'">
      Continua
    </button>
  </div>
  <PrototypeEntry v-else known-key initial-role="camera" />
</template>

<style scoped>
.create {
  display: grid;
  gap: 16px;
}
.field {
  display: grid;
  gap: 6px;
}
.words {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.words span {
  font-family: var(--f-display);
  font-size: 28px;
  padding: 4px 14px;
  border-radius: 12px;
  background: var(--surface);
}
</style>
