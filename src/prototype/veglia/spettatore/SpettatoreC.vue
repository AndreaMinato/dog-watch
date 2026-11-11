<script setup lang="ts">
// Variante C · Muro: i video riempiono lo schermo da bordo a bordo, i comandi galleggiano sopra.
import { computed, shallowRef } from 'vue'
import { camsFor, offMessage, room, statusLabel, viewersFor } from '../mock'
import PrototypeFeed from '../PrototypeFeed.vue'
import PrototypeInvite from '../PrototypeInvite.vue'
import PrototypeMascot from '../PrototypeMascot.vue'

const { scenario } = defineProps<{ scenario: string }>()

const cams = computed(() => camsFor(scenario))
const viewers = computed(() => viewersFor(scenario))
const focusedId = shallowRef<string | null>(null)
const shown = computed(() => focusedId.value ? cams.value.filter(c => c.id === focusedId.value) : cams.value)
const inviting = shallowRef(false)

function toggle(id: string) {
  focusedId.value = focusedId.value === id ? null : id
}
</script>

<template>
  <div class="wall" :class="{ single: shown.length === 1 }">
    <div v-if="cams.length === 0" class="empty">
      <div class="empty-figure">
        <PrototypeMascot species="cane" pose="affacciato" state="cerca" label="Cane che aspetta" />
      </div>
      <p class="title">
        Qui non c'è ancora nessuna telecamera.
      </p>
      <p class="soft">
        Hai un vecchio telefono nel cassetto? Può diventarlo: aprilo lì, entra con la Chiave e scegli "Telecamera".
      </p>
    </div>

    <button
      v-for="cam in shown" :key="cam.id" type="button" class="tile"
      :aria-label="focusedId ? `Torna a tutte le telecamere` : `Ingrandisci ${cam.name}`" @click="toggle(cam.id)"
    >
      <PrototypeFeed :cam="cam" class="video">
        <span class="label">
          <span class="avatar"><PrototypeMascot :species="cam.species" :state="cam.status === 'off' ? 'dorme' : 'sveglio'" crop :label="cam.name" /></span>
          <b>{{ cam.name }}</b>
          <span class="pill" :class="{ off: cam.status === 'off', wait: cam.status === 'connecting' }">{{ statusLabel(cam) }}</span>
        </span>
        <span v-if="cam.status === 'off'" class="offnote">{{ offMessage(cam) }}</span>
      </PrototypeFeed>
    </button>
  </div>

  <header class="float-top">
    <b class="title">{{ room.name }}</b>
    <span class="faces" :aria-label="`Stanno guardando: ${viewers.map(v => v.you ? 'tu' : v.name).join(', ')}`">
      <span v-for="v in viewers" :key="v.name" class="avatar"><PrototypeMascot :species="v.species" pose="affacciato" crop :label="v.name" /></span>
    </span>
  </header>
  <button v-if="focusedId" type="button" class="float-back" @click="focusedId = null">
    ← Tutte
  </button>
  <button type="button" class="float-invite btn" @click="inviting = true">
    Invita
  </button>
  <PrototypeInvite v-if="inviting" @close="inviting = false" />
</template>

<style scoped>
.wall {
  display: grid;
  grid-auto-rows: minmax(220px, 1fr);
  gap: 3px;
  min-height: 100%;
  height: 100%;
  background: var(--edge);
}
.wall.single {
  grid-auto-rows: 1fr;
}
.tile {
  display: block;
  border: 0;
  padding: 0;
  font: inherit;
  color: inherit;
  text-align: left;
  cursor: zoom-in;
  min-height: 0;
}
.single .tile {
  cursor: zoom-out;
}
.video {
  width: 100%;
  height: 100%;
}
.label {
  position: absolute;
  left: 12px;
  bottom: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 5px 6px 5px 5px;
  border-radius: 999px;
  background: rgb(15 20 53 / 55%);
  color: #fff;
  font-size: 15px;
  backdrop-filter: blur(6px);
}
.label .avatar {
  width: 28px;
  height: 28px;
}
.label .pill.off {
  color: #fff;
  box-shadow: inset 0 0 0 1.5px rgb(255 255 255 / 60%);
}
.offnote {
  position: absolute;
  top: 70px;
  left: 16px;
  right: 16px;
  font-size: 14px;
  color: var(--ink);
}
.float-top {
  position: absolute;
  top: 14px;
  left: 14px;
  right: 14px;
  z-index: 5;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 10px 8px 16px;
  border-radius: 999px;
  background: rgb(15 20 53 / 50%);
  color: #fff;
  backdrop-filter: blur(8px);
}
.float-top .title {
  font-size: 18px;
  font-weight: 400;
}
.faces {
  display: flex;
}
.faces .avatar {
  width: 28px;
  height: 28px;
  margin-left: -6px;
  border: 2px solid rgb(15 20 53 / 60%);
}
.float-back {
  position: absolute;
  top: 70px;
  left: 14px;
  z-index: 5;
  border: 0;
  font: inherit;
  font-weight: 700;
  padding: 8px 14px;
  border-radius: 999px;
  background: var(--surface);
  color: var(--ink);
  cursor: pointer;
}
.float-invite.btn {
  position: absolute;
  right: 16px;
  bottom: 16px;
  z-index: 5;
  width: auto;
  box-shadow: 0 6px 20px rgb(15 20 53 / 35%);
}
.empty {
  display: grid;
  gap: 12px;
  align-content: center;
  padding: 90px 24px 24px;
  background: var(--bg);
}
.empty .title {
  font-size: 24px;
}
.empty-figure {
  width: 140px;
}
.empty-figure svg {
  display: block;
  width: 100%;
}
@container (min-width: 700px) {
  .wall:not(.single) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .wall:not(.single) .tile:last-child:nth-child(odd) {
    grid-column: span 2;
  }
  .float-top {
    right: auto;
    gap: 16px;
  }
}
@container (min-width: 1100px) {
  .wall:not(.single) {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
  .wall:not(.single) .tile:last-child:nth-child(odd) {
    grid-column: auto;
  }
}
</style>
