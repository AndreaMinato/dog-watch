import type { RealtimeChannel } from '@supabase/supabase-js'
import { FunctionsHttpError } from '@supabase/supabase-js'
import { supabase } from './supabase'

export type Role = 'camera' | 'viewer'

export type CameraStatus = 'live' | 'paused'

export interface Member {
  id: string
  role: Role
  name: string
  status: CameraStatus
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

export type ControlEvent
  = | { type: 'refused', refusal: Refusal }
    | { type: 'key_rotated', by: string }
    | { type: 'room_closed' }

type SignalListener = (from: string, signal: Signal) => void
type ControlListener = (event: ControlEvent) => void

export interface RoomClient {
  readonly key: string
  readonly self: Member
  readonly iceServers: RTCIceServer[]
  onIceServersChange: (listener: (iceServers: RTCIceServer[]) => void) => () => void
  onMembersChange: (listener: (members: Member[]) => void) => () => void
  sendSignal: (to: string, signal: Signal) => void
  onSignal: (listener: SignalListener) => () => void
  sendControl: (to: string, event: ControlEvent) => void
  onControl: (listener: ControlListener) => () => void
  setStatus: (status: CameraStatus) => Promise<void>
  rotateKey: () => Promise<void>
  close: () => Promise<void>
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

interface IceServersGrant {
  iceServers: RTCIceServer[]
  iceServersTtl: number
}

interface JoinResponse extends IceServersGrant {
  roomId: string
  topic: string
  joinedAt: string
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
  joinedAt: string
  status: CameraStatus
}

type PresentMember = Member & Pick<Presence, 'joinedAt'>

function sameName(a: string, b: string): boolean {
  return a.localeCompare(b, undefined, { sensitivity: 'base' }) === 0
}

/** Everyone applies the same limits to the same Presence state, so they all agree on who exceeds them: the latest to join. */
function admit(present: PresentMember[]): { admitted: Member[], refusals: Map<string, Refusal> } {
  const admitted: Member[] = []
  const refusals = new Map<string, Refusal>()
  const byJoinOrder = [...present].sort((a, b) => Date.parse(a.joinedAt) - Date.parse(b.joinedAt) || a.id.localeCompare(b.id))
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
  const { roomId, topic, iceServers: joinedIceServers, iceServersTtl, joinedAt } = await invoke<JoinResponse>('join-room', { key, role, name })
    .catch((error: unknown) => {
      const status = error instanceof FunctionsHttpError ? error.context.status : undefined
      if (status === 403)
        throw new InvalidKeyError()
      if (status === 429)
        throw new TooManyAttemptsError()
      throw error
    })
  const { data: { session } } = await supabase.auth.getSession()
  const self: Member = { id: session!.user.id, role, name, status: 'live' }

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
      .flatMap(([id, [presence]]) => presence ? [{ id, role: presence.role, name: presence.name, joinedAt: presence.joinedAt, status: presence.status }] : [])
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

  let iceServers = joinedIceServers
  const iceServersListeners = new Set<(iceServers: RTCIceServer[]) => void>()
  let renewal: ReturnType<typeof setTimeout> | undefined
  // TURN credentials expire: renew them halfway, and on failure retry halfway to the
  // same expiry, so a transient error still leaves time for another attempt.
  function scheduleIceServersRenewal(expiresAt: number) {
    renewal = setTimeout(async () => {
      try {
        const grant = await invoke<IceServersGrant>('ice-credentials', { roomId })
        iceServers = grant.iceServers
        iceServersListeners.forEach(listener => listener(iceServers))
        scheduleIceServersRenewal(Date.now() + grant.iceServersTtl * 1000)
      }
      catch (error) {
        console.error(error)
        if (Date.now() < expiresAt)
          scheduleIceServersRenewal(expiresAt)
      }
    }, (expiresAt - Date.now()) / 2)
  }

  const notifyControl = (event: ControlEvent) => controlListeners.forEach(listener => listener(event))
  channel.on<ControlMessage>('broadcast', { event: 'control' }, ({ payload: { to, event } }) => {
    if ((to === undefined || to === self.id) && !(event.type === 'key_rotated' && event.by === self.id))
      notifyControl(event)
  })

  async function disconnect() {
    clearTimeout(renewal)
    await supabase.removeChannel(channel)
  }

  async function leave() {
    await invoke('leave-room', { roomId })
    await disconnect()
  }

  const presence: Presence = { role, name, joinedAt, status: 'live' }
  // Realtime drops this Presence with the socket: track it again after every rejoin.
  await subscribe(channel, () => channel.track(presence))
  await channel.track(presence)
  const refusal = await verdict
  if (refusal) {
    await leave()
    throw new RoomRefusedError(refusal)
  }
  admitted = true
  scheduleIceServersRenewal(Date.now() + iceServersTtl * 1000)

  let currentKey = key

  return {
    get key() {
      return currentKey
    },
    self,
    get iceServers() {
      return iceServers
    },
    onIceServersChange(listener) {
      iceServersListeners.add(listener)
      return () => iceServersListeners.delete(listener)
    },
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
    async setStatus(status) {
      presence.status = status
      await channel.track(presence)
    },
    async rotateKey() {
      currentKey = (await invoke<{ key: string }>('rotate-key', { roomId })).key
      // Not waiting for the broadcast: the rotating Camera must drop the expelled at once.
      notifyControl({ type: 'key_rotated', by: self.id })
    },
    async close() {
      await invoke('close-room', { roomId })
      await disconnect()
    },
    leave,
  }
}

function subscribe(channel: RealtimeChannel, onRejoin: () => void): Promise<void> {
  let subscribed = false
  return new Promise((resolve, reject) => {
    channel.subscribe((status, error) => {
      if (status === 'SUBSCRIBED' && subscribed) {
        onRejoin()
      }
      else if (status === 'SUBSCRIBED') {
        subscribed = true
        resolve()
      }
      else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
        reject(error ?? new Error(status))
      }
    })
  })
}
