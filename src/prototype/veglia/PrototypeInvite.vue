<script setup lang="ts">
import { generate } from 'lean-qr'
import { toSvgDataURL } from 'lean-qr/extras/svg'
import { computed } from 'vue'
import { room } from './mock'

defineEmits<{ close: [] }>()

const qr = computed(() => toSvgDataURL(generate(`https://${room.link}`), { on: '#26305C', off: '#FFFFFF', pad: 2 }))
const words = room.key.split('-')
</script>

<template>
  <div class="scrim" @click.self="$emit('close')">
    <section class="sheet" role="dialog" aria-modal="true" aria-labelledby="invite-title">
      <h2 id="invite-title" class="title">
        Invita qualcuno
      </h2>
      <p class="soft">
        Chi apre il link entra in {{ room.name }} e sceglie se guardare o fare da telecamera.
      </p>
      <div class="share">
        <img class="qr" :src="qr" alt="QR del link per entrare">
        <div class="share-actions">
          <output class="link">{{ room.link }}</output>
          <button type="button" class="btn">
            Condividi il link
          </button>
          <button type="button" class="btn ghost">
            Copia il link
          </button>
        </div>
      </div>
      <div class="key">
        <p class="lbl">
          Oppure detta la Chiave
        </p>
        <p class="words">
          <span v-for="w in words" :key="w">{{ w }}</span>
        </p>
      </div>
      <button type="button" class="close btn ghost" @click="$emit('close')">
        Chiudi
      </button>
    </section>
  </div>
</template>

<style scoped>
.scrim {
  position: absolute;
  inset: 0;
  z-index: 30;
  display: flex;
  align-items: flex-end;
  background: rgb(15 20 53 / 45%);
}
.sheet {
  width: 100%;
  max-height: 100%;
  overflow-y: auto;
  display: grid;
  gap: 16px;
  padding: 24px 20px 20px;
  border-radius: 26px 26px 0 0;
  background: var(--bg);
  color: var(--ink);
}
.sheet .title {
  font-size: 28px;
}
.share {
  display: grid;
  grid-template-columns: 132px minmax(0, 1fr);
  gap: 16px;
  align-items: center;
}
.qr {
  width: 132px;
  height: 132px;
  border-radius: 12px;
  image-rendering: pixelated;
}
.share-actions {
  display: grid;
  gap: 8px;
  min-width: 0;
}
.link {
  font-size: 13px;
  overflow-wrap: anywhere;
  color: var(--soft);
}
.share-actions .btn {
  padding: 11px 14px;
  font-size: 15px;
}
.key {
  display: grid;
  gap: 8px;
  padding: 14px;
  border-radius: 18px;
  background: var(--surface);
}
.words {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.words span {
  font-family: var(--f-display);
  font-size: 24px;
  padding: 2px 12px;
  border-radius: 10px;
  background: var(--bg);
}
@container (min-width: 700px) {
  .scrim {
    align-items: center;
    justify-content: center;
  }
  .sheet {
    max-width: 520px;
    border-radius: 26px;
  }
}
</style>
