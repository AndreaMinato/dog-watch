<script setup lang="ts">
import { useTemplateRef } from 'vue'

const dialog = useTemplateRef('dialog')

function closeOnTapOutside(event: MouseEvent) {
  if (event.target === dialog.value)
    dialog.value?.close()
}

defineExpose({
  open: () => dialog.value?.showModal(),
  close: () => dialog.value?.close(),
})
</script>

<template>
  <dialog ref="dialog" class="bottom-sheet" @click="closeOnTapOutside">
    <!-- Taps on the dialog itself land outside the content: the dialog has no padding of its own. -->
    <div class="content">
      <slot />
    </div>
  </dialog>
</template>

<style scoped>
.bottom-sheet {
  width: 100%;
  max-width: 100%;
  margin-bottom: 0;
  padding: 0;
  border-radius: 1.5rem 1.5rem 0 0;
}
.bottom-sheet::backdrop {
  background: var(--scrim);
}
@media (min-width: 700px) {
  .bottom-sheet {
    width: min(32.5rem, 100% - 2rem);
    margin-bottom: auto;
    border-radius: 1.5rem;
  }
}
.content {
  display: grid;
  gap: 1rem;
  padding: 1.5rem 1.25rem calc(1.25rem + env(safe-area-inset-bottom));
}
.content > :slotted(*) {
  margin: 0;
}
</style>
