import type { JoinRequest, Member, Refusal, RoomClient } from './room-client'
import { shallowReadonly, shallowRef } from 'vue'
import { joinRoom } from './room-client'

const room = shallowRef<RoomClient | null>(null)
const members = shallowRef<readonly Member[]>([])
const refusal = shallowRef<Refusal | null>(null)

export function useRoom() {
  async function join(request: JoinRequest) {
    await leave()
    refusal.value = null
    const client = await joinRoom(request)
    client.onMembersChange((current) => {
      members.value = current
    })
    client.onControl(async (event) => {
      refusal.value = event.refusal
      await leave()
    })
    room.value = client
  }

  async function leave() {
    const client = room.value
    room.value = null
    members.value = []
    await client?.leave()
  }

  return { room: shallowReadonly(room), members: shallowReadonly(members), refusal: shallowReadonly(refusal), join, leave }
}
