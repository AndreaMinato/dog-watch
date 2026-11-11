<script setup lang="ts">
import type { Species } from '../mascot/mascot'
import type { Role } from '../room/room-client'
import { computed, shallowRef } from 'vue'
import { useRouter } from 'vue-router'
import { compatibility } from '../device/compatibility'
import { randomSpecies, rolePoses, SPECIES } from '../mascot/mascot'
import { joinErrorMessage, speciesLabels } from '../room/messages'
import { useRoom } from '../room/use-room'
import MascotFigure from './MascotFigure.vue'

const { roomKey } = defineProps<{ roomKey?: string }>()

const router = useRouter()
const { join } = useRoom()

const key = shallowRef('')
const role = shallowRef<Role>('viewer')
const name = shallowRef('')
const mascot = shallowRef<Species>(randomSpecies())
const pending = shallowRef(false)
const error = shallowRef<string | null>(null)

const nameLabel = computed(() => role.value === 'camera' ? 'Nome della telecamera' : 'Soprannome')

async function submit() {
  pending.value = true
  error.value = null
  try {
    await join({ key: roomKey ?? key.value, role: role.value, name: name.value, mascot: mascot.value })
    await router.push({ name: 'room' })
  }
  catch (cause) {
    error.value = joinErrorMessage(cause)
  }
  finally {
    pending.value = false
  }
}
</script>

<template>
  <form class="join-form" @submit.prevent="submit">
    <label v-if="roomKey === undefined" class="field">
      Chiave
      <input v-model="key" required autocomplete="off" autocapitalize="none" spellcheck="false">
    </label>
    <fieldset class="roles">
      <legend>Ruolo</legend>
      <label>
        <input
          v-model="role"
          type="radio"
          value="camera"
          :disabled="!compatibility.camera"
          :aria-describedby="compatibility.camera ? undefined : 'camera-unsupported'"
        > Telecamera
      </label>
      <label><input v-model="role" type="radio" value="viewer"> Spettatore</label>
    </fieldset>
    <p v-if="!compatibility.camera" id="camera-unsupported">
      Questo browser non può usare la fotocamera o tenere lo schermo acceso, quindi qui puoi entrare solo come Spettatore.
      Per fare da telecamera usa Safari su iPhone o iPad (iOS 16.4 o successivo) oppure Chrome su Android.
    </p>
    <label class="field">
      {{ nameLabel }}
      <input v-model.trim="name" required maxlength="40">
    </label>
    <fieldset class="animals">
      <legend>Animale</legend>
      <p class="hint">
        Gli altri riconoscono questo dispositivo da lui.
      </p>
      <label v-for="species in SPECIES" :key="species" class="animal">
        <MascotFigure class="figure" :species="species" :pose="rolePoses[role]" aria-hidden="true" />
        <input v-model="mascot" type="radio" :value="species">
        {{ speciesLabels[species] }}
      </label>
    </fieldset>
    <p v-if="error" role="alert">
      {{ error }}
    </p>
    <button type="submit" :disabled="pending">
      Entra
    </button>
  </form>
</template>

<style scoped>
.join-form,
.field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.roles {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem 1.5rem;
  margin: 0;
  padding: 0;
  border: none;
}
.roles legend {
  padding: 0;
}
.roles label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  min-height: var(--touch);
}
.animals {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.5rem;
  margin: 0;
  padding: 0;
  border: none;
}
.animals legend {
  padding: 0;
}
.hint {
  grid-column: 1 / -1;
  margin: 0;
}
.animal {
  display: grid;
  grid-template-columns: auto auto;
  place-content: center;
  align-items: center;
  gap: 0.25rem 0.5rem;
  padding: 0.5rem;
  border-radius: 1.25rem;
  background: var(--surface);
  cursor: pointer;
}
.animal:has(input:checked) {
  box-shadow: inset 0 0 0 2px var(--text);
}
.figure {
  grid-column: 1 / -1;
  justify-self: center;
  width: 4.5rem;
}
</style>
