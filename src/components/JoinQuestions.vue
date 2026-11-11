<script setup lang="ts">
import type { Species } from '../mascot/mascot'
import type { Role } from '../room/room-client'
import { computed, nextTick, shallowRef, useId, useTemplateRef, watch } from 'vue'
import { useRouter } from 'vue-router'
import { appName } from '../brand'
import { compatibility } from '../device/compatibility'
import { randomSpecies, rolePoses, SPECIES } from '../mascot/mascot'
import { installedCameraNeedsIos184, joinErrorMessage, speciesLabels } from '../room/messages'
import { createRoom, InvalidKeyError, RoomRefusedError, TooManyAttemptsError } from '../room/room-client'
import { useRoom } from '../room/use-room'
import MascotFigure from './MascotFigure.vue'

const { invitationKey, invitationRoomName, creating = false, exitLabel } = defineProps<{
  /** From an invitation link: the device skips the key question. */
  invitationKey?: string
  /** Written in the link by whoever invited: shown until the room answers with its own. */
  invitationRoomName?: string
  /** Starts at the room to create, as a future camera. */
  creating?: boolean
  /** Where the first question leads back to, instead of the app name. */
  exitLabel?: string
}>()

const emit = defineEmits<{ exit: [] }>()

type Step = 'role' | 'key' | 'create' | 'name' | 'animal'

const router = useRouter()
const { join } = useRoom()
const id = useId()

const startsCreating = creating && compatibility.camera
const role = shallowRef<Role>(startsCreating ? 'camera' : 'viewer')
const invited = shallowRef(invitationKey !== undefined)
const key = shallowRef(invitationKey ?? '')
const creatingRoom = shallowRef(startsCreating)
const roomName = shallowRef('')
const createdKey = shallowRef<string | null>(null)
const name = shallowRef('')
const mascot = shallowRef<Species>(randomSpecies())
const pending = shallowRef(false)
const error = shallowRef<string | null>(null)

const order = computed<Step[]>(() => invited.value
  ? ['role', 'name', 'animal']
  : ['role', creatingRoom.value ? 'create' : 'key', 'name', 'animal'])
const at = shallowRef(startsCreating ? 1 : 0)
const step = computed(() => order.value[at.value]!)

const placeSuggestions = ['Soggiorno', 'Cucina', 'Camera da letto', 'Studio', 'Giardino']

// The button that moved on leaves with its question: the focus goes to the new one.
const questions = useTemplateRef('questions')
watch([step, createdKey], async () => {
  await nextTick()
  const question = questions.value!
  const target = question.querySelector<HTMLElement>('input:not([type=radio])') ?? question.querySelector<HTMLElement>('h1')
  target?.focus()
})

function next() {
  error.value = null
  at.value++
}

function back() {
  error.value = null
  at.value--
}

function chooseRole(chosen: Role) {
  role.value = chosen
  creatingRoom.value = false
  next()
}

function startCreatingRoom() {
  error.value = null
  creatingRoom.value = true
}

async function create() {
  pending.value = true
  error.value = null
  try {
    createdKey.value = (await createRoom(roomName.value)).key
  }
  catch (cause) {
    console.error(cause)
    error.value = joinErrorMessage(cause)
  }
  finally {
    pending.value = false
  }
}

function questionAbout(cause: unknown): Step {
  if (cause instanceof InvalidKeyError || cause instanceof TooManyAttemptsError)
    return 'key'
  if (cause instanceof RoomRefusedError)
    return cause.refusal === 'camera_name_taken' ? 'name' : 'role'
  return 'animal'
}

async function enter() {
  pending.value = true
  error.value = null
  const roomKey = creatingRoom.value ? createdKey.value! : key.value
  try {
    await join({ key: roomKey, role: role.value, name: name.value, mascot: mascot.value })
    await router.push({ name: 'room' })
  }
  catch (cause) {
    const question = questionAbout(cause)
    if (question === 'animal')
      console.error(cause)
    if (question === 'key') {
      key.value = roomKey
      invited.value = false
      creatingRoom.value = false
    }
    at.value = order.value.indexOf(question)
    error.value = joinErrorMessage(cause)
  }
  finally {
    pending.value = false
  }
}

function answer() {
  if (step.value === 'create' && createdKey.value === null)
    return create()
  if (step.value === 'animal')
    return enter()
  next()
}

