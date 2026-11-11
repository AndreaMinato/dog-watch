<script setup lang="ts">
import type { RememberedRoom } from '../room/remembered-rooms'
import { computed, nextTick, onBeforeUnmount, shallowRef, useId, useTemplateRef, watch } from 'vue'
import { useRouter } from 'vue-router'
import { appName } from '../brand'
import JoinQuestions from '../components/JoinQuestions.vue'
import MascotFigure from '../components/MascotFigure.vue'
import { rolePoses } from '../mascot/mascot'
import { joinErrorMessage, roleLabels } from '../room/messages'
import { cameraRoomToReenter, forgetRoom, rememberedRooms, rememberLeftRoom } from '../room/remembered-rooms'
import { InvalidKeyError, RoomRefusedError } from '../room/room-client'
import { useRoom } from '../room/use-room'

const router = useRouter()
const { join } = useRoom()
const id = useId()

const rooms = shallowRef(rememberedRooms())
const askingQuestions = shallowRef(false)
const showsQuestions = computed(() => askingQuestions.value || rooms.value.length === 0)
const pending = shallowRef(false)
const failure = shallowRef<{ roomId: string, message: string } | null>(null)
const askingKeyFor = shallowRef<string | null>(null)
const newKey = shallowRef('')

// The button that switched view leaves with it: the focus goes to the new heading.
const home = useTemplateRef('home')
watch(showsQuestions, async () => {
  await nextTick()
  home.value!.querySelector('h1')!.focus()
})

/** "Telecamera soggiorno", "Spettatore · Andrea". */
function howEntered(room: RememberedRoom): string {
  return room.role === 'camera' ? `${roleLabels.camera} ${room.memberName}` : `${roleLabels.viewer} · ${room.memberName}`
}

const DAY_MS = 24 * 60 * 60 * 1000
const relativeDays = new Intl.RelativeTimeFormat('it', { numeric: 'auto' })

/** "oggi", "ieri", "3 giorni fa", counted in calendar days. */
function daysSince(isoDate: string): string {
  const calendarDay = (date: Date) => Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
  return relativeDays.format((calendarDay(new Date(isoDate)) - calendarDay(new Date())) / DAY_MS, 'day')
}

function forget(room: RememberedRoom) {
  forgetRoom(room.roomId)
  rooms.value = rememberedRooms()
}

const FIRST_RETRY_DELAY_MS = 1_000
const MAX_RETRY_DELAY_MS = 30_000
let retry: ReturnType<typeof setTimeout> | undefined

/** With a retry delay, failures other than a definitive answer are retried with backoff. */
async function enter(room: RememberedRoom, key = room.key, retryDelay?: number) {
  clearTimeout(retry)
  pending.value = true
  failure.value = null
  try {
    await join({ key, role: room.role, name: room.memberName, mascot: room.mascot })
    await router.push({ name: 'room' })
  }
  catch (cause) {
    const definitive = cause instanceof InvalidKeyError || cause instanceof RoomRefusedError
    if (retryDelay !== undefined && !definitive) {
      console.error(cause)
      retry = setTimeout(() => enter(room, key, Math.min(retryDelay * 2, MAX_RETRY_DELAY_MS)), retryDelay)
      return
    }
    if (retryDelay !== undefined)
      rememberLeftRoom()
    const keyRejected = cause instanceof InvalidKeyError
    if (keyRejected)
      askingKeyFor.value = room.roomId
    const message = keyRejected && key === room.key
      ? 'La Chiave ricordata non funziona più: probabilmente è stata rigenerata. Inserisci la Chiave nuova.'
      : joinErrorMessage(cause)
    failure.value = { roomId: room.roomId, message }
  }
  finally {
    pending.value = false
  }
}

// Started here, not with the rooms, so it goes on while the home shows the questions.
const cameraRoom = cameraRoomToReenter()
if (cameraRoom)
  enter(cameraRoom, cameraRoom.key, FIRST_RETRY_DELAY_MS)
onBeforeUnmount(() => clearTimeout(retry))
</script>

