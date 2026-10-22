<script setup lang="ts">
import type { RoomClient } from '../room/room-client'
import type { CameraFeed } from '../room/viewer-session'
import { computed, onBeforeUnmount, shallowRef } from 'vue'
import { useRoom } from '../room/use-room'
import { startViewerSession } from '../room/viewer-session'
import CameraFeedView from './CameraFeedView.vue'

const { room } = defineProps<{ room: RoomClient }>()

const { members } = useRoom()
const noCameraPresent = computed(() => !members.value.some(member => member.role === 'camera'))

const feeds = shallowRef<CameraFeed[]>([])
const session = startViewerSession(room)
session.onFeedsChange((current) => {
  feeds.value = current
})

const enlargedId = shallowRef<string | null>(null)
const enlarged = computed(() => feeds.value.find(feed => feed.camera.id === enlargedId.value))

onBeforeUnmount(() => session.close())
</script>

<template>
  <section aria-label="Camere">
    <p v-if="noCameraPresent">
      Nessuna Camera nella Stanza
    </p>
    <button v-if="enlarged" type="button" @click="enlargedId = null">
      Torna alla griglia
    </button>
    <div class="grid" :class="{ enlarged }">
      <CameraFeedView
        v-for="feed in feeds"
        v-show="!enlarged || feed === enlarged"
        :key="feed.camera.id"
        :feed="feed"
        @enlarge="enlargedId = feed.camera.id"
      />
    </div>
  </section>
</template>

<style scoped>
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(16rem, 1fr));
  gap: 0.5rem;
}
.grid.enlarged {
  grid-template-columns: 1fr;
}
</style>
