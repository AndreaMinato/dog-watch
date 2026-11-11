<script setup lang="ts">
// Variante C · Una domanda alla volta: niente menu, la Home è una conversazione di quattro passi.
import type { Species } from '../mascot-svg'
import { computed, shallowRef } from 'vue'
import { recentRoomsFor, room } from '../mock'
import PrototypeMascot from '../PrototypeMascot.vue'

const { scenario } = defineProps<{ scenario: string }>()

type Step = 'role' | 'key' | 'create' | 'name' | 'animal' | 'done'

const recent = computed(() => recentRoomsFor(scenario))
const invited = scenario === 'link'
const role = shallowRef<'camera' | 'viewer' | null>(null)
const creating = shallowRef(false)
const trail = shallowRef<Step[]>(['role'])
const step = computed(() => trail.value.at(-1)!)
const animal = shallowRef<Species>('cane')
const name = shallowRef('')
const suggestions = ['Soggiorno', 'Cucina', 'Camera da letto', 'Studio', 'Giardino']
const words = room.key.split('-')

const order = computed<Step[]>(() => {
  if (invited)
    return ['role', 'name', 'animal', 'done']
  return ['role', creating.value ? 'create' : 'key', 'name', 'animal', 'done']
})
const position = computed(() => Math.min(order.value.indexOf(step.value) + 1, order.value.length - 1))

function go(next: Step) {
  trail.value = [...trail.value, next]
}
function back() {
  trail.value = trail.value.slice(0, -1)
}
function pickRole(r: 'camera' | 'viewer') {
  role.value = r
  go(invited ? 'name' : 'key')
}
function startCreate() {
  creating.value = true
  trail.value = [...trail.value.slice(0, -1), 'create']
}
</script>

<template>
  <div class="page">
    <header class="bar">
      <button v-if="trail.length > 1 && step !== 'done'" type="button" class="back" @click="back">
        ← Indietro
      </button>
      <b v-else class="title">Veglia</b>
      <span v-if="step !== 'done'" class="soft count">{{ position }} di {{ order.length - 1 }}</span>
    </header>

    <p v-if="invited && step === 'role'" class="invited surface">
      Ti hanno invitato in <b>{{ room.name }}</b>.
    </p>
    <nav v-else-if="recent.length && step === 'role'" class="resume" aria-label="Stanze recenti">
      <span class="lbl">Riprendi</span>
      <button v-for="r in recent" :key="r.name" type="button" class="chip">
        <span class="avatar"><PrototypeMascot :species="r.species" :pose="r.role === 'camera' ? 'seduto' : 'affacciato'" crop :label="r.memberName" /></span>
        {{ r.name }}
      </button>
    </nav>

    <section v-if="step === 'role'" class="q">
      <h1 class="title">
        Cosa farà questo dispositivo?
      </h1>
      <div class="choices">
        <button type="button" class="choice" @click="pickRole('viewer')">
          <span class="fig"><PrototypeMascot :species="animal" pose="affacciato" label="Affacciato" /></span>
          <b>Guarderà la casa</b>
          <small class="soft">Da qui vedi le telecamere</small>
        </button>
        <button type="button" class="choice" @click="pickRole('camera')">
          <span class="fig"><PrototypeMascot :species="animal" label="Seduto" /></span>
          <b>Farà da telecamera</b>
          <small class="soft">Resta acceso in una stanza</small>
        </button>
      </div>
    </section>

    <section v-else-if="step === 'key'" class="q">
      <h1 class="title">
        Hai la Chiave della Stanza?
      </h1>
      <input id="c-key" type="text" placeholder="tazza ombra vento pino" autocomplete="off" autocapitalize="none" spellcheck="false">
      <p class="soft">
        Quattro parole. Le trovi nel messaggio di chi ti ha invitato.
      </p>
      <button type="button" class="btn" @click="go('name')">
        Avanti
      </button>
      <button v-if="role === 'camera'" type="button" class="btn ghost" @click="startCreate">
        Non ce l'ho: crea una Stanza nuova
      </button>
    </section>

    <section v-else-if="step === 'create'" class="q">
      <h1 class="title">
        Ecco la Chiave della tua Stanza
      </h1>
      <input id="c-room" type="text" placeholder="Nome della Stanza, per esempio Casa al mare">
      <p class="words">
        <span v-for="w in words" :key="w">{{ w }}</span>
      </p>
      <p class="soft">
        È l'unico modo per entrare: tienila da parte. La ritrovi dentro la Stanza, con il link e il QR.
      </p>
      <button type="button" class="btn" @click="go('name')">
        Avanti
      </button>
    </section>

    <section v-else-if="step === 'name'" class="q">
      <h1 class="title">
        {{ role === 'camera' ? 'Che stanza riprende?' : 'Come ti chiami?' }}
      </h1>
      <input id="c-name" v-model="name" type="text" :placeholder="role === 'camera' ? 'Soggiorno' : 'Andrea'">
      <p v-if="role === 'camera'" class="sugg">
        <button v-for="s in suggestions" :key="s" type="button" class="chip" @click="name = s">
          {{ s }}
        </button>
      </p>
      <p v-else class="soft">
        Lo vedono le telecamere e gli altri che guardano.
      </p>
      <button type="button" class="btn" @click="go('animal')">
        Avanti
      </button>
    </section>

    <section v-else-if="step === 'animal'" class="q">
      <h1 class="title">
        Scegli il tuo animale
      </h1>
      <p class="soft">
        Gli altri riconoscono questo dispositivo da lui.
      </p>
      <div class="animals">
        <button
          v-for="sp in (['cane', 'gatto', 'coniglio'] as const)" :key="sp" type="button" class="animal"
          :aria-pressed="animal === sp" @click="animal = sp"
        >
          <PrototypeMascot :species="sp" :pose="role === 'camera' ? 'seduto' : 'affacciato'" :label="sp" />
          <span>{{ sp }}</span>
        </button>
      </div>
      <button type="button" class="btn" @click="go('done')">
        Entra
      </button>
    </section>

    <section v-else class="q">
      <div class="fig big">
        <PrototypeMascot :species="animal" :pose="role === 'camera' ? 'seduto' : 'affacciato'" :label="animal" />
      </div>
      <h1 class="title">
        {{ role === 'camera' ? `${name || 'Soggiorno'} è pronta` : `Ciao ${name || 'Andrea'}` }}
      </h1>
      <p class="soft">
        (Prototipo: qui si aprirebbe la Stanza.)
      </p>
      <button type="button" class="btn ghost" @click="trail = ['role']">
        Ricomincia
      </button>
    </section>
  </div>
