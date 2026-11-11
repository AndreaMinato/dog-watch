<script setup lang="ts">
import type { MascotState, Pose, Species } from './mascot-svg'
import { computed } from 'vue'
import { mascotSvg, mascotViewBox } from './mascot-svg'

const { species, pose = 'seduto', state = 'sveglio', crop = false, label } = defineProps<{
  species: Species
  pose?: Pose
  state?: MascotState
  crop?: boolean
  label: string
}>()

const inner = computed(() => mascotSvg(species, pose, state))
const viewBox = computed(() => mascotViewBox(pose, crop))
</script>

<template>
  <!-- eslint-disable-next-line vue/no-v-html -- static drawing built in this file, no user input -->
  <svg :viewBox="viewBox" role="img" :aria-label="label" v-html="inner" />
</template>
