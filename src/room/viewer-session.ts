import type { PeerLink } from './peer-link'
import type { Member, RoomClient } from './room-client'
import { createPeerLink } from './peer-link'

export interface CameraFeed {
  camera: Member
  stream: MediaStream
  offlineSince: Date | null
}

export interface ViewerSession {
  onFeedsChange: (listener: (feeds: CameraFeed[]) => void) => () => void
  close: () => void
}

interface WatchedCamera extends CameraFeed {
  link: PeerLink | null
}

const RESTART_ICE_AFTER_MS = 5_000
const RECONNECT_AFTER_MS = 10_000

export function startViewerSession(room: RoomClient): ViewerSession {
  const cameras = new Map<string, WatchedCamera>()
  const listeners = new Set<(feeds: CameraFeed[]) => void>()
  const feeds = (): CameraFeed[] => [...cameras.values()].map(({ camera, stream, offlineSince }) => ({ camera, stream, offlineSince }))
  const notify = () => listeners.forEach(listener => listener(feeds()))

  function connect(watched: WatchedCamera) {
    const link = createPeerLink(room, watched.camera.id, { polite: false })
    link.connection.addEventListener('track', ({ track }) => {
      watched.stream.getTracks()
        .filter(previous => previous.kind === track.kind)
        .forEach(previous => watched.stream.removeTrack(previous))
      watched.stream.addTrack(track)
    })
    let recovery: ReturnType<typeof setTimeout> | undefined
    const whileCurrent = (action: () => void) => () => {
      if (watched.link === link)
        action()
    }
    const reconnectUnlessConnected = () => {
      recovery = setTimeout(whileCurrent(() => {
        disconnect(watched)
        connect(watched)
      }), RECONNECT_AFTER_MS)
    }
    link.connection.addEventListener('connectionstatechange', () => {
      const state = link.connection.connectionState
      if (state === 'connected') {
        clearTimeout(recovery)
        recovery = undefined
        if (watched.offlineSince) {
          watched.offlineSince = null
          notify()
        }
      }
      else if ((state === 'disconnected' || state === 'failed') && recovery === undefined) {
        const droppedAt = new Date()
        recovery = setTimeout(whileCurrent(() => {
          watched.offlineSince ??= droppedAt
          notify()
          link.connection.restartIce()
          reconnectUnlessConnected()
        }), state === 'failed' ? 0 : RESTART_ICE_AFTER_MS)
      }
    })
    reconnectUnlessConnected()
    link.connection.addTransceiver('video', { direction: 'recvonly' })
    link.connection.addTransceiver('audio', { direction: 'recvonly' })
    watched.link = link
  }

  function disconnect(watched: WatchedCamera) {
    watched.link?.close()
    watched.link = null
  }

  const stopSignals = room.onSignal((from, signal) => {
    const link = cameras.get(from)?.link
    if (link?.id === signal.link)
      link.receive(signal)
  })

  const stopMembers = room.onMembersChange((members) => {
    const present = new Map(members.filter(member => member.role === 'camera').map(member => [member.id, member]))
    let changed = false
    for (const watched of cameras.values()) {
      const camera = present.get(watched.camera.id)
      if (!camera && watched.link) {
        disconnect(watched)
        watched.offlineSince ??= new Date()
        changed = true
      }
      else if (camera && (camera.status !== watched.camera.status || !watched.link)) {
        watched.camera = camera
        changed = true
      }
      if (camera && !watched.link)
        connect(watched)
    }
    for (const camera of present.values()) {
      if (cameras.has(camera.id))
        continue
      const watched: WatchedCamera = { camera, stream: new MediaStream(), offlineSince: null, link: null }
      cameras.set(camera.id, watched)
      connect(watched)
      changed = true
    }
    if (changed)
      notify()
  })

  const stopDepartures = room.onDeparture(({ id }) => {
    const watched = cameras.get(id)
    if (!watched)
      return
    disconnect(watched)
    cameras.delete(id)
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
      stopDepartures()
      cameras.forEach(disconnect)
      listeners.clear()
    },
  }
}
