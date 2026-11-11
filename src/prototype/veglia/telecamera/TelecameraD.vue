<script setup lang="ts">
// Variante D · Specchio + chi guarda: inquadratura a tutto schermo per sistemare il telefono, chi guarda a portata di tocco, schermo che si oscura da solo.
import { computed, onBeforeUnmount, onMounted, shallowRef } from 'vue'
import { thisCamera, watchersFor } from '../mock'
import PrototypeFeed from '../PrototypeFeed.vue'
import PrototypeMascot from '../PrototypeMascot.vue'
import PrototypeRest from '../PrototypeRest.vue'

const { scenario } = defineProps<{ scenario: string }>()

const watchers = computed(() => watchersFor(scenario))
const resting = shallowRef(false)
const sheet = shallowRef(false)
const rotated = shallowRef(false)
const firstRunTip = shallowRef(scenario === 'primo')

// Nel prototipo lo scenario "oscura" accorcia l'attesa per vederlo succedere.
const idleMs = scenario === 'oscura' ? 8_000 : 120_000
let timer: ReturnType<typeof setTimeout> | undefined
function restartIdle() {
  clearTimeout(timer)
  timer = setTimeout(() => {
    resting.value = true
  }, idleMs)
}
function wake() {
  resting.value = false
  restartIdle()
}

onMounted(() => {
  restartIdle()
  window.addEventListener('pointerdown', restartIdle)
})
onBeforeUnmount(() => {
  clearTimeout(timer)
  window.removeEventListener('pointerdown', restartIdle)
})

const watchingLabel = computed(() => watchers.value.length === 0 ? 'Nessuno guarda' : `${watchers.value.length} ${watchers.value.length === 1 ? 'persona guarda' : 'persone guardano'}`)
const newKey = 'lampada-nuvola-sedia-mare'.split('-')
</script>

<template>
  <PrototypeFeed :cam="thisCamera" class="mirror" />

  <header class="float-top">
    <span class="chip">
      <span class="avatar"><PrototypeMascot :species="thisCamera.species" crop label="Questa telecamera, gatto" /></span>
      <b>{{ thisCamera.name }}</b>
      <span class="pill">In diretta</span>
    </span>
    <button type="button" class="chip watchers" :aria-label="`${watchingLabel}. Mostra chi`" @click="sheet = true">
      <template v-if="!rotated && watchers.length">
        <span v-for="w in watchers" :key="w.name" class="avatar"><PrototypeMascot :species="w.species" pose="affacciato" crop :label="w.name" /></span>
        <span>{{ watchers.length }}</span>
      </template>
      <span v-else>Nessuno guarda</span>
    </button>
  </header>

  <div v-if="firstRunTip" class="float-toast">
    <p>Tieni l'app aperta e il telefono in carica: se blocchi lo schermo la trasmissione si ferma. Lo schermo si oscura da solo dopo 2 minuti.</p>
    <button type="button" class="btn ghost small" @click="firstRunTip = false">
      Ho capito
    </button>
  </div>
  <p v-else-if="scenario === 'arrivo' && !sheet" class="float-toast">
    <b>Marta</b> sta guardando.
  </p>
  <p v-else-if="scenario === 'schermo'" class="float-toast warn">
    Questo telefono non riesce a tenere acceso lo schermo da solo. Allunga il blocco automatico nelle impostazioni.
  </p>

  <footer class="float-bottom">
    <button type="button" class="round" aria-label="Cambia obiettivo">
      ⟲
    </button>
    <button type="button" class="btn" @click="resting = true">
      Oscura lo schermo
    </button>
    <button type="button" class="round" aria-label="Esci dalla Stanza">
      ✕
    </button>
  </footer>

  <div v-if="sheet" class="scrim" @click.self="sheet = false">
    <section class="sheet" role="dialog" aria-modal="true" aria-labelledby="watchers-title">
      <h2 id="watchers-title" class="title">
        Stanno guardando
      </h2>
      <p v-if="rotated || watchers.length === 0" class="soft">
        Nessuno, per ora.
      </p>
      <ul v-else class="list">
        <li v-for="w in watchers" :key="w.name">
          <span class="avatar"><PrototypeMascot :species="w.species" pose="affacciato" crop :label="w.name" /></span>
          <b>{{ w.name }}</b>
          <span class="soft">da {{ w.since }}</span>
        </li>
      </ul>

      <div v-if="!rotated" class="stranger surface">
        <p><b>Qualcuno che non conosci?</b></p>
        <p class="soft">
          Rigenera la Chiave: tutti gli altri escono dalla Stanza, e per rientrare serve la Chiave nuova.
        </p>
        <button type="button" class="btn ghost" @click="rotated = true">
          Rigenera la Chiave
        </button>
      </div>
      <div v-else class="stranger surface">
        <p><b>Fatto: tutti gli altri sono usciti.</b></p>
        <p class="soft">
          La Chiave nuova è questa. Dalla solo a chi deve guardare.
        </p>
        <p class="words">
          <span v-for="w in newKey" :key="w">{{ w }}</span>
        </p>
      </div>

      <button type="button" class="btn" @click="sheet = false">
        Chiudi
      </button>
    </section>
  </div>

  <PrototypeRest v-if="resting" :watching="rotated ? 0 : watchers.length" @wake="wake" />
