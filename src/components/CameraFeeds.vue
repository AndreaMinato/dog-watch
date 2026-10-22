<script setup lang="ts">
import type { RoomClient } from '../room/room-client'
import type { CameraFeed } from '../room/viewer-session'
import { onBeforeUnmount, shallowRef } from 'vue'
import { startViewerSession } from '../room/viewer-session'
import CameraFeedView from './CameraFeedView.vue'

const { room } = defineProps<{ room: RoomClient }>()

const feeds = shallowRef<CameraFeed[]>([])
const session = startViewerSession(room)
session.onFeedsChange((current) => {
  feeds.value = current
})

onBeforeUnmount(() => session.close())
</script>

<template>
  <section aria-label="Camere">
    <CameraFeedView v-for="feed in feeds" :key="feed.camera.id" :feed="feed" />
  </section>
</template>