<template>
  <main ref="home">
    <JoinQuestions
      v-if="showsQuestions"
      :exit-label="rooms.length > 0 ? 'Le tue Stanze' : undefined"
      @exit="askingQuestions = false"
    />
    <div v-else class="rooms">
      <p class="brand">
        {{ appName }}
      </p>
      <h1 :id="`${id}-heading`" tabindex="-1">
        Le tue Stanze
      </h1>
      <ul :aria-labelledby="`${id}-heading`" class="cards">
        <li v-for="room in rooms" :key="room.roomId" class="card surface">
          <button
            type="button"
            class="enter"
            :disabled="pending"
            :aria-labelledby="`${id}-${room.roomId}`"
            :aria-describedby="`${id}-${room.roomId}-detail`"
            @click="enter(room)"
          >
            <MascotFigure class="avatar" :species="room.mascot" :pose="rolePoses[room.role]" crop />
            <span class="text">
              <span :id="`${id}-${room.roomId}`" class="name">{{ room.roomName }}</span>
              <span :id="`${id}-${room.roomId}-detail`" class="detail">
                {{ howEntered(room) }}<template v-if="room.lastVisit"> · ultima visita {{ daysSince(room.lastVisit) }}</template>
              </span>
            </span>
            <span class="go" aria-hidden="true">→</span>
          </button>
          <button
            :id="`${id}-${room.roomId}-forget`"
            type="button"
            class="forget"
            :aria-labelledby="`${id}-${room.roomId}-forget ${id}-${room.roomId}`"
            @click="forget(room)"
          >
            Dimentica
          </button>
          <p v-if="failure?.roomId === room.roomId" class="below" role="alert">
            {{ failure.message }}
          </p>
          <form v-if="askingKeyFor === room.roomId" class="below new-key" @submit.prevent="enter(room, newKey)">
            <label class="field">
              Chiave nuova
              <input v-model="newKey" required autocomplete="off" autocapitalize="none" spellcheck="false">
            </label>
            <button type="submit" :disabled="pending">
              Entra
            </button>
          </form>
        </li>
      </ul>
      <button type="button" @click="askingQuestions = true">
        Usa questo dispositivo in un'altra Stanza
      </button>
    </div>
    <p>
      <RouterLink class="button" :to="{ name: 'how-it-works' }">
        Come funziona e cosa salviamo
      </RouterLink>
    </p>
  </main>
</template>

<style scoped>
.rooms {
  display: grid;
  gap: 1.25rem;
}
.brand {
  display: flex;
  align-items: center;
  min-height: var(--touch);
  margin: 0;
  font-family: var(--font-display);
  font-size: 1.375rem;
}
.rooms h1 {
  margin: 0;
  font-size: 2rem;
}
.cards {
  display: grid;
  gap: 0.625rem;
  margin: 0;
  padding: 0;
  list-style: none;
}
.card {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 0.25rem 0.5rem;
  padding: 0.375rem 0.625rem 0.375rem 0.375rem;
  border-radius: 1.375rem;
}
.enter {
  justify-content: flex-start;
  gap: 0.75rem;
  min-width: 0;
  padding: 0.5rem;
  border: none;
  border-radius: 1rem;
  font-weight: 400;
  text-align: start;
}
.avatar {
  flex: none;
  width: 3.25rem;
  height: 3.25rem;
}
.text {
  display: grid;
  min-width: 0;
  line-height: 1.25;
}
.name {
  font-family: var(--font-display);
  font-size: 1.375rem;
}
.detail {
  color: var(--text-muted);
  font-size: 0.875rem;
}
.go {
  margin-inline-start: auto;
  font-size: 1.25rem;
}
.forget {
  padding-inline: 0.5rem;
  border: none;
  color: var(--text-muted);
  font-size: 0.875rem;
  font-weight: 400;
  text-decoration: underline;
}
.below {
  grid-column: 1 / -1;
  margin: 0.25rem 0.5rem 0.5rem;
}
.new-key,
.field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
@media (min-width: 700px) {
  .rooms h1 {
    font-size: 2.75rem;
  }
}
</style>
