import type { RoomClient, Signal } from './room-client'

export interface PeerLink {
  readonly id: string
  readonly connection: RTCPeerConnection
  receive: (signal: Signal) => void
  close: () => void
}

interface PeerLinkOptions {
  id?: string
  polite: boolean
  beforeAnswer?: (connection: RTCPeerConnection) => Promise<void>
}

/**
 * Perfect negotiation (https://w3c.github.io/webrtc-pc/#perfect-negotiation-example):
 * the impolite side wins offer collisions, the polite side rolls back its own offer.
 */
export function createPeerLink(room: RoomClient, peerId: string, { id = crypto.randomUUID(), polite, beforeAnswer }: PeerLinkOptions): PeerLink {
  const connection = new RTCPeerConnection({ iceServers: room.iceServers })
  let makingOffer = false
  let ignoreOffer = false
  let queue = Promise.resolve()

  const send = (signal: Omit<Signal, 'link'>) => room.sendSignal(peerId, { link: id, ...signal } as Signal)

  connection.addEventListener('negotiationneeded', async () => {
    try {
      makingOffer = true
      await connection.setLocalDescription()
      send({ description: connection.localDescription!.toJSON() })
    }
    finally {
      makingOffer = false
    }
  })
  connection.addEventListener('icecandidate', ({ candidate }) => {
    if (candidate)
      send({ candidate: candidate.toJSON() })
  })

  async function handle(signal: Signal) {
    if ('candidate' in signal) {
      await connection.addIceCandidate(signal.candidate).catch((error: unknown) => {
        if (!ignoreOffer)
          throw error
      })
      return
    }
    const { description } = signal
    const collision = description.type === 'offer' && (makingOffer || connection.signalingState !== 'stable')
    ignoreOffer = !polite && collision
    if (ignoreOffer)
      return
    await connection.setRemoteDescription(description)
    if (description.type === 'offer') {
      await beforeAnswer?.(connection)
      await connection.setLocalDescription()
      send({ description: connection.localDescription!.toJSON() })
    }
  }

  return {
    id,
    connection,
    receive(signal) {
      queue = queue.then(() => handle(signal)).catch(console.error)
    },
    close() {
      connection.close()
    },
  }
}
