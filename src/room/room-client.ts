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

export type Refusal = 'cameras_full' | 'viewers_full' | 'camera_name_taken'

export interface ControlEvent { type: 'refused', refusal: Refusal }

type SignalListener = (from: string, signal: Signal) => void
type ControlListener = (event: ControlEvent) => void

export interface RoomClient {
  readonly self: Member
  readonly iceServers: RTCIceServer[]
  onMembersChange: (listener: (members: Member[]) => void) => () => void
  sendSignal: (to: string, signal: Signal) => void
  onSignal: (listener: SignalListener) => () => void
  sendControl: (to: string, event: ControlEvent) => void
  onControl: (listener: ControlListener) => () => void
  leave: () => Promise<void>
}

export class InvalidKeyError extends Error {}

export class TooManyAttemptsError extends Error {}

export class RoomRefusedError extends Error {
  constructor(readonly refusal: Refusal) {
    super(refusal)
  }
}

const MEMBER_LIMITS: Record<Role, number> = { camera: 4, viewer: 3 }

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

interface ControlMessage {
  to?: string
  event: ControlEvent
}

interface Presence {
  role: Role
  name: string
  joinedAt: number
}

type PresentMember = Member & Pick<Presence, 'joinedAt'>

function sameName(a: string, b: string): boolean {
  return a.localeCompare(b, undefined, { sensitivity: 'base' }) === 0
}

/** Everyone applies the same limits to the same Presence state, so they all agree on who exceeds them: the latest to join. */
function admit(present: PresentMember[]): { admitted: Member[], refusals: Map<string, Refusal> } {
  const admitted: Member[] = []
  const refusals = new Map<string, Refusal>()
  const byJoinOrder = [...present].sort((a, b) => a.joinedAt - b.joinedAt || a.id.localeCompare(b.id))
  for (const { joinedAt: _, ...member } of byJoinOrder) {
    const sameRole = admitted.filter(other => other.role === member.role)
    if (sameRole.length >= MEMBER_LIMITS[member.role])
      refusals.set(member.id, member.role === 'camera' ? 'cameras_full' : 'viewers_full')
    else if (member.role === 'camera' && sameRole.some(other => sameName(other.name, member.name)))
      refusals.set(member.id, 'camera_name_taken')
    else
      admitted.push(member)
  }
  return { admitted, refusals }
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
  const controlListeners = new Set<ControlListener>()
  let members: Member[] = []
  let admitted = false
  let resolveVerdict: (refusal: Refusal | undefined) => void
  const verdict = new Promise<Refusal | undefined>((resolve) => {
    resolveVerdict = resolve
  })
  channel.on('presence', { event: 'sync' }, () => {
    const present = Object.entries(channel.presenceState<Presence>())
      .flatMap(([id, [presence]]) => presence ? [{ id, role: presence.role, name: presence.name, joinedAt: presence.joinedAt }] : [])
    const { admitted: current, refusals } = admit(present)
    members = current
    memberListeners.forEach(listener => listener(members))
    const refusal = refusals.get(self.id)
    if (admitted && refusal) {
      admitted = false
      controlListeners.forEach(listener => listener({ type: 'refused', refusal }))
    }
    else if (present.some(member => member.id === self.id)) {
      resolveVerdict(refusal)
    }
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

  channel.on<ControlMessage>('broadcast', { event: 'control' }, ({ payload }) => {
    if (payload.to === undefined || payload.to === self.id)
      controlListeners.forEach(listener => listener(payload.event))
  })

  async function leave() {
    await invoke('leave-room', { roomId })
    await supabase.removeChannel(channel)
  }

  await subscribe(channel)
  await channel.track({ role, name, joinedAt: Date.now() } satisfies Presence)
  const refusal = await verdict
  if (refusal) {
    await leave()
    throw new RoomRefusedError(refusal)
  }
  admitted = true

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
    sendControl(to, event) {
      channel.send({ type: 'broadcast', event: 'control', payload: { to, event } satisfies ControlMessage })
    },
    onControl(listener) {
      controlListeners.add(listener)
      return () => controlListeners.delete(listener)
    },
    leave,
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