const submitLabel = computed(() => {
  if (step.value === 'animal')
    return 'Entra'
  return step.value === 'create' && createdKey.value === null ? 'Crea' : 'Avanti'
})
</script>

<template>
  <div ref="questions" class="questions">
    <header class="bar">
      <button v-if="at > 0" type="button" class="back" @click="back">
        <span aria-hidden="true">←</span> Indietro
      </button>
      <button v-else-if="exitLabel" type="button" class="back" @click="emit('exit')">
        <span aria-hidden="true">←</span> {{ exitLabel }}
      </button>
      <p v-else class="brand">
        {{ appName }}
      </p>
      <p class="count">
        {{ at + 1 }} di {{ order.length }}
      </p>
    </header>

    <p v-if="invited && step === 'role'" class="invitation surface">
      <template v-if="invitationRoomName">
        Hai un invito per <strong>{{ invitationRoomName }}</strong>.
      </template>
      <template v-else>
        Hai un invito per una Stanza.
      </template>
    </p>

    <section v-if="step === 'role'" class="question">
      <h1 tabindex="-1">
        Cosa farà questo dispositivo?
      </h1>
      <div class="choices">
        <button
          type="button"
          class="choice"
          :aria-labelledby="`${id}-viewer`"
          :aria-describedby="`${id}-viewer-detail`"
          @click="chooseRole('viewer')"
        >
          <MascotFigure class="figure" :species="mascot" pose="peeking" />
          <span :id="`${id}-viewer`" class="choice-title">Guarderà la casa</span>
          <span :id="`${id}-viewer-detail`" class="choice-detail">Da qui vedi le telecamere</span>
        </button>
        <button
          type="button"
          class="choice"
          :disabled="!compatibility.camera"
          :aria-labelledby="`${id}-camera`"
          :aria-describedby="compatibility.camera ? `${id}-camera-detail` : `${id}-camera-unsupported`"
          @click="chooseRole('camera')"
        >
          <MascotFigure class="figure" :species="mascot" pose="sitting" />
          <span :id="`${id}-camera`" class="choice-title">Farà da telecamera</span>
          <span :id="`${id}-camera-detail`" class="choice-detail">Resta acceso in una stanza</span>
        </button>
      </div>
      <p v-if="!compatibility.camera" :id="`${id}-camera-unsupported`" class="hint">
        Questo browser non può usare la fotocamera o tenere lo schermo acceso, quindi qui puoi entrare solo come Spettatore.
        Per fare da telecamera usa Safari su iPhone o iPad (iOS 16.4 o successivo) oppure Chrome su Android.
        {{ installedCameraNeedsIos184 }}
      </p>
      <p v-if="error" role="alert">
        {{ error }}
      </p>
    </section>

    <form v-else class="question" @submit.prevent="answer">
      <template v-if="step === 'key'">
        <h1>
          <label :for="`${id}-field`">Hai la Chiave della Stanza?</label>
        </h1>
        <input
          :id="`${id}-field`"
          v-model="key"
          required
          autocomplete="off"
          autocapitalize="none"
          spellcheck="false"
          :aria-describedby="`${id}-hint`"
        >
        <p :id="`${id}-hint`" class="hint">
          Sono quattro parole, per esempio «tazza ombra vento bosco». Le trovi nel messaggio di chi ti ha invitato.
        </p>
      </template>

      <template v-else-if="step === 'create' && createdKey === null">
        <h1>
          <label :for="`${id}-field`">Come si chiama la Stanza?</label>
        </h1>
        <input :id="`${id}-field`" v-model.trim="roomName" required maxlength="40" :aria-describedby="`${id}-hint`">
        <p :id="`${id}-hint`" class="hint">
          Per esempio Casa al mare.
        </p>
      </template>

      <template v-else-if="step === 'create'">
        <h1 tabindex="-1">
          Ecco la Chiave della Stanza
        </h1>
        <ol class="words" aria-label="Chiave della Stanza">
          <li v-for="(word, index) in createdKey!.split('-')" :key="index">
            {{ word }}
          </li>
        </ol>
        <p class="hint">
          È l'unico modo per entrare in {{ roomName }}: tienila da parte. La ritrovi dentro la Stanza, con il link e il QR.
        </p>
      </template>

      <template v-else-if="step === 'name'">
        <h1>
          <label :for="`${id}-field`">{{ role === 'camera' ? 'Che stanza riprende?' : 'Come ti chiami?' }}</label>
        </h1>
        <input
          :id="`${id}-field`"
          v-model.trim="name"
          required
          maxlength="40"
          :aria-describedby="role === 'viewer' ? `${id}-hint` : undefined"
        >
        <div v-if="role === 'camera'" class="suggestions">
          <button v-for="suggestion in placeSuggestions" :key="suggestion" type="button" @click="name = suggestion">
            {{ suggestion }}
          </button>
        </div>
        <p v-else :id="`${id}-hint`" class="hint">
          Lo vedono le telecamere e gli altri che guardano.
        </p>
      </template>

      <fieldset v-else class="animals">
        <legend>
          <h1 tabindex="-1">
            Scegli il tuo animale
          </h1>
        </legend>
        <p class="hint">
          Gli altri riconoscono questo dispositivo da lui.
        </p>
        <div class="animal-choices">
          <label v-for="species in SPECIES" :key="species" class="animal">
            <MascotFigure class="figure" :species="species" :pose="rolePoses[role]" />
            <input v-model="mascot" type="radio" :value="species" :aria-labelledby="`${id}-${species}`">
            <span :id="`${id}-${species}`">{{ speciesLabels[species] }}</span>
          </label>
        </div>
      </fieldset>

      <p v-if="error" role="alert">
        {{ error }}
      </p>
      <button type="submit" :disabled="pending">
        {{ submitLabel }}
      </button>
      <button v-if="step === 'key' && role === 'camera'" type="button" @click="startCreatingRoom">
        Non ce l'ho: crea una Stanza nuova
      </button>
    </form>
  </div>
