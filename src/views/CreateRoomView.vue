<script setup lang="ts">
import { shallowRef } from 'vue'
import JoinRoomForm from '../components/JoinRoomForm.vue'
import { createRoom } from '../room/room-client'

const name = shallowRef('')
const key = shallowRef<string | null>(null)
const pending = shallowRef(false)
const error = shallowRef(false)

async function submit() {
  pending.value = true
  error.value = false
  try {
    key.value = (await createRoom(name.value)).key
  }
  catch {
    error.value = true
  }
  finally {
    pending.value = false
  }
}
</script>

<template>
  <main>
    <h1>Crea una Stanza</h1>
    <form v-if="key === null" class="create-form" @submit.prevent="submit">
      <label class="field">
        Nome della Stanza
        <input v-model.trim="name" required maxlength="40">
      </label>
      <p v-if="error" role="alert">
        Qualcosa è andato storto, riprova.
      </p>
      <button type="submit" :disabled="pending">
        Crea
      </button>
    </form>
    <template v-else>
      <p>
        Ecco la Chiave della Stanza: è l'unico modo per entrare, conservala.
      </p>
      <output class="room-key" aria-label="Chiave della Stanza">{{ key }}</output>
      <JoinRoomForm :room-key="key" />
    </template>
  </main>
</template>

<style scoped>
.create-form,
.field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.room-key {
  display: block;
  margin-bottom: 1.5rem;
  font-size: 1.5rem;
  font-weight: bold;
}
</style>
