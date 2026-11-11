<script setup lang="ts">
// Variante B · Quadro: pensata per essere letta da lontano, la Mascotte al centro e l'inquadratura solo se la chiedi.
import { computed, shallowRef } from 'vue'
import { room, thisCamera, watchersFor } from '../mock'
import PrototypeFeed from '../PrototypeFeed.vue'
import PrototypeMascot from '../PrototypeMascot.vue'
import PrototypeRest from '../PrototypeRest.vue'

const { scenario } = defineProps<{ scenario: string }>()

const watchers = computed(() => watchersFor(scenario))
const watching = computed(() => {
  const names = watchers.value.map(w => w.name)
  if (names.length === 0)
    return 'Nessuno sta guardando'
  if (names.length === 1)
    return `${names[0]} sta guardando`
  return `${names.slice(0, -1).join(', ')} e ${names.at(-1)} stanno guardando`
})
const framing = shallowRef(false)
const resting = shallowRef(false)
</script>

<template>
  <div class="quadro">
    <p class="room soft">
      {{ room.name }}
    </p>

    <div class="center">
      <div class="hero">
        <PrototypeFeed v-if="framing" :cam="thisCamera" class="video" />
        <PrototypeMascot v-else :species="thisCamera.species" :label="`${thisCamera.name}, gatto`" />
      </div>
      <h1 class="title">
        {{ thisCamera.name }}
      </h1>
      <span class="pill">In diretta da 3 ore</span>
      <p class="watching">
        <span class="faces">
          <span v-for="w in watchers" :key="w.name" class="avatar"><PrototypeMascot :species="w.species" pose="affacciato" crop :label="w.name" /></span>
        </span>
        <span>{{ watching }}</span>
      </p>
      <p v-if="scenario === 'arrivo'" class="toast">
        Marta è entrata nella Stanza.
      </p>
    </div>

    <p class="hint soft" :class="{ warn: scenario === 'schermo' }">
      <template v-if="scenario === 'schermo'">
        Questo telefono non riesce a tenere acceso lo schermo da solo. Allunga il blocco automatico nelle impostazioni.
      </template>
      <template v-else>
        Lascia l'app aperta e il telefono in carica.
      </template>
    </p>

    <div class="actions">
      <button type="button" class="btn ghost" @click="framing = !framing">
        {{ framing ? "Nascondi l'inquadratura" : "Mostra l'inquadratura" }}
      </button>
      <button type="button" class="btn" @click="resting = true">
        Oscura lo schermo
      </button>
      <button type="button" class="link">
        Esci dalla Stanza
      </button>
    </div>
  </div>
  <PrototypeRest v-if="resting" :watching="watchers.length" @wake="resting = false" />
</template>

<style scoped>
.quadro {
  min-height: 100%;
  display: grid;
  grid-template-rows: auto 1fr auto auto;
  gap: 16px;
  padding: 28px 20px 24px;
  text-align: center;
}
.room {
  font-size: 14px;
}
.center {
  display: grid;
  justify-items: center;
  align-content: center;
  gap: 12px;
}
.hero {
  width: min(62cqw, 300px);
  aspect-ratio: 1;
  display: grid;
  place-items: end center;
  border-radius: 50%;
  background: var(--tile);
  overflow: hidden;
}
.hero svg {
  display: block;
  width: 92%;
}
.hero .video {
  width: 100%;
  height: 100%;
}
.center .title {
  font-size: clamp(40px, 12cqw, 72px);
}
.watching {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 17px;
}
.faces {
  display: flex;
}
.faces .avatar {
  width: 32px;
  height: 32px;
  margin-right: -8px;
  border: 2px solid var(--bg);
}
.toast {
  padding: 8px 14px;
  border-radius: 999px;
  background: var(--surface);
  font-size: 14px;
}
.hint {
  font-size: 14px;
}
.hint.warn {
  color: var(--ink);
  padding: 10px 14px;
  border-radius: 14px;
  box-shadow: inset 0 0 0 2px var(--live);
  text-align: left;
}
.actions {
  display: grid;
  gap: 10px;
}
.link {
  border: 0;
  background: none;
  font: inherit;
  color: var(--soft);
  text-decoration: underline;
  padding: 6px;
  cursor: pointer;
}
@container (min-width: 700px) {
  .actions {
    grid-template-columns: 1fr 1fr;
    max-width: 560px;
    justify-self: center;
    width: 100%;
  }
  .link {
    grid-column: 1 / -1;
  }
}
</style>
