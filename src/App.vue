<script setup lang="ts">
import { compatibility } from './device/compatibility'
import UnsupportedBrowserView from './views/UnsupportedBrowserView.vue'
</script>

<template>
  <RouterView v-if="compatibility.app" />
  <UnsupportedBrowserView v-else />
</template>
