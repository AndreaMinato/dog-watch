import type { ControlEvent, JoinRequest, Member, RoomClient } from './room-client'
import { shallowReadonly, shallowRef } from 'vue'
import { joinRoom } from './room-client'

export type RoomEnd = ControlEvent['type']

const room = shallowRef<RoomClient | null>(null)
const members = shallowRef<readonly Member[]>([])
const ended = shallowRef<RoomEnd | null>(null)

export function useRoom() {
  async function join(request: JoinRequest) {
    await leave()
    const client = await joinRoom(request)
    client.onMembersChange((current) => {
      members.value = current
    })
    client.onControl((event) => {
      if ((event.type === 'room_closed' || event.by !== client.self.id) && end(client, event.type))
        void client.leave()
    })
    ended.value = null
    room.value = client
  }

  function end(client: RoomClient, reason: RoomEnd): boolean {
    if (room.value !== client)
      return false
    room.value = null
    members.value = []
    ended.value = reason
    return true
  }

  async function leave() {
    await room.value?.leave()
    room.value = null
    members.value = []
  }

  async function rotateKey(): Promise<string> {
    return room.value!.rotateKey()
  }

  async function closeRoom() {
    const client = room.value!
    await client.close()
    end(client, 'room_closed')
  }

  return { room: shallowReadonly(room), members: shallowReadonly(members), ended: shallowReadonly(ended), join, leave, rotateKey, closeRoom }
}
