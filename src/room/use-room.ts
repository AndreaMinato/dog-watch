import type { ControlEvent, JoinRequest, Member, RoomClient } from './room-client'
import { shallowReadonly, shallowRef, triggerRef } from 'vue'
import { forgetRoom, rememberEnteredRoom, rememberLeftRoom } from './remembered-rooms'
import { joinRoom } from './room-client'

const room = shallowRef<RoomClient | null>(null)
const members = shallowRef<readonly Member[]>([])
const ended = shallowRef<ControlEvent | null>(null)

function remember(client: RoomClient) {
  const { roomId, roomName, key, self: { role, name } } = client
  rememberEnteredRoom({ roomId, roomName, key, role, name })
}

export function useRoom() {
  async function join(request: JoinRequest) {
    if (room.value)
      await leave()
    ended.value = null
    const client = await joinRoom(request)
    client.onMembersChange((current) => {
      members.value = current
    })
    client.onControl(async (event) => {
      if (event.type === 'key_rotated' && event.by === client.self.id)
        return
      if (end(client, event))
        await client.leave()
    })
    room.value = client
    remember(client)
  }

  function end(client: RoomClient, event: ControlEvent): boolean {
    if (room.value !== client)
      return false
    room.value = null
    members.value = []
    ended.value = event
    if (event.type === 'room_closed')
      forgetRoom(client.roomId)
    else
      rememberLeftRoom()
    return true
  }

  async function leave() {
    const client = room.value
    room.value = null
    members.value = []
    rememberLeftRoom()
    await client?.leave()
  }

  async function rotateKey() {
    await room.value!.rotateKey()
    remember(room.value!)
    triggerRef(room)
  }

  async function closeRoom() {
    const client = room.value!
    await client.close()
    end(client, { type: 'room_closed' })
  }

  return { room: shallowReadonly(room), members: shallowReadonly(members), ended: shallowReadonly(ended), join, leave, rotateKey, closeRoom }
}
