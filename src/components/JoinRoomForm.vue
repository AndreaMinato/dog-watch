<script setup lang="ts">
import type { Role } from '../room/room-client'
import { computed, shallowRef } from 'vue'
import { useRouter } from 'vue-router'
import { compatibility } from '../device/compatibility'
import { joinErrorMessage } from '../room/messages'
import { useRoom } from '../room/use-room'

const { roomKey } = defineProps<{ roomKey?: string }>()

const router = useRouter()
const { join } = useRoom()

const key = shallowRef('')
const role = shallowRef<Role>('viewer')
const name = shallowRef('')
const pending = shallowRef(false)
const error = shallowRef<string | null>(null)

const nameLabel = computed(() => role.value === 'camera' ? 'Nome della Camera' : 'Soprannome')

async function submit() {
  pending.value = true
  error.value = null
  try {
    await join({ key: roomKey ?? key.value, role: role.value, name: name.value })
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
        > Camera
      </label>
      <label><input v-model="role" type="radio" value="viewer"> Spettatore</label>
    </fieldset>
    <p v-if="!compatibility.camera" id="camera-unsupported">
      Questo browser non può usare la fotocamera o tenere lo schermo acceso, quindi qui puoi entrare solo come Spettatore.
      Per fare da Camera usa Safari su iPhone o iPad (iOS 16.4 o successivo) oppure Chrome su Android.
    </p>
    <label class="field">
      {{ nameLabel }}
      <input v-model.trim="name" required maxlength="40">
    </label>
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
  gap: 1rem;
}
</style>
