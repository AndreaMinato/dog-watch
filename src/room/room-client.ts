import type { RealtimeChannel } from '@supabase/supabase-js'
import { FunctionsHttpError } from '@supabase/supabase-js'
import { supabase } from './supabase'

export type Role = 'camera' | 'viewer'

export interface Member {
  id: string
  role: Role
  name: string
}

export interface JoinRequest {
  key: string
  role: Role
  name: string
}

export type Signal = { link: string } & (
  | { description: RTCSessionDescriptionInit }
  | { candidate: RTCIceCandidateInit }
)

type SignalListener = (from: string, signal: Signal) => void

export type ControlEvent = { type: 'key_rotated', by: string } | { type: 'room_closed' }

type ControlListener = (event: ControlEvent) => void

interface ControlMessage {
  to?: string
  event: ControlEvent
}

export interface RoomClient {
  readonly self: Member
  readonly iceServers: RTCIceServer[]
  onMembersChange: (listener: (members: Member[]) => void) => () => void
  sendSignal: (to: string, signal: Signal) => void
  onSignal: (listener: SignalListener) => () => void
  onControl: (listener: ControlListener) => () => void
  rotateKey: () => Promise<string>
  close: () => Promise<void>
  leave: () => Promise<void>
}

export class InvalidKeyError extends Error {}

export class TooManyAttemptsError extends Error {}

async function invoke<T>(name: string, body: object): Promise<T> {
  const { data, error } = await supabase.functions.invoke<T>(name, { body })
  if (error)
    throw error
  return data as T
}

export function createRoom(name: string): Promise<{ roomId: string, key: string }> {
  return invoke('create-room', { name })
}

interface JoinResponse {
  roomId: string
  topic: string
  iceServers: RTCIceServer[]
}

interface SignalMessage {
  from: string
  to: string
  signal: Signal
}

export async function joinRoom({ key, role, name }: JoinRequest): Promise<RoomClient> {
  const { roomId, topic, iceServers } = await invoke<JoinResponse>('join-room', { key, role, name })
    .catch((error: unknown) => {
      const status = error instanceof FunctionsHttpError ? error.context.status : undefined
      if (status === 403)
        throw new InvalidKeyError()
      if (status === 429)
        throw new TooManyAttemptsError()
      throw error
    })
  const { data: { session } } = await supabase.auth.getSession()
  const self: Member = { id: session!.user.id, role, name }

  const channel = supabase.channel(topic, { config: { private: true, presence: { key: self.id } } })
  const memberListeners = new Set<(members: Member[]) => void>()
  let members: Member[] = []
  channel.on('presence', { event: 'sync' }, () => {
    members = Object.entries(channel.presenceState<Omit<Member, 'id'>>())
      .flatMap(([id, [presence]]) => presence ? [{ id, role: presence.role, name: presence.name }] : [])
    memberListeners.forEach(listener => listener(members))
  })

  // Signals can arrive before a session starts listening (a Viewer offers as soon as it
  // sees this Camera in Presence), so they wait here for the first listener.
  const signalListeners = new Set<SignalListener>()
  const pendingSignals: SignalMessage[] = []
  channel.on<SignalMessage>('broadcast', { event: 'signal' }, ({ payload }) => {
    if (payload.to !== self.id)
      return
    if (signalListeners.size === 0)
      pendingSignals.push(payload)
    signalListeners.forEach(listener => listener(payload.from, payload.signal))
  })

  const controlListeners = new Set<ControlListener>()
  const notifyControl = (event: ControlEvent) => controlListeners.forEach(listener => listener(event))
  channel.on<ControlMessage>('broadcast', { event: 'control' }, ({ payload: { to, event } }) => {
    if ((to && to !== self.id) || (event.type === 'key_rotated' && event.by === self.id))
      return
    notifyControl(event)
  })

  await subscribe(channel)
  await channel.track({ role, name })

  const disconnect = () => supabase.removeChannel(channel)

  return {
    self,
    iceServers,
    onMembersChange(listener) {
      memberListeners.add(listener)
      listener(members)
      return () => memberListeners.delete(listener)
    },
    sendSignal(to, signal) {
      channel.send({ type: 'broadcast', event: 'signal', payload: { from: self.id, to, signal } satisfies SignalMessage })
    },
    onSignal(listener) {
      signalListeners.add(listener)
      pendingSignals.splice(0).forEach(({ from, signal }) => listener(from, signal))
      return () => signalListeners.delete(listener)
    },
    onControl(listener) {
      controlListeners.add(listener)
      return () => controlListeners.delete(listener)
    },
    async rotateKey() {
      const { key } = await invoke<{ key: string }>('rotate-key', { roomId })
      // Not waiting for the broadcast: the rotating Camera must drop the expelled at once.
      notifyControl({ type: 'key_rotated', by: self.id })
      return key
    },
    async close() {
      await invoke('close-room', { roomId })
      await disconnect()
    },
    async leave() {
      await invoke('leave-room', { roomId })
      await disconnect()
    },
  }
}

function subscribe(channel: RealtimeChannel): Promise<void> {
  return new Promise((resolve, reject) => {
    channel.subscribe((status, error) => {
      if (status === 'SUBSCRIBED')
        resolve()
      else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT')
        reject(error ?? new Error(status))
    })
  })
}
