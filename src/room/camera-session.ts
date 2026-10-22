import type { PeerLink } from './peer-link'
import type { Member, RoomClient } from './room-client'
import { createPeerLink } from './peer-link'

export interface CameraSession {
  readonly preview: MediaStream
  reacquire: () => Promise<void>
  useCamera: (deviceId: string) => Promise<void>
  close: () => void
}

const MAX_VIDEO_BITRATE = 1_500_000
const MAX_VIEWER_LINKS = 3

const video: MediaTrackConstraints = { width: { ideal: 1280, max: 1280 }, height: { ideal: 720, max: 720 } }

export async function startCameraSession(room: RoomClient): Promise<CameraSession> {
  const stream = await navigator.mediaDevices.getUserMedia({ video, audio: true })
  const links = new Map<string, PeerLink>()
  let cameraId: string | undefined
  let closed = false

  function lens(): MediaTrackConstraints {
    return cameraId ? { ...video, deviceId: { exact: cameraId } } : video
  }

  async function capture(constraints: MediaStreamConstraints) {
    const captured = await navigator.mediaDevices.getUserMedia(constraints)
    if (closed) {
      captured.getTracks().forEach(track => track.stop())
      return
    }
    await Promise.all(captured.getTracks().map(swapTrack))
  }

  async function swapTrack(track: MediaStreamTrack) {
    const previous = stream.getTracks().find(candidate => candidate.kind === track.kind)
    if (previous) {
      track.enabled = previous.enabled
      previous.stop()
      stream.removeTrack(previous)
    }
    stream.addTrack(track)
    const senders = [...links.values()]
      .flatMap(link => link.connection.getSenders())
      .filter(sender => sender.track?.kind === track.kind)
    await Promise.all(senders.map(sender => sender.replaceTrack(track)))
  }

  function ended(kind: string) {
    return stream.getTracks().some(track => track.kind === kind && track.readyState === 'ended')
  }

  async function sendStream(connection: RTCPeerConnection) {
    for (const transceiver of connection.getTransceivers()) {
      const track = stream.getTracks().find(candidate => candidate.kind === transceiver.receiver.track.kind)
      if (!track)
        continue
      transceiver.direction = 'sendonly'
      await transceiver.sender.replaceTrack(track)
      if (track.kind === 'video')
        await capBitrate(transceiver.sender)
    }
  }

  function closeLink(viewerId: string) {
    links.get(viewerId)?.close()
    links.delete(viewerId)
  }

  // Viewers present when the key was rotated stay refused until they leave Presence: an
  // honest one leaves at once and comes back with the new key, a rogue one keeps its cached
  // channel access until its JWT is renewed but never gets the stream again.
  let expelled = new Set<string>()

  const stopSignals = room.onSignal((from, signal) => {
    if (expelled.has(from))
      return
    if (links.get(from)?.id !== signal.link) {
      if (!('description' in signal) || signal.description.type !== 'offer')
        return
      if (!links.has(from) && links.size >= MAX_VIEWER_LINKS) {
        room.sendControl(from, { type: 'refused', refusal: 'viewers_full' })
        return
      }
      closeLink(from)
      links.set(from, createPeerLink(room, from, { id: signal.link, polite: true, beforeAnswer: sendStream }))
    }
    links.get(from)!.receive(signal)
  })

  let present = new Set<string>()
  const stopMembers = room.onMembersChange((members: Member[]) => {
    const viewers = new Set(members.filter(member => member.role === 'viewer').map(member => member.id))
    for (const viewerId of present) {
      if (!viewers.has(viewerId))
        closeLink(viewerId)
    }
    present = viewers
    expelled = new Set([...expelled].filter(viewerId => viewers.has(viewerId)))
  })

  const stopControl = room.onControl((event) => {
    if (event.type !== 'key_rotated')
      return
    expelled = new Set([...present, ...links.keys()])
    ;[...links.keys()].forEach(closeLink)
  })

  return {
    preview: stream,
    async reacquire() {
      if (ended('video') || ended('audio'))
        await capture({ video: ended('video') && lens(), audio: ended('audio') })
    },
    async useCamera(deviceId) {
      cameraId = deviceId
      // Phones often cannot open a second camera while the first one is still running.
      stream.getVideoTracks().forEach(track => track.stop())
      await capture({ video: lens() })
    },
    close() {
      closed = true
      stopSignals()
      stopMembers()
      stopControl()
      ;[...links.keys()].forEach(closeLink)
      stream.getTracks().forEach(track => track.stop())
    },
  }
}

async function capBitrate(sender: RTCRtpSender) {
  const parameters = sender.getParameters()
  parameters.encodings.forEach((encoding) => {
    encoding.maxBitrate = MAX_VIDEO_BITRATE
  })
  await sender.setParameters(parameters)
}
