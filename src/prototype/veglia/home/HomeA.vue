<script setup lang="ts">
// Variante A · Due porte: due scelte grandi per intenzione (guardare / fare da telecamera), le Stanze recenti sotto.
import { computed, shallowRef } from 'vue'
import { recentRoomsFor, room } from '../mock'
import PrototypeCreate from '../PrototypeCreate.vue'
import PrototypeEntry from '../PrototypeEntry.vue'
import PrototypeMascot from '../PrototypeMascot.vue'

const { scenario } = defineProps<{ scenario: string }>()

const recent = computed(() => recentRoomsFor(scenario))
const door = shallowRef<'watch' | 'camera' | null>(null)
const cameraPath = shallowRef<'create' | 'join' | null>(null)
</script>

<template>
  <div class="page">
    <header class="brand">
      <p class="title wordmark">
        Veglia
      </p>
      <p class="soft">
        Guarda casa tua da lontano, con un telefono che hai già.
      </p>
    </header>

    <section v-if="scenario === 'link'" class="panel">
      <h1 class="title">
        Ti hanno invitato in {{ room.name }}
      </h1>
      <PrototypeEntry known-key />
    </section>

    <template v-else>
      <div class="doors">
        <button type="button" class="door" :class="{ on: door === 'watch' }" :aria-expanded="door === 'watch'" @click="door = door === 'watch' ? null : 'watch'">
          <span class="fig"><PrototypeMascot species="gatto" pose="affacciato" label="Gatto affacciato" /></span>
          <b class="title">Guarda casa</b>
          <span class="soft">Entra in una Stanza con la Chiave che ti hanno dato.</span>
        </button>
        <button type="button" class="door" :class="{ on: door === 'camera' }" :aria-expanded="door === 'camera'" @click="door = door === 'camera' ? null : 'camera'">
          <span class="fig"><PrototypeMascot species="cane" label="Cane seduto" /></span>
          <b class="title">Usa questo telefono come telecamera</b>
          <span class="soft">Crea una Stanza nuova, o entra in una che esiste già.</span>
        </button>
      </div>

      <section v-if="door === 'watch'" class="panel">
        <PrototypeEntry initial-role="viewer" />
      </section>
      <section v-if="door === 'camera'" class="panel">
        <div v-if="!cameraPath" class="split">
          <button type="button" class="btn" @click="cameraPath = 'create'">
            Crea una Stanza nuova
          </button>
          <button type="button" class="btn ghost" @click="cameraPath = 'join'">
            Ho già una Chiave
          </button>
        </div>
        <PrototypeCreate v-else-if="cameraPath === 'create'" />
        <PrototypeEntry v-else initial-role="camera" />
      </section>
    </template>

    <section v-if="recent.length" class="recent">
      <h2 class="lbl">
        Stanze recenti
      </h2>
      <ul>
        <li v-for="r in recent" :key="r.name" class="surface">
          <span class="avatar"><PrototypeMascot :species="r.species" :pose="r.role === 'camera' ? 'seduto' : 'affacciato'" crop :label="r.memberName" /></span>
          <span class="rtext">
            <b>{{ r.name }}</b>
            <small class="soft">{{ r.role === 'camera' ? `Telecamera ${r.memberName}` : `Spettatore · ${r.memberName}` }}</small>
          </span>
          <button type="button" class="btn ghost small">
            Entra
          </button>
        </li>
      </ul>
    </section>

    <a class="how soft" href="#come-funziona">Come funziona e cosa salviamo</a>
  </div>
</template>

<style scoped>
.page {
  display: grid;
  gap: 22px;
  padding: 36px 16px 28px;
  align-content: start;
  max-width: 980px;
  margin: 0 auto;
}
.wordmark {
  font-size: 44px;
}
.brand .soft {
  margin-top: 6px;
  font-size: 17px;
}
.doors {
  display: grid;
  gap: 12px;
}
.door {
  display: grid;
  grid-template-columns: 76px minmax(0, 1fr);
  grid-template-rows: auto auto;
  column-gap: 14px;
  align-items: center;
  padding: 14px;
  border: 0;
  border-radius: 22px;
  font: inherit;
  color: var(--ink);
  background: var(--surface);
  text-align: left;
  cursor: pointer;
  box-shadow: inset 0 0 0 2px transparent;
}
.door.on {
  box-shadow: inset 0 0 0 2px var(--ink);
}
.fig {
  grid-row: span 2;
  width: 76px;
  height: 76px;
  border-radius: 16px;
  overflow: hidden;
  background: var(--bg);
}
.fig svg {
  display: block;
  width: 100%;
  height: 100%;
}
.door .title {
  font-size: 22px;
  align-self: end;
}
.door .soft {
  font-size: 14px;
  align-self: start;
}
.panel {
  display: grid;
  gap: 16px;
}
.panel > .title {
  font-size: 30px;
}
.split {
  display: grid;
  gap: 10px;
}
.recent {
  display: grid;
  gap: 10px;
}
.recent ul {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 8px;
}
.recent li {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
}
.recent .avatar {
  width: 40px;
  height: 40px;
}
.rtext {
  display: grid;
  line-height: 1.25;
  min-width: 0;
}
.rtext small {
  font-size: 13px;
}
.recent .small {
  width: auto;
  margin-left: auto;
  padding: 8px 16px;
  font-size: 14px;
}
.how {
  font-size: 14px;
}
@container (min-width: 700px) {
  .page {
    padding: 56px 32px;
  }
  .wordmark {
    font-size: 64px;
  }
  .doors {
    grid-template-columns: 1fr 1fr;
  }
  .door {
    grid-template-columns: 1fr;
    gap: 10px;
    padding: 20px;
  }
  .fig {
    grid-row: auto;
    width: 120px;
    height: 120px;
  }
  .panel,
  .recent {
    max-width: 560px;
  }
}
</style>
