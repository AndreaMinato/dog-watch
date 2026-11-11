<script setup lang="ts">
// Modulo per entrare in una Stanza, condiviso dalle varianti A e B della Home.
import type { Species } from './mascot-svg'
import { computed, shallowRef } from 'vue'
import { room } from './mock'
import PrototypeMascot from './PrototypeMascot.vue'

const { knownKey = false, initialRole = null } = defineProps<{ knownKey?: boolean, initialRole?: 'camera' | 'viewer' | null }>()

const species: Species[] = ['cane', 'gatto', 'coniglio']
const role = shallowRef<'camera' | 'viewer' | null>(initialRole)
const animal = shallowRef(0)
const done = shallowRef(false)
const nameLabel = computed(() => role.value === 'camera' ? 'Che stanza riprende?' : 'Come ti chiami? Lo vedono gli altri')
const namePlaceholder = computed(() => role.value === 'camera' ? 'Soggiorno' : 'Andrea')
</script>

<template>
  <form class="entry" @submit.prevent="done = true">
    <label v-if="!knownKey" class="field">
      <span class="lbl">Chiave</span>
      <input id="entry-key" type="text" placeholder="tazza ombra vento pino" autocomplete="off" autocapitalize="none" spellcheck="false">
      <small class="soft">Quattro parole. Le trovi nel messaggio di chi ti ha invitato.</small>
    </label>
    <p v-else class="known surface">
      <span class="lbl">Stai entrando in</span>
      <b class="title">{{ room.name }}</b>
    </p>

    <fieldset class="roles">
      <legend class="lbl">
        Con questo dispositivo vuoi
      </legend>
      <label class="role" :class="{ on: role === 'viewer' }">
        <input v-model="role" type="radio" value="viewer">
        <span class="role-fig"><PrototypeMascot :species="species[animal]!" pose="affacciato" label="Affacciato" /></span>
        <b>Guardare</b>
        <small class="soft">Vedi le telecamere della Stanza</small>
      </label>
      <label class="role" :class="{ on: role === 'camera' }">
        <input v-model="role" type="radio" value="camera">
        <span class="role-fig"><PrototypeMascot :species="species[animal]!" label="Seduto" /></span>
        <b>Fare da telecamera</b>
        <small class="soft">Lascia questo telefono acceso in una stanza</small>
      </label>
    </fieldset>

    <template v-if="role">
      <label class="field">
        <span class="lbl">{{ nameLabel }}</span>
        <input id="entry-name" type="text" :placeholder="namePlaceholder">
      </label>
      <div class="animal">
        <span class="avatar"><PrototypeMascot :species="species[animal]!" :pose="role === 'camera' ? 'seduto' : 'affacciato'" crop :label="species[animal]!" /></span>
        <span>Il tuo animale è il <b>{{ species[animal] }}</b>. Gli altri ti riconoscono da lui.</span>
        <button type="button" class="change" @click="animal = (animal + 1) % species.length">
          Cambia
        </button>
      </div>
      <button type="submit" class="btn">
        Entra
      </button>
      <p v-if="done" class="soft" role="status">
        (Prototipo: qui si aprirebbe la Stanza.)
      </p>
    </template>
  </form>
</template>

<style scoped>
.entry {
  display: grid;
  gap: 18px;
}
.field {
  display: grid;
  gap: 6px;
}
.known {
  display: grid;
  gap: 2px;
  padding: 14px 16px;
}
.known .title {
  font-size: 26px;
  font-weight: 400;
}
.roles {
  border: 0;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}
.roles legend {
  margin-bottom: 8px;
}
.role {
  display: grid;
  gap: 2px;
  padding: 12px;
  border-radius: 18px;
  background: var(--surface);
  cursor: pointer;
  box-shadow: inset 0 0 0 2px transparent;
}
.role.on {
  box-shadow: inset 0 0 0 2px var(--ink);
}
.role input {
  position: absolute;
  opacity: 0;
  pointer-events: none;
}
.role:has(input:focus-visible) {
  outline: 3px solid var(--live);
  outline-offset: 3px;
}
.role-fig {
  width: 72px;
  height: 72px;
}
.role-fig svg {
  display: block;
  width: 100%;
  height: 100%;
}
.role small {
  font-size: 13px;
  line-height: 1.3;
}
.animal {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
}
.animal .avatar {
  width: 44px;
  height: 44px;
}
.change {
  margin-left: auto;
  border: 0;
  background: none;
  font: inherit;
  font-weight: 700;
  color: var(--ink);
  text-decoration: underline;
  cursor: pointer;
}
</style>
