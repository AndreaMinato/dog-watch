<script setup lang="ts">
import type { RoomClient } from '../room/room-client'
import type { CameraFeed } from '../room/viewer-session'
import { computed, onBeforeUnmount, shallowRef, useTemplateRef } from 'vue'
import { rolePoses } from '../mascot/mascot'
import { useRoom } from '../room/use-room'
import { startViewerSession } from '../room/viewer-session'
import CameraStage from './CameraStage.vue'
import CameraThumbnail from './CameraThumbnail.vue'
import InviteSheet from './InviteSheet.vue'
import MascotFigure from './MascotFigure.vue'
import NewViewerNotice from './NewViewerNotice.vue'

const { room } = defineProps<{ room: RoomClient }>()
defineEmits<{ exit: [] }>()

const { viewers } = useRoom()
const names = new Intl.ListFormat('it', { type: 'conjunction' })
const company = computed(() => {
  const others = viewers.value.filter(viewer => viewer.id !== room.self.id)
  return others.length > 0 ? `Con te: ${names.format(others.map(viewer => viewer.name))}` : 'Stai guardando solo tu'
})

const invite = useTemplateRef('invite')
const feeds = shallowRef<CameraFeed[]>([])
const pickedId = shallowRef<string | null>(null)
const picked = computed(() => feeds.value.find(feed => feed.camera.id === pickedId.value))

function isLive(feed: CameraFeed): boolean {
  return feed.camera.status === 'live' && !feed.offlineSince
}

// The first live camera goes on screen only when none is there: one that pauses or drops out stays, showing its state.
const session = startViewerSession(room)
session.onFeedsChange((current) => {
  feeds.value = current
  if (!current.some(feed => feed.camera.id === pickedId.value))
    pickedId.value = (current.find(isLive) ?? current[0])?.camera.id ?? null
})
onBeforeUnmount(() => session.close())
</script>

<template>
  <main class="viewer">
    <h1 class="top">
      {{ room.roomName }}
    </h1>
    <CameraStage v-if="picked" class="stage" :feed="picked" />
    <section v-else class="stage empty" aria-labelledby="no-camera">
      <MascotFigure class="figure" :species="room.self.mascot" :pose="rolePoses.viewer" />
      <h2 id="no-camera">
        Qui non c'è ancora nessuna telecamera
      </h2>
      <p>
        Per aggiungerne una, apri l'app su un altro telefono, entra con la Chiave di questa Stanza e scegli di usarlo come telecamera.
        La Chiave è in "Invita qualcuno".
      </p>
    </section>
    <ul v-if="feeds.length > 0" class="thumbnails" aria-label="Telecamere">
      <li v-for="feed in feeds" :key="feed.camera.id">
        <CameraThumbnail :feed="feed" :picked="feed === picked" @click="pickedId = feed.camera.id" />
      </li>
    </ul>
    <div class="foot">
      <p class="company">
        {{ company }}
      </p>
      <div class="controls">
        <button type="button" @click="invite?.open()">
          Invita qualcuno
        </button>
        <button type="button" @click="$emit('exit')">
          Esci
        </button>
      </div>
    </div>
    <NewViewerNotice :room="room" />
    <InviteSheet ref="invite" :room-name="room.roomName" :room-key="room.key" />
  </main>
</template>

<style scoped>
.viewer {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  align-content: start;
  align-items: start;
  gap: 1rem;
  max-width: 72rem;
}
.top {
  margin: 0;
}
.empty {
  padding: 1.5rem;
  border-radius: 1.25rem;
  background: var(--surface);
}
.empty .figure {
  width: 8rem;
}
.empty h2 {
  margin-block: 0.5rem;
}
.empty p {
  margin: 0;
}
.thumbnails {
  display: flex;
  gap: 0.625rem;
  margin: 0;
  padding: 0.375rem;
  overflow-x: auto;
  list-style: none;
}
.thumbnails li {
  flex: none;
  width: 7.5rem;
}
.company {
  margin: 0 0 0.75rem;
  color: var(--text-muted);
}
.controls {
  margin: 0;
}
@media (min-width: 700px) {
  .viewer {
    grid-template-columns: minmax(0, 1fr) 15rem;
    grid-template-areas:
      'top top'
      'stage thumbnails'
      'stage foot';
    grid-template-rows: auto auto 1fr;
    gap: 1rem 1.5rem;
  }
  .top {
    grid-area: top;
  }
  .stage {
    grid-area: stage;
  }
  .thumbnails {
    grid-area: thumbnails;
    flex-direction: column;
    overflow-x: visible;
  }
  .thumbnails li {
    width: auto;
  }
  .foot {
    grid-area: foot;
  }
}
</style>
