<script setup lang="ts">
// Variante D · Domande + Stanze: chi torna vede le sue Stanze; chi è nuovo, o vuole usare il dispositivo altrove, segue le domande di C.
import { computed, shallowRef } from 'vue'
import { recentRoomsFor } from '../mock'
import PrototypeMascot from '../PrototypeMascot.vue'
import HomeC from './HomeC.vue'

const { scenario } = defineProps<{ scenario: string }>()

const forgotten = shallowRef<string[]>([])
const recent = computed(() => recentRoomsFor(scenario).filter(r => !forgotten.value.includes(r.name)))
const asking = shallowRef(false)
const entering = shallowRef<string | null>(null)
</script>

<template>
  <HomeC v-if="scenario !== 'stanze' || asking || recent.length === 0" :scenario="scenario === 'stanze' ? 'primo' : scenario" :exit-label="recent.length ? 'Le tue Stanze' : undefined" @exit="asking = false" />

  <div v-else class="page">
    <header class="bar">
      <b class="title">Veglia</b>
    </header>
    <h1 class="title big">
      Le tue Stanze
    </h1>
    <ul class="rooms">
      <li v-for="r in recent" :key="r.name" class="room surface">
        <button type="button" class="enter" @click="entering = r.name">
          <span class="avatar"><PrototypeMascot :species="r.species" pose="affacciato" crop :label="r.memberName" /></span>
          <span class="text">
            <b class="title">{{ r.name }}</b>
            <small class="soft">Spettatore · {{ r.memberName }} · ultima visita {{ r.lastVisit }}</small>
          </span>
          <span class="go" aria-hidden="true">→</span>
        </button>
        <button type="button" class="forget" @click="forgotten = [...forgotten, r.name]">
          Dimentica
        </button>
        <p v-if="entering === r.name" class="soft entering" role="status">
          (Prototipo: qui si aprirebbe {{ r.name }}.)
        </p>
      </li>
    </ul>
    <button type="button" class="btn ghost" @click="asking = true">
      Usa questo dispositivo in un'altra Stanza
    </button>
    <a class="how soft" href="#come-funziona">Come funziona e cosa salviamo</a>
  </div>
</template>

<style scoped>
.page {
  display: grid;
  gap: 18px;
  padding: 20px 16px 28px;
  align-content: start;
  max-width: 600px;
  margin: 0 auto;
}
.bar {
  min-height: 32px;
  display: flex;
  align-items: center;
}
.bar .title {
  font-size: 22px;
  font-weight: 400;
}
.big {
  font-size: 34px;
}
.rooms {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 10px;
}
.room {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  padding: 6px 10px 6px 6px;
}
.enter {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
  padding: 8px;
  border: 0;
  border-radius: 14px;
  font: inherit;
  color: var(--ink);
  background: none;
  text-align: left;
  cursor: pointer;
}
.enter .avatar {
  flex: none;
  width: 52px;
  height: 52px;
}
.text {
  display: grid;
  min-width: 0;
  line-height: 1.25;
}
.text .title {
  font-size: 22px;
  font-weight: 400;
}
.text small {
  font-size: 13px;
}
.go {
  margin-left: auto;
  font-size: 20px;
}
.entering {
  grid-column: 1 / -1;
  padding: 0 8px 8px;
  font-size: 13px;
}
.forget {
  border: 0;
  background: none;
  font: inherit;
  font-size: 13px;
  color: var(--soft);
  text-decoration: underline;
  cursor: pointer;
  padding: 8px;
}
.how {
  font-size: 14px;
}
@container (min-width: 700px) {
  .page {
    padding-top: 48px;
  }
  .big {
    font-size: 44px;
  }
}
</style>
