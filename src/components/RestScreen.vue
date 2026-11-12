<script setup lang="ts">
import type { ShownStatus } from '../room/messages'
import { onBeforeUnmount } from 'vue'
import { screenMayTurnOff, statusLabels } from '../room/messages'
import ViewerList from './ViewerList.vue'

defineProps<{ status: ShownStatus, screenKeptOn: boolean }>()
const emit = defineEmits<{ wake: [] }>()

// The installed app paints the status bar with theme-color, which would stay light over the black screen.
const rest = getComputedStyle(document.documentElement).getPropertyValue('--rest')
const themeColors = [...document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]')]
  .map(meta => ({ meta, content: meta.content }))
themeColors.forEach(({ meta }) => {
  meta.content = rest
})
onBeforeUnmount(() => themeColors.forEach(({ meta, content }) => {
  meta.content = content
}))
</script>

<template>
  <section class="rest" aria-label="Schermata a riposo" @click="emit('wake')">
    <p v-if="!screenKeptOn" role="alert" class="warning">
      {{ screenMayTurnOff }}
    </p>
    <p class="status">
      {{ statusLabels[status] }}
    </p>
    <ViewerList />
    <button type="button" class="wake">
      Tocca per riaccendere lo schermo
    </button>
  </section>
</template>

<style scoped>
.rest {
  position: fixed;
  inset: 0;
  display: flex;
  flex-direction: column;
  justify-content: safe center;
  align-items: center;
  overflow: auto;
  padding: 1rem;
  background: var(--rest);
  color: var(--on-rest);
  font-size: 0.875rem;
  text-align: center;
}

.rest :focus-visible {
  outline-color: var(--on-rest);
}

.warning,
.status {
  font-weight: 700;
}

.wake {
  border: none;
  color: inherit;
  font-weight: 400;
}
</style>
