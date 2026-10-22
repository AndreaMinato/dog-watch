import type { JoinRequest, Member, RoomClient } from './room-client'
import { shallowReadonly, shallowRef } from 'vue'
import { joinRoom } from './room-client'

const room = shallowRef<RoomClient | null>(null)
const members = shallowRef<readonly Member[]>([])

export function useRoom() {
  async function join(request: JoinRequest) {
    await leave()
    const client = await joinRoom(request)
    client.onMembersChange((current) => {
      members.value = current
    })
    room.value = client
  }

  async function leave() {
    await room.value?.leave()
    room.value = null
    members.value = []
  }

  return { room: shallowReadonly(room), members: shallowReadonly(members), join, leave }
}