</template>

<style scoped>
.mirror {
  height: 100%;
  min-height: 100%;
}
.float-top {
  position: absolute;
  top: 14px;
  left: 12px;
  right: 12px;
  z-index: 5;
  display: flex;
  justify-content: space-between;
  gap: 8px;
}
.chip {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 5px 10px 5px 5px;
  border: 0;
  border-radius: 999px;
  font: inherit;
  font-size: 15px;
  background: rgb(15 20 53 / 55%);
  color: #fff;
  backdrop-filter: blur(8px);
}
.chip .avatar {
  width: 30px;
  height: 30px;
}
.watchers {
  padding-left: 10px;
  cursor: pointer;
  box-shadow: inset 0 0 0 1.5px rgb(255 255 255 / 45%);
}
.watchers .avatar {
  width: 26px;
  height: 26px;
  margin-left: -6px;
  border: 2px solid rgb(15 20 53 / 60%);
}
.float-toast {
  position: absolute;
  top: 70px;
  left: 12px;
  right: 12px;
  z-index: 5;
  display: grid;
  gap: 10px;
  padding: 12px 14px;
  border-radius: 14px;
  background: var(--surface);
  color: var(--ink);
  font-size: 14px;
}
.float-toast.warn {
  box-shadow: inset 0 0 0 2px var(--live);
}
.float-toast .small {
  justify-self: start;
  width: auto;
  padding: 8px 16px;
  font-size: 14px;
}
.float-bottom {
  position: absolute;
  left: 16px;
  right: 16px;
  bottom: 18px;
  z-index: 5;
  display: flex;
  align-items: center;
  gap: 12px;
}
.float-bottom .btn {
  flex: 1;
  box-shadow: 0 6px 20px rgb(15 20 53 / 35%);
}
.round {
  flex: none;
  width: 52px;
  height: 52px;
  border: 0;
  border-radius: 50%;
  font: inherit;
  font-size: 20px;
  background: rgb(15 20 53 / 55%);
  color: #fff;
  cursor: pointer;
  backdrop-filter: blur(8px);
}
.scrim {
  position: absolute;
  inset: 0;
  z-index: 10;
  display: flex;
  align-items: flex-end;
  background: rgb(15 20 53 / 45%);
}
.sheet {
  width: 100%;
  max-height: 100%;
  overflow-y: auto;
  display: grid;
  gap: 14px;
  padding: 24px 20px 20px;
  border-radius: 26px 26px 0 0;
  background: var(--bg);
  color: var(--ink);
}
.sheet .title {
  font-size: 28px;
}
.list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 10px;
}
.list li {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 16px;
}
.list .avatar {
  width: 40px;
  height: 40px;
}
.list .soft {
  margin-left: auto;
  font-size: 14px;
}
.stranger {
  display: grid;
  gap: 8px;
  padding: 14px;
  font-size: 15px;
}
.words {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.words span {
  font-family: var(--f-display);
  font-size: 22px;
  padding: 2px 12px;
  border-radius: 10px;
  background: var(--bg);
}
@container (min-width: 700px) {
  .float-bottom {
    left: 50%;
    right: auto;
    width: 440px;
    transform: translateX(-50%);
  }
  .float-toast {
    left: auto;
    width: 380px;
  }
  .scrim {
    align-items: center;
    justify-content: center;
  }
  .sheet {
    max-width: 460px;
    border-radius: 26px;
  }
}
</style>
