<script setup lang="ts">
import { onBeforeUnmount } from 'vue'
import { serviceUnreachable } from '../room/messages'
import { ensureAnonymousSession, nextRetryDelay } from '../room/supabase'

const emit = defineEmits<{ reached: [] }>()

// A camera left alone must come back without a tap: once the browser is online again, and meanwhile with backoff.
let delay = nextRetryDelay()
let retry = setTimeout(reach, delay)

async function reach() {
  clearTimeout(retry)
  try {
    await ensureAnonymousSession()
  }
  catch (cause) {
    console.error(cause)
    delay = nextRetryDelay(delay)
    retry = setTimeout(reach, delay)
    return
  }
  emit('reached')
}

addEventListener('online', reach)
onBeforeUnmount(() => {
  clearTimeout(retry)
  removeEventListener('online', reach)
})
</script>

<template>
  <main>
    <h1>Impossibile collegarsi</h1>
    <p>{{ serviceUnreachable }}</p>
    <button type="button" class="button primary" @click="reach">
      Riprova
    </button>
  </main>
</template>