</template>

<style scoped>
.questions {
  display: grid;
  gap: 1.25rem;
}
.bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  min-height: var(--touch);
}
.bar p {
  margin: 0;
}
.brand {
  font-family: var(--font-display);
  font-size: 1.375rem;
}
.back {
  gap: 0.375rem;
  padding-inline: 0.5rem;
  border: none;
}
.count {
  margin-inline-start: auto;
  color: var(--text-muted);
}
.invitation {
  margin: 0;
  padding: 0.75rem 0.875rem;
}
.question {
  display: grid;
  gap: 1rem;
}
.question h1 {
  margin: 0;
  font-size: 2rem;
}
.hint {
  margin: 0;
  color: var(--text-muted);
}
.choices {
  display: grid;
  gap: 0.75rem;
}
.choice {
  display: grid;
  grid-template-columns: 6rem minmax(0, 1fr);
  grid-template-rows: auto auto;
  column-gap: 1rem;
  justify-content: stretch;
  align-items: center;
  padding: 0.875rem;
  border: none;
  border-radius: 1.375rem;
  background: var(--surface);
  font-size: 1.2rem;
  text-align: start;
}
.choice .figure {
  grid-row: span 2;
  width: 6rem;
  height: 6rem;
}
.choice-title {
  align-self: end;
}
.choice-detail {
  align-self: start;
  font-size: 0.875rem;
  font-weight: 400;
  color: var(--text-muted);
}
.words {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin: 0;
  padding: 0;
  list-style: none;
}
.words li {
  padding: 0.25rem 0.875rem;
  border-radius: 0.75rem;
  background: var(--surface);
  font-family: var(--font-display);
  font-size: 1.75rem;
}
.suggestions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}
.suggestions button {
  border: none;
  background: var(--surface);
  font-weight: 400;
}
.animals {
  display: grid;
  gap: 1rem;
  margin: 0;
  padding: 0;
  border: none;
}
.animals legend {
  margin-bottom: 1rem;
  padding: 0;
}
.animal-choices {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.625rem;
}
.animal {
  display: grid;
  grid-template-columns: auto auto;
  place-content: center;
  align-items: center;
  gap: 0.25rem 0.5rem;
  padding: 0.625rem 0.375rem 0.75rem;
  border-radius: 1.125rem;
  background: var(--surface);
  cursor: pointer;
}
.animal:has(input:checked) {
  box-shadow: inset 0 0 0 2px var(--text);
}
.animal .figure {
  grid-column: 1 / -1;
  justify-self: center;
  width: 4.5rem;
}
@media (min-width: 700px) {
  .question h1 {
    font-size: 2.75rem;
  }
  .choices {
    grid-template-columns: 1fr 1fr;
  }
  .choice {
    grid-template-columns: 1fr;
    justify-items: center;
    text-align: center;
  }
  .choice .figure {
    grid-row: auto;
    width: 8.75rem;
    height: 8.75rem;
  }
}
</style>
