<script setup lang="ts">
import type { PrototypeParams } from './PrototypeSwitcher.vue'
import { computed, ref, watch } from 'vue'
import PrototypeSwitcher from './PrototypeSwitcher.vue'
import { screens } from './screens'

function readParams(): PrototypeParams {
  const q = new URLSearchParams(location.search)
  const screen = screens.find(s => s.key === q.get('schermata')) ?? screens[0]!
  return {
    schermata: screen.key,
    variante: q.get('variante') ?? 'A',
    scenario: q.get('scenario') ?? screen.scenarios[0]!.key,
    tema: q.get('tema') === 'notte' ? 'notte' : 'giorno',
    larghezza: (['telefono', 'tablet', 'computer'] as const).find(w => w === q.get('larghezza')) ?? 'telefono',
  }
}

const params = ref<PrototypeParams>(readParams())
watch(params, (p) => {
  history.replaceState(null, '', `?${new URLSearchParams({ ...p }).toString()}`)
}, { immediate: true })

const screen = computed(() => screens.find(s => s.key === params.value.schermata) ?? screens[0]!)
const variant = computed(() => screen.value.variants.find(v => v.key === params.value.variante) ?? screen.value.variants[0]!)
const renderKey = computed(() => `${screen.value.key}-${variant.value.key}-${params.value.scenario}`)
</script>

<template>
  <div class="stage" :class="params.larghezza">
    <div class="frame veglia" :data-tema="params.tema">
      <div class="scroller">
        <component :is="variant.component" v-bind="variant.props" :key="renderKey" :scenario="params.scenario" />
      </div>
    </div>
    <PrototypeSwitcher v-model="params" :screens="screens" :screen="screen" />
  </div>
</template>

<style>
body {
  margin: 0;
  background: #d9dbd6;
}
</style>

<style scoped>
.stage {
  min-height: 100dvh;
  display: grid;
  justify-items: center;
  align-content: start;
  padding: 20px 12px 110px;
}
.frame {
  position: relative;
  width: 100%;
  overflow: hidden;
  container-type: inline-size;
  box-shadow:
    0 0 0 1px rgb(0 0 0 / 12%),
    0 20px 50px rgb(0 0 0 / 18%);
}
.scroller {
  height: 100%;
  overflow-y: auto;
}
.telefono .frame {
  max-width: 390px;
  height: min(844px, calc(100dvh - 130px));
  border-radius: 36px;
}
.tablet .frame {
  max-width: 820px;
  height: min(1180px, calc(100dvh - 130px));
  border-radius: 24px;
}
.computer .frame {
  max-width: 1280px;
  height: calc(100dvh - 130px);
  border-radius: 12px;
}
</style>
