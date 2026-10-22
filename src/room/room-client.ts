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

export interface RoomClient {
  readonly selfId: string
  onMembersChange: (listener: (members: Member[]) => void) => void
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

export async function joinRoom({ key, role, name }: JoinRequest): Promise<RoomClient> {
  const { roomId, topic } = await invoke<{ roomId: string, topic: string }>('join-room', { key, role, name })
    .catch((error: unknown) => {
      const status = error instanceof FunctionsHttpError ? error.context.status : undefined
      if (status === 403)
        throw new InvalidKeyError()
      if (status === 429)
        throw new TooManyAttemptsError()
      throw error
    })
  const { data: { session } } = await supabase.auth.getSession()
  const selfId = session!.user.id

  const channel = supabase.channel(topic, { config: { private: true, presence: { key: selfId } } })
  const listeners = new Set<(members: Member[]) => void>()
  let members: Member[] = []
  channel.on('presence', { event: 'sync' }, () => {
    members = Object.entries(channel.presenceState<Omit<Member, 'id'>>())
      .flatMap(([id, [presence]]) => presence ? [{ id, role: presence.role, name: presence.name }] : [])
    listeners.forEach(listener => listener(members))
  })
  await subscribe(channel)
  await channel.track({ role, name })

  return {
    selfId,
    onMembersChange(listener) {
      listeners.add(listener)
      listener(members)
    },
    async leave() {
      await invoke('leave-room', { roomId })
      await supabase.removeChannel(channel)
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
