<script setup lang="ts">
// Variante A · Elenco: una colonna di video uno sotto l'altro, griglia sugli schermi larghi.
import { computed, shallowRef } from 'vue'
import { camsFor, offMessage, room, statusLabel, viewersFor } from '../mock'
import PrototypeFeed from '../PrototypeFeed.vue'
import PrototypeInvite from '../PrototypeInvite.vue'
import PrototypeMascot from '../PrototypeMascot.vue'

const { scenario } = defineProps<{ scenario: string }>()

const cams = computed(() => camsFor(scenario))
const viewers = computed(() => viewersFor(scenario))
const live = computed(() => cams.value.filter(c => c.status === 'live').length)
const summary = computed(() => cams.value.length === 0 ? 'Nessuna telecamera' : `${cams.value.length} telecamere · ${live.value} in diretta`)
const presence = computed(() => viewers.value.length === 1 ? 'Stai guardando solo tu' : `Stanno guardando: ${viewers.value.map(v => v.you ? 'tu' : v.name).join(', ')}`)
const inviting = shallowRef(false)
</script>

<template>
  <div class="page">
    <header class="top">
      <div>
        <h1 class="title">
          {{ room.name }}
        </h1>
        <p class="soft">
          {{ summary }}
        </p>
      </div>
      <span class="avatar me"><PrototypeMascot species="cane" pose="affacciato" crop label="Tu, cane" /></span>
    </header>

    <p class="presence">
      <span class="faces">
        <span v-for="v in viewers" :key="v.name" class="avatar"><PrototypeMascot :species="v.species" pose="affacciato" crop :label="v.name" /></span>
      </span>
      <span class="soft">{{ presence }}</span>
    </p>

    <div v-if="cams.length === 0" class="empty surface">
      <div class="empty-figure">
        <PrototypeMascot species="gatto" pose="affacciato" state="cerca" label="Gatto che aspetta" />
      </div>
      <p class="title">
        Qui non c'è ancora nessuna telecamera.
      </p>
      <p class="soft">
        Hai un vecchio telefono nel cassetto? Può diventarlo: aprilo lì, entra con la Chiave e scegli "Telecamera".
      </p>
    </div>

    <ul v-else class="cams">
      <li v-for="cam in cams" :key="cam.id" class="cam">
        <PrototypeFeed :cam="cam" class="video" />
        <div class="row">
          <span class="who">
            <span class="avatar"><PrototypeMascot :species="cam.species" :state="cam.status === 'off' ? 'dorme' : 'sveglio'" crop :label="cam.name" /></span>
            <b>{{ cam.name }}</b>
          </span>
          <span class="pill" :class="{ off: cam.status === 'off', wait: cam.status === 'connecting' }">{{ statusLabel(cam) }}</span>
        </div>
        <p v-if="cam.status === 'off'" class="note soft">
          {{ offMessage(cam) }}
        </p>
      </li>
    </ul>

    <div class="actions">
      <button type="button" class="btn" @click="inviting = true">
        Invita qualcuno
      </button>
    </div>
    <PrototypeInvite v-if="inviting" @close="inviting = false" />
  </div>
</template>

<style scoped>
.page {
  display: grid;
  gap: 18px;
  padding: 28px 16px 24px;
  min-height: 100%;
  align-content: start;
}
.top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}
.top .title {
  font-size: 32px;
}
.me {
  width: 44px;
  height: 44px;
}
.presence {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
}
.faces {
  display: flex;
}
.faces .avatar {
  width: 28px;
  height: 28px;
  margin-right: -7px;
  border: 2px solid var(--bg);
}
.cams {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 22px;
}
.cam {
  display: grid;
  gap: 8px;
}
.video {
  aspect-ratio: 16 / 10;
  border-radius: 18px;
}
.row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
}
.who {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  font-size: 16px;
}
.who .avatar {
  width: 30px;
  height: 30px;
}
.note {
  font-size: 14px;
}
.empty {
  display: grid;
  gap: 10px;
  padding: 24px 20px;
  justify-items: start;
}
.empty .title {
  font-size: 22px;
}
.empty-figure {
  width: 120px;
}
.empty-figure svg {
  display: block;
  width: 100%;
}
.actions {
  position: sticky;
  bottom: 0;
  padding-top: 8px;
  background: linear-gradient(to bottom, transparent, var(--bg) 40%);
}
@container (min-width: 700px) {
  .page {
    padding: 40px 32px 32px;
  }
  .cams {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .actions {
    position: static;
    background: none;
    max-width: 320px;
  }
}
@container (min-width: 1100px) {
  .cams {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}
</style>
