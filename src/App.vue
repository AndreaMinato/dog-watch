<script setup lang="ts">
import { shallowRef } from 'vue'
import { compatibility } from './device/compatibility'
import { ensureAnonymousSession } from './room/supabase'
import OfflineView from './views/OfflineView.vue'
import UnsupportedBrowserView from './views/UnsupportedBrowserView.vue'

// Not waited for: with a slow network the app opens at once, and only a failure replaces it.
const unreachable = shallowRef(false)
ensureAnonymousSession().catch((cause: unknown) => {
  console.error(cause)
  unreachable.value = true
})
</script>

<template>
  <OfflineView v-if="unreachable" @reached="unreachable = false" />
  <RouterView v-else-if="compatibility.app" />
  <UnsupportedBrowserView v-else />
</template>
