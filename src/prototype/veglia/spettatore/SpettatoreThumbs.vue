<script setup lang="ts">
// Varianti D/E · Una alla volta con miniature dal vivo: le schede diventano anteprime del video, sopra o sotto quello grande.
import { computed, shallowRef } from 'vue'
import { camsFor, offMessage, room, statusLabel, viewersFor } from '../mock'
import PrototypeFeed from '../PrototypeFeed.vue'
import PrototypeInvite from '../PrototypeInvite.vue'
import PrototypeMascot from '../PrototypeMascot.vue'

const { scenario, thumbs } = defineProps<{ scenario: string, thumbs: 'sopra' | 'sotto' }>()

const cams = computed(() => camsFor(scenario))
const viewers = computed(() => viewersFor(scenario))
const pickedId = shallowRef<string | null>(null)
const picked = computed(() => cams.value.find(c => c.id === pickedId.value) ?? cams.value.find(c => c.status === 'live') ?? cams.value[0])
const others = computed(() => viewers.value.filter(v => !v.you))
const inviting = shallowRef(false)
</script>

<template>
  <div class="page" :class="thumbs">
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
      <nav class="strip" aria-label="Telecamere">
        <button
          v-for="cam in cams" :key="cam.id" type="button" class="thumb"
          :aria-current="cam.id === picked.id" :aria-label="`${cam.name}, ${statusLabel(cam)}`" @click="pickedId = cam.id"
        >
          <PrototypeFeed :cam="cam" compact class="mini" />
          <span class="thumb-label">
            <i class="dot" :class="cam.status" />
            <b>{{ cam.name }}</b>
          </span>
        </button>
      </nav>

      <section class="stage-cam" :aria-label="picked.name">
        <PrototypeFeed :cam="picked" class="video">
          <div class="overlay">
            <span class="who">
              <span class="avatar"><PrototypeMascot :species="picked.species" :state="picked.status === 'off' ? 'dorme' : 'sveglio'" crop :label="picked.name" /></span>
              <b>{{ picked.name }}</b>
            </span>
            <span class="pill" :class="{ off: picked.status === 'off', wait: picked.status === 'connecting' }">{{ statusLabel(picked) }}</span>
          </div>
        </PrototypeFeed>
        <p v-if="picked.status === 'off'" class="note soft">
          {{ offMessage(picked) }}
        </p>
      </section>

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
  gap: 14px;
  padding: 24px 0;
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
.sotto .strip {
  order: 3;
}
.sotto .stage-cam {
  order: 2;
}
.foot {
  order: 4;
}
.strip {
  display: flex;
  gap: 10px;
  overflow-x: auto;
  padding: 6px 16px;
  scrollbar-width: none;
}
.thumb {
  flex: none;
  width: 116px;
  display: grid;
  gap: 6px;
  padding: 0;
  border: 0;
  font: inherit;
  color: var(--ink);
  background: none;
  text-align: left;
  cursor: pointer;
}
.mini {
  aspect-ratio: 16 / 10;
  border-radius: 12px;
  box-shadow: inset 0 0 0 2px transparent;
}
.thumb[aria-current='true'] .mini {
  outline: 3px solid var(--ink);
  outline-offset: 2px;
}
.thumb-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  white-space: nowrap;
  overflow: hidden;
}
.dot {
  flex: none;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  box-shadow: inset 0 0 0 1.5px var(--soft);
}
.dot.live {
  background: var(--live);
  box-shadow: none;
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
  padding: 28px 14px 12px;
  font-size: 17px;
  color: #fff;
  background: linear-gradient(to top, rgb(15 20 53 / 55%), transparent);
}
.overlay .who {
  display: flex;
  align-items: center;
  gap: 8px;
}
.overlay .avatar {
  width: 30px;
  height: 30px;
}
.overlay .pill.off {
  color: #fff;
  box-shadow: inset 0 0 0 1.5px rgb(255 255 255 / 60%);
}
.note {
  padding: 0 16px;
  font-size: 14px;
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
    grid-template-columns: minmax(0, 1fr) 240px;
    grid-template-rows: auto auto 1fr;
    grid-template-areas:
      'top top'
      'cam strip'
      'cam foot';
    gap: 20px 28px;
    padding: 32px;
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
  .strip {
    grid-area: strip;
    flex-direction: column;
    overflow: visible;
    padding: 0;
  }
  .thumb {
    width: 100%;
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
