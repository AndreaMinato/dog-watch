<script setup lang="ts">
import { generate } from 'lean-qr'
import { toSvgDataURL } from 'lean-qr/extras/svg'
import { computed, shallowRef } from 'vue'
import { useRouter } from 'vue-router'

const { roomKey } = defineProps<{ roomKey: string }>()

const router = useRouter()
const shown = shallowRef(false)

const link = computed(() => {
  const url = new URL(router.resolve({ name: 'join' }).href, location.origin)
  url.hash = roomKey
  return url.href
})
const qr = computed(() => toSvgDataURL(generate(link.value), { on: 'black', off: 'white', pad: 4 }))
</script>

<template>
  <section class="join-link">
    <button type="button" :aria-expanded="shown" @click="shown = !shown">
      {{ shown ? 'Nascondi link e QR' : 'Mostra link e QR' }}
    </button>
    <template v-if="shown">
      <output class="link" aria-label="Link per entrare">{{ link }}</output>
      <img class="qr" :src="qr" alt="QR del link">
    </template>
  </section>
</template>

<style scoped>
.join-link {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.5rem;
}
.link {
  overflow-wrap: anywhere;
}
.qr {
  width: 16rem;
  height: 16rem;
  image-rendering: pixelated;
}
</style>
