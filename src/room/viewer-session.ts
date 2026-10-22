import type { PeerLink } from './peer-link'
import type { Member, RoomClient } from './room-client'
import { createPeerLink } from './peer-link'

export interface CameraFeed {
  camera: Member
  stream: MediaStream
}

export interface ViewerSession {
  onFeedsChange: (listener: (feeds: CameraFeed[]) => void) => () => void
  close: () => void
}

interface ConnectedCamera extends CameraFeed {
  link: PeerLink
}

export function startViewerSession(room: RoomClient): ViewerSession {
  const cameras = new Map<string, ConnectedCamera>()
  const listeners = new Set<(feeds: CameraFeed[]) => void>()
  const feeds = (): CameraFeed[] => [...cameras.values()].map(({ camera, stream }) => ({ camera, stream }))
  const notify = () => listeners.forEach(listener => listener(feeds()))

  function connect(camera: Member) {
    const link = createPeerLink(room, camera.id, { polite: false })
    const stream = new MediaStream()
    link.connection.addEventListener('track', ({ track }) => stream.addTrack(track))
    link.connection.addTransceiver('video', { direction: 'recvonly' })
    link.connection.addTransceiver('audio', { direction: 'recvonly' })
    cameras.set(camera.id, { camera, stream, link })
  }

  function disconnect(cameraId: string) {
    cameras.get(cameraId)?.link.close()
    cameras.delete(cameraId)
  }

  const stopSignals = room.onSignal((from, signal) => {
    const link = cameras.get(from)?.link
    if (link?.id === signal.link)
      link.receive(signal)
  })

  const stopMembers = room.onMembersChange((members) => {
    const present = new Map(members.filter(member => member.role === 'camera').map(member => [member.id, member]))
    const gone = [...cameras.keys()].filter(id => !present.has(id))
    const arrived = [...present.values()].filter(camera => !cameras.has(camera.id))
    gone.forEach(disconnect)
    arrived.forEach(connect)
    if (gone.length > 0 || arrived.length > 0)
      notify()
  })

  return {
    onFeedsChange(listener) {
      listeners.add(listener)
      listener(feeds())
      return () => listeners.delete(listener)
    },
    close() {
      stopSignals()
      stopMembers()
      ;[...cameras.keys()].forEach(disconnect)
      listeners.clear()
    },
  }
}