</template>

<style scoped>
.page {
  display: grid;
  gap: 22px;
  padding: 20px 16px 28px;
  align-content: start;
  max-width: 600px;
  margin: 0 auto;
}
.bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  min-height: 32px;
}
.bar .title {
  font-size: 22px;
  font-weight: 400;
}
.back {
  border: 0;
  background: none;
  font: inherit;
  font-weight: 700;
  color: var(--ink);
  cursor: pointer;
}
.count {
  font-size: 13px;
}
.invited {
  padding: 12px 14px;
}
.resume {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}
.chip {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px 6px 6px;
  border: 0;
  border-radius: 999px;
  font: inherit;
  font-size: 14px;
  color: var(--ink);
  background: var(--surface);
  cursor: pointer;
}
.chip .avatar {
  width: 26px;
  height: 26px;
}
.sugg .chip {
  padding: 6px 12px;
}
.sugg {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.q {
  display: grid;
  gap: 14px;
}
.q > .title {
  font-size: 34px;
}
.choices {
  display: grid;
  gap: 12px;
}
.choice {
  display: grid;
  grid-template-columns: 96px minmax(0, 1fr);
  grid-template-rows: auto auto;
  column-gap: 14px;
  align-items: center;
  padding: 14px;
  border: 0;
  border-radius: 22px;
  font: inherit;
  font-size: 19px;
  color: var(--ink);
  background: var(--surface);
  text-align: left;
  cursor: pointer;
}
.choice b {
  align-self: end;
}
.choice small {
  align-self: start;
  font-size: 14px;
}
.fig {
  grid-row: span 2;
  width: 96px;
  height: 96px;
}
.fig svg,
.animal svg {
  display: block;
  width: 100%;
  height: 100%;
}
.fig.big {
  width: 180px;
  height: 180px;
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
.animals {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}
.animal {
  display: grid;
  gap: 4px;
  justify-items: center;
  padding: 10px 6px 12px;
  border: 0;
  border-radius: 18px;
  font: inherit;
  font-size: 14px;
  color: var(--ink);
  background: var(--surface);
  cursor: pointer;
  box-shadow: inset 0 0 0 2px transparent;
  text-transform: capitalize;
}
.animal[aria-pressed='true'] {
  box-shadow: inset 0 0 0 2px var(--ink);
}
@container (min-width: 700px) {
  .page {
    padding-top: 48px;
  }
  .q > .title {
    font-size: 44px;
  }
  .choices {
    grid-template-columns: 1fr 1fr;
  }
  .choice {
    grid-template-columns: 1fr;
  }
  .choice .fig {
    grid-row: auto;
    width: 140px;
    height: 140px;
  }
}
</style>
