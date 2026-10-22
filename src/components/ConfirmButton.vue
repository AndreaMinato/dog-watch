<script setup lang="ts">
import { useTemplateRef } from 'vue'

const { label, question, confirmLabel } = defineProps<{ label: string, question: string, confirmLabel: string }>()
const emit = defineEmits<{ confirm: [] }>()

const dialog = useTemplateRef('dialog')

function confirm() {
  dialog.value?.close()
  emit('confirm')
}
</script>

<template>
  <button type="button" @click="dialog?.showModal()">
    {{ label }}
  </button>
  <dialog ref="dialog">
    <p>{{ question }}</p>
    <button type="button" @click="confirm">
      {{ confirmLabel }}
    </button>
    <button type="button" @click="dialog?.close()">
      Annulla
    </button>
  </dialog>
</template>
