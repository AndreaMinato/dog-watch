<script setup lang="ts">
import type { Screen } from './screens'
import { computed, onBeforeUnmount, onMounted } from 'vue'

export interface PrototypeParams {
  schermata: string
  variante: string
  scenario: string
  tema: 'giorno' | 'notte'
  larghezza: 'telefono' | 'tablet' | 'computer'
}

const { screens, screen } = defineProps<{ screens: Screen[], screen: Screen }>()
const params = defineModel<PrototypeParams>({ required: true })

const index = computed(() => Math.max(0, screen.variants.findIndex(v => v.key === params.value.variante)))
const current = computed(() => screen.variants[index.value]!)

function step(delta: number) {
  const n = screen.variants.length
  params.value = { ...params.value, variante: screen.variants[(index.value + delta + n) % n]!.key }
}

function pickScreen(key: string) {
  const next = screens.find(s => s.key === key)!
  params.value = { ...params.value, schermata: key, variante: 'A', scenario: next.scenarios[0]!.key }
}

function onKey(event: KeyboardEvent) {
  const target = event.target as HTMLElement | null
  if (target?.closest('input, textarea, select, [contenteditable]'))
    return
  if (event.key === 'ArrowLeft')
    step(-1)
  if (event.key === 'ArrowRight')
    step(1)
}

onMounted(() => window.addEventListener('keydown', onKey))
onBeforeUnmount(() => window.removeEventListener('keydown', onKey))
</script>

<template>
  <div class="bar" role="toolbar" aria-label="Controlli del prototipo">
    <span class="tag">PROTOTIPO</span>
    <select id="proto-screen" aria-label="Schermata" :value="params.schermata" @change="pickScreen(($event.target as HTMLSelectElement).value)">
      <option v-for="s in screens" :key="s.key" :value="s.key">
        {{ s.label }}
      </option>
    </select>
    <span class="variant">
      <button type="button" aria-label="Variante precedente" @click="step(-1)">←</button>
      <b>{{ current.key }} · {{ current.name }}</b>
      <button type="button" aria-label="Variante successiva" @click="step(1)">→</button>
    </span>
    <select id="proto-scenario" aria-label="Scenario" :value="params.scenario" @change="params = { ...params, scenario: ($event.target as HTMLSelectElement).value }">
      <option v-for="s in screen.scenarios" :key="s.key" :value="s.key">
        {{ s.label }}
      </option>
    </select>
    <span class="seg" role="group" aria-label="Tema">
      <button v-for="t in (['giorno', 'notte'] as const)" :key="t" type="button" :aria-pressed="params.tema === t" @click="params = { ...params, tema: t }">{{ t }}</button>
    </span>
    <span class="seg" role="group" aria-label="Larghezza">
      <button v-for="w in (['telefono', 'tablet', 'computer'] as const)" :key="w" type="button" :aria-pressed="params.larghezza === w" @click="params = { ...params, larghezza: w }">{{ w }}</button>
    </span>
  </div>
</template>

<style scoped>
.bar {
  position: fixed;
  left: 50%;
  bottom: max(12px, env(safe-area-inset-bottom));
  transform: translateX(-50%);
  z-index: 100;
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  align-items: center;
  gap: 8px;
  width: max-content;
  max-width: calc(100vw - 24px);
  padding: 8px 10px;
  border-radius: 14px;
  background: #111;
  color: #fff;
  font:
    13px/1.2 ui-monospace,
    'SF Mono',
    Menlo,
    monospace;
  box-shadow: 0 8px 30px rgb(0 0 0 / 35%);
}
.tag {
  background: #ff3b30;
  color: #fff;
  font-weight: 700;
  padding: 3px 6px;
  border-radius: 6px;
  font-size: 11px;
}
select,
button {
  font: inherit;
  color: #fff;
  background: #2a2a2a;
  border: 1px solid #444;
  border-radius: 8px;
  padding: 5px 8px;
  cursor: pointer;
}
.variant {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.variant b {
  min-width: 15ch;
  text-align: center;
}
.seg {
  display: inline-flex;
}
.seg button {
  border-radius: 0;
}
.seg button:first-child {
  border-radius: 8px 0 0 8px;
}
.seg button:last-child {
  border-radius: 0 8px 8px 0;
}
.seg button[aria-pressed='true'] {
  background: #fff;
  color: #111;
}
</style>
