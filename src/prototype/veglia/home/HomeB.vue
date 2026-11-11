<script setup lang="ts">
// Variante B · Le tue Stanze: chi torna vede subito le sue Stanze con lo stato dal vivo; chi arriva la prima volta vede come funziona.
import { computed, shallowRef } from 'vue'
import { recentRoomsFor, room } from '../mock'
import PrototypeCreate from '../PrototypeCreate.vue'
import PrototypeEntry from '../PrototypeEntry.vue'
import PrototypeMascot from '../PrototypeMascot.vue'

const { scenario } = defineProps<{ scenario: string }>()

const recent = computed(() => recentRoomsFor(scenario))
const mode = shallowRef<'home' | 'create' | 'join'>('home')
</script>

<template>
  <div class="page">
    <header class="bar">
      <b class="title">Veglia</b>
      <button v-if="mode !== 'home'" type="button" class="back" @click="mode = 'home'">
        ← Indietro
      </button>
    </header>

    <section v-if="mode === 'create'" class="panel">
      <h1 class="title">
        Crea una Stanza
      </h1>
      <PrototypeCreate />
    </section>

    <section v-else-if="mode === 'join'" class="panel">
      <h1 class="title">
        Entra con una Chiave
      </h1>
      <PrototypeEntry />
    </section>

    <section v-else-if="scenario === 'link'" class="panel">
      <div class="invite surface">
        <span class="avatar"><PrototypeMascot species="gatto" crop label="Soggiorno" /></span>
        <span><b>{{ room.name }}</b><br><small class="soft">2 telecamere in diretta</small></span>
      </div>
      <h1 class="title">
        Ti hanno invitato
      </h1>
      <PrototypeEntry known-key />
    </section>

    <template v-else-if="recent.length">
      <h1 class="title big">
        Le tue Stanze
      </h1>
      <ul class="rooms">
        <li v-for="r in recent" :key="r.name" class="roomcard surface">
          <div class="rc-top">
            <span class="avatar"><PrototypeMascot :species="r.species" :pose="r.role === 'camera' ? 'seduto' : 'affacciato'" crop :label="r.memberName" /></span>
            <div>
              <b class="title">{{ r.name }}</b>
              <p class="soft">
                {{ r.role === 'camera' ? `Questo telefono è la telecamera ${r.memberName}` : `Entri come ${r.memberName}` }}
              </p>
            </div>
          </div>
          <p class="status">
            <span class="pill" :class="{ off: r.live === 0 }">{{ r.live === 0 ? 'Nessuna in diretta' : `${r.live} su ${r.total} in diretta` }}</span>
          </p>
          <button type="button" class="btn">
            {{ r.role === 'camera' ? 'Riprendi a trasmettere' : 'Guarda' }}
          </button>
        </li>
      </ul>
      <div class="secondary">
        <button type="button" class="btn ghost" @click="mode = 'join'">
          Entra con una Chiave
        </button>
        <button type="button" class="btn ghost" @click="mode = 'create'">
          Crea una Stanza
        </button>
      </div>
    </template>

    <template v-else>
      <div class="welcome">
        <div class="trio">
          <PrototypeMascot species="cane" label="Cane seduto" />
          <PrototypeMascot species="gatto" pose="affacciato" label="Gatto affacciato" />
          <PrototypeMascot species="coniglio" label="Coniglio seduto" />
        </div>
        <h1 class="title big">
          Guarda casa tua da lontano.
        </h1>
        <ol class="steps">
          <li><b>Crea una Stanza</b> su un telefono che resta a casa: diventa la telecamera.</li>
          <li><b>Ricevi la Chiave</b>: quattro parole, da tenere da parte.</li>
          <li><b>Entra con la Chiave</b> da qualsiasi altro telefono o computer, e guarda.</li>
        </ol>
      </div>
      <div class="secondary">
        <button type="button" class="btn" @click="mode = 'create'">
          Crea una Stanza
        </button>
        <button type="button" class="btn ghost" @click="mode = 'join'">
          Ho una Chiave
        </button>
      </div>
    </template>

    <a class="how soft" href="#come-funziona">Come funziona e cosa salviamo</a>
  </div>
</template>

<style scoped>
.page {
  display: grid;
  gap: 20px;
  padding: 20px 16px 28px;
  align-content: start;
  max-width: 1040px;
  margin: 0 auto;
}
.bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.bar .title {
  font-size: 22px;
  font-weight: 400;
}
.back {
  border: 0;
  background: none;
  font: inherit;
  font-weight: 700;
  color: var(--ink);
  cursor: pointer;
}
.big {
  font-size: 38px;
}
.panel {
  display: grid;
  gap: 16px;
  max-width: 560px;
}
.panel > .title {
  font-size: 30px;
}
.invite {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
}
.invite .avatar,
.rc-top .avatar {
  width: 48px;
  height: 48px;
}
.rooms {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 14px;
}
.roomcard {
  display: grid;
  gap: 12px;
  padding: 16px;
}
.rc-top {
  display: flex;
  gap: 12px;
  align-items: center;
}
.rc-top .title {
  font-size: 24px;
  font-weight: 400;
}
.rc-top .soft {
  font-size: 14px;
}
.secondary {
  display: grid;
  gap: 10px;
}
.welcome {
  display: grid;
  gap: 18px;
}
.trio {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  max-width: 320px;
}
.trio svg {
  display: block;
  width: 100%;
}
.steps {
  margin: 0;
  padding-left: 22px;
  display: grid;
  gap: 10px;
  font-size: 16px;
}
.steps li::marker {
  font-family: var(--f-display);
}
.how {
  font-size: 14px;
}
@container (min-width: 700px) {
  .page {
    padding: 28px 32px 40px;
  }
  .big {
    font-size: 52px;
  }
  .rooms {
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  }
  .secondary {
    grid-template-columns: repeat(2, max-content);
  }
  .welcome {
    grid-template-columns: 1fr 1fr;
    align-items: center;
    column-gap: 40px;
  }
  .trio {
    grid-row: span 2;
    max-width: none;
  }
}
</style>
