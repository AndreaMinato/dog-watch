<script setup lang="ts">
// Variante B · Una alla volta: un video grande, le altre telecamere come schede per passare dall'una all'altra.
import { computed, shallowRef } from 'vue'
import { camsFor, offMessage, room, statusLabel, viewersFor } from '../mock'
import PrototypeFeed from '../PrototypeFeed.vue'
import PrototypeInvite from '../PrototypeInvite.vue'
import PrototypeMascot from '../PrototypeMascot.vue'

const { scenario } = defineProps<{ scenario: string }>()

const cams = computed(() => camsFor(scenario))
const viewers = computed(() => viewersFor(scenario))
const pickedId = shallowRef<string | null>(null)
const picked = computed(() => cams.value.find(c => c.id === pickedId.value) ?? cams.value.find(c => c.status === 'live') ?? cams.value[0])
const others = computed(() => viewers.value.filter(v => !v.you))
const inviting = shallowRef(false)
</script>

<template>
  <div class="page">
    <header class="top">
      <h1 class="title">
        {{ room.name }}
      </h1>
      <span class="avatar me"><PrototypeMascot species="cane" pose="affacciato" crop label="Tu, cane" /></span>
    </header>

    <div v-if="!picked" class="empty">
      <div class="empty-figure">
        <PrototypeMascot species="coniglio" pose="affacciato" state="cerca" label="Coniglio che aspetta" />
      </div>
      <p class="title">
        Qui non c'è ancora nessuna telecamera.
      </p>
      <p class="soft">
        Hai un vecchio telefono nel cassetto? Può diventarlo: aprilo lì, entra con la Chiave e scegli "Telecamera".
      </p>
      <button type="button" class="btn" @click="inviting = true">
        Mostra la Chiave
      </button>
    </div>

    <template v-else>
      <section class="stage-cam" :aria-label="picked.name">
        <PrototypeFeed :cam="picked" class="video">
          <div class="overlay">
            <b>{{ picked.name }}</b>
            <span class="pill" :class="{ off: picked.status === 'off', wait: picked.status === 'connecting' }">{{ statusLabel(picked) }}</span>
          </div>
        </PrototypeFeed>
        <p v-if="picked.status === 'off'" class="note soft">
          {{ offMessage(picked) }}
        </p>
      </section>

      <nav class="tabs" aria-label="Telecamere">
        <button
          v-for="cam in cams" :key="cam.id" type="button" class="tab"
          :aria-current="cam.id === picked.id" @click="pickedId = cam.id"
        >
          <span class="avatar"><PrototypeMascot :species="cam.species" :state="cam.status === 'off' ? 'dorme' : 'sveglio'" crop :label="cam.name" /></span>
          <span class="tab-text">
            <b>{{ cam.name }}</b>
            <small :class="cam.status">{{ statusLabel(cam) }}</small>
          </span>
        </button>
      </nav>

      <footer class="foot">
        <p class="soft">
          {{ others.length === 0 ? 'Stai guardando solo tu' : `Con te: ${others.map(v => v.name).join(', ')}` }}
        </p>
        <button type="button" class="btn ghost" @click="inviting = true">
          Invita qualcuno
        </button>
      </footer>
    </template>
    <PrototypeInvite v-if="inviting" @close="inviting = false" />
  </div>
</template>

<style scoped>
.page {
  display: grid;
  gap: 16px;
  padding: 24px 0 24px;
  align-content: start;
  min-height: 100%;
}
.top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 16px;
}
.top .title {
  font-size: 26px;
}
.me {
  width: 40px;
  height: 40px;
}
.stage-cam {
  display: grid;
  gap: 8px;
}
.video {
  aspect-ratio: 4 / 5;
}
.overlay {
  position: absolute;
  inset: auto 0 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  padding: 28px 16px 14px;
  font-size: 18px;
  color: #fff;
  background: linear-gradient(to top, rgb(15 20 53 / 55%), transparent);
}
.note {
  padding: 0 16px;
  font-size: 14px;
}
.tabs {
  display: flex;
  gap: 10px;
  overflow-x: auto;
  padding: 0 16px 4px;
  scrollbar-width: none;
}
.tab {
  flex: none;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 14px 8px 8px;
  border: 0;
  border-radius: 999px;
  font: inherit;
  color: var(--ink);
  background: var(--surface);
  cursor: pointer;
  text-align: left;
}
.tab[aria-current='true'] {
  box-shadow: inset 0 0 0 2px var(--ink);
}
.tab .avatar {
  width: 36px;
  height: 36px;
}
.tab-text {
  display: grid;
  line-height: 1.2;
}
.tab small {
  font-size: 12px;
  color: var(--soft);
}
.tab small.live::before {
  content: '';
  display: inline-block;
  width: 7px;
  height: 7px;
  margin-right: 5px;
  border-radius: 50%;
  background: var(--live);
}
.foot {
  display: grid;
  gap: 10px;
  padding: 0 16px;
  font-size: 14px;
}
.empty {
  display: grid;
  gap: 12px;
  padding: 24px 16px;
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
  .page {
    grid-template-columns: minmax(0, 1fr) 300px;
    grid-template-rows: auto auto 1fr;
    grid-template-areas:
      'top top'
      'cam tabs'
      'cam foot';
    gap: 20px 28px;
    padding: 32px;
    align-content: start;
  }
  .top {
    grid-area: top;
    padding: 0;
  }
  .stage-cam {
    grid-area: cam;
  }
  .video {
    aspect-ratio: 16 / 10;
    border-radius: 20px;
  }
  .note {
    padding: 0;
  }
  .tabs {
    grid-area: tabs;
    flex-direction: column;
    overflow: visible;
    padding: 0;
  }
  .tab {
    border-radius: 18px;
  }
  .foot {
    grid-area: foot;
    padding: 0;
    align-content: start;
  }
  .empty {
    grid-column: 1 / -1;
    max-width: 520px;
  }
}
</style>
