<script setup lang="ts">
import type { Role } from '../room/room-client'
import { useRouter } from 'vue-router'
import { useRoom } from '../room/use-room'

const router = useRouter()
const { room, members, leave } = useRoom()

const roleLabels: Record<Role, string> = { camera: 'Camera', viewer: 'Spettatore' }

async function exit() {
  await leave()
  await router.push({ name: 'home' })
}
</script>

<template>
  <main>
    <h1>Stanza</h1>
    <h2 id="members-heading">
      Nella Stanza
    </h2>
    <ul aria-labelledby="members-heading">
      <li v-for="member in members" :key="member.id">
        {{ roleLabels[member.role] }}: {{ member.name }}
        <template v-if="member.id === room?.selfId">
          (tu)
        </template>
      </li>
    </ul>
    <button type="button" @click="exit">
      Esci
    </button>
  </main>
</template>
