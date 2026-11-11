<script setup lang="ts">
// Variante A · Pannello: inquadratura in alto, sotto chi guarda e i comandi.
import { computed, shallowRef } from 'vue'
import { room, thisCamera, watchersFor } from '../mock'
import PrototypeFeed from '../PrototypeFeed.vue'
import PrototypeMascot from '../PrototypeMascot.vue'
import PrototypeRest from '../PrototypeRest.vue'

const { scenario } = defineProps<{ scenario: string }>()

const watchers = computed(() => watchersFor(scenario))
const resting = shallowRef(false)
</script>

<template>
  <div class="page">
    <header class="top">
      <div>
        <h1 class="title">
          {{ thisCamera.name }}
        </h1>
        <p class="soft">
          Telecamera · {{ room.name }}
        </p>
      </div>
      <span class="avatar me"><PrototypeMascot :species="thisCamera.species" crop label="Questa telecamera, gatto" /></span>
    </header>

    <p v-if="scenario === 'arrivo'" class="banner surface">
      <i class="dot" /> <span><b>Marta</b> è entrata nella Stanza.</span>
    </p>

    <PrototypeFeed :cam="thisCamera" class="video">
      <span class="pill onair">In diretta da 3 ore</span>
    </PrototypeFeed>

    <section class="watch surface" aria-labelledby="watch-a">
      <h2 id="watch-a" class="lbl">
        Stanno guardando
      </h2>
      <p v-if="watchers.length === 0" class="soft">
        Nessuno, per ora. Quando qualcuno entra lo vedi qui.
      </p>
      <ul v-else>
        <li v-for="w in watchers" :key="w.name">
          <span class="who"><span class="avatar"><PrototypeMascot :species="w.species" pose="affacciato" crop :label="w.name" /></span><b>{{ w.name }}</b></span>
          <span class="soft">da {{ w.since }}</span>
        </li>
      </ul>
    </section>

    <p class="banner surface" :class="{ warn: scenario === 'schermo' }">
      <i class="dot" />
      <span v-if="scenario === 'schermo'">Questo telefono non riesce a tenere acceso lo schermo da solo. Allunga il blocco automatico nelle impostazioni, altrimenti la trasmissione si ferma.</span>
      <span v-else>Tieni l'app aperta e il telefono in carica. Se blocchi lo schermo la trasmissione si ferma.</span>
    </p>

    <div class="actions">
      <button type="button" class="btn" @click="resting = true">
        Oscura lo schermo
      </button>
      <button type="button" class="btn ghost">
        Esci dalla Stanza
      </button>
    </div>
  </div>
  <PrototypeRest v-if="resting" :watching="watchers.length" @wake="resting = false" />
</template>

<style scoped>
.page {
  display: grid;
  gap: 16px;
  padding: 28px 16px 24px;
  align-content: start;
}
.top {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.top .title {
  font-size: 32px;
}
.me {
  width: 46px;
  height: 46px;
}
.video {
  aspect-ratio: 16 / 10;
  border-radius: 18px;
}
.onair {
  position: absolute;
  top: 10px;
  left: 10px;
  z-index: 1;
}
.watch {
  display: grid;
  gap: 10px;
  padding: 14px;
}
.watch ul {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 8px;
}
.watch li {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 15px;
}
.who {
  display: flex;
  align-items: center;
  gap: 8px;
}
.who .avatar {
  width: 30px;
  height: 30px;
}
.banner {
  display: flex;
  gap: 10px;
  align-items: flex-start;
  padding: 12px 14px;
  font-size: 14px;
}
.banner .dot {
  flex: none;
  width: 10px;
  height: 10px;
  margin-top: 5px;
  border-radius: 50%;
  background: var(--live);
}
.banner.warn {
  box-shadow: inset 0 0 0 2px var(--live);
}
.actions {
  display: grid;
  gap: 10px;
}
@container (min-width: 700px) {
  .page {
    grid-template-columns: minmax(0, 1.4fr) minmax(0, 1fr);
    gap: 20px 28px;
    padding: 36px 32px;
  }
  .top,
  .page > .banner:first-of-type {
    grid-column: 1 / -1;
  }
  .video {
    grid-row: span 3;
  }
}
</style>
