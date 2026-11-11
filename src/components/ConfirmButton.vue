<script setup lang="ts">
import { useId, useTemplateRef } from 'vue'

const { label, question, confirmLabel } = defineProps<{ label: string, question: string, confirmLabel: string }>()
const emit = defineEmits<{ confirm: [] }>()

const dialog = useTemplateRef('dialog')
const questionId = useId()

function confirm() {
  dialog.value?.close()
  emit('confirm')
}
</script>

<template>
  <button type="button" @click="dialog?.showModal()">
    {{ label }}
  </button>
  <dialog ref="dialog" :aria-labelledby="questionId">
    <p :id="questionId">
      {{ question }}
    </p>
    <div class="controls">
      <button type="button" @click="confirm">
        {{ confirmLabel }}
      </button>
      <button type="button" @click="dialog?.close()">
        Annulla
      </button>
    </div>
  </dialog>
</template>
