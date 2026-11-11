<script setup lang="ts">
// Variante C · Specchio: l'inquadratura occupa tutto lo schermo, per puntare bene il telefono; il resto galleggia sopra.
import { computed, shallowRef } from 'vue'
import { thisCamera, watchersFor } from '../mock'
import PrototypeFeed from '../PrototypeFeed.vue'
import PrototypeMascot from '../PrototypeMascot.vue'
import PrototypeRest from '../PrototypeRest.vue'

const { scenario } = defineProps<{ scenario: string }>()

const watchers = computed(() => watchersFor(scenario))
const resting = shallowRef(false)
</script>

<template>
  <PrototypeFeed :cam="thisCamera" class="mirror" />

  <header class="float-top">
    <span class="chip">
      <span class="avatar"><PrototypeMascot :species="thisCamera.species" crop label="Questa telecamera, gatto" /></span>
      <b>{{ thisCamera.name }}</b>
      <span class="pill">In diretta</span>
    </span>
    <span class="chip watchers" :aria-label="`Stanno guardando: ${watchers.map(w => w.name).join(', ') || 'nessuno'}`">
      <template v-if="watchers.length">
        <span v-for="w in watchers" :key="w.name" class="avatar"><PrototypeMascot :species="w.species" pose="affacciato" crop :label="w.name" /></span>
        <span>{{ watchers.length }}</span>
      </template>
      <span v-else>Nessuno guarda</span>
    </span>
  </header>

  <p v-if="scenario === 'arrivo'" class="float-toast">
    <b>Marta</b> sta guardando.
  </p>
  <p v-if="scenario === 'schermo'" class="float-toast warn">
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
  <PrototypeRest v-if="resting" :watching="watchers.length" @wake="resting = false" />
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
  border-radius: 999px;
  background: rgb(15 20 53 / 55%);
  color: #fff;
  font-size: 15px;
  backdrop-filter: blur(8px);
}
.chip .avatar {
  width: 30px;
  height: 30px;
}
.watchers {
  padding-left: 10px;
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
  padding: 10px 14px;
  border-radius: 14px;
  background: var(--surface);
  color: var(--ink);
  font-size: 14px;
}
.float-toast.warn {
  box-shadow: inset 0 0 0 2px var(--live);
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
}
</style>
