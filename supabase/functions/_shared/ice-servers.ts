interface IceServer {
  urls: string | string[]
  username?: string
  credential?: string
}

export const iceServersTtl = 24 * 60 * 60

export type TurnKey = { id: string, apiToken: string } | 'simulated'

export function readTurnKey(env: (name: string) => string | undefined): TurnKey {
  const id = env('CLOUDFLARE_TURN_KEY_ID')
  const apiToken = env('CLOUDFLARE_TURN_KEY_API_TOKEN')
  if (!id || !apiToken)
    throw new Error('CLOUDFLARE_TURN_KEY_ID and CLOUDFLARE_TURN_KEY_API_TOKEN must be set')
  return id === 'simulated' ? 'simulated' : { id, apiToken }
}

export async function createIceServers(turnKey: TurnKey): Promise<IceServer[]> {
  const { iceServers } = turnKey === 'simulated' ? simulateCloudflare() : await requestCloudflare(turnKey)
  return withoutPort53(iceServers)
}

async function requestCloudflare({ id, apiToken }: { id: string, apiToken: string }): Promise<{ iceServers: IceServer[] }> {
  const response = await fetch(
    `https://rtc.live.cloudflare.com/v1/turn/keys/${id}/credentials/generate-ice-servers`,
    {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ ttl: iceServersTtl }),
    },
  )
  if (response.status !== 201)
    throw new Error(`Cloudflare TURN credentials: ${response.status} ${await response.text()}`)
  return response.json()
}

function simulateCloudflare(): { iceServers: IceServer[] } {
  return {
    iceServers: [
      { urls: ['stun:stun.cloudflare.com:3478', 'stun:stun.cloudflare.com:53'] },
      {
        urls: [
          'turn:turn.cloudflare.com:3478?transport=udp',
          'turn:turn.cloudflare.com:53?transport=udp',
          'turn:turn.cloudflare.com:3478?transport=tcp',
          'turn:turn.cloudflare.com:80?transport=tcp',
          'turns:turn.cloudflare.com:5349?transport=tcp',
          'turns:turn.cloudflare.com:443?transport=tcp',
        ],
        username: crypto.randomUUID(),
        credential: crypto.randomUUID(),
      },
    ],
  }
}

// Cloudflare may list alternate URLs on port 53, which browsers block: gathering on them
// only ends in a timeout.
function withoutPort53(servers: IceServer[]): IceServer[] {
  return servers.flatMap((server) => {
    const urls = [server.urls].flat().filter(url => !/:53(?:\?|$)/.test(url))
    return urls.length > 0 ? [{ ...server, urls }] : []
  })
}
