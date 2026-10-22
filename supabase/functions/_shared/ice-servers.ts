interface IceServer {
  urls: string | string[]
  username?: string
  credential?: string
}

export const iceServersTtl = 24 * 60 * 60

const simulated = Deno.env.get('CLOUDFLARE_TURN_SIMULATED') === 'true'
const turnKeyId = Deno.env.get('CLOUDFLARE_TURN_KEY_ID')
const turnKeyApiToken = Deno.env.get('CLOUDFLARE_TURN_KEY_API_TOKEN')
if (!simulated && (!turnKeyId || !turnKeyApiToken))
  throw new Error('CLOUDFLARE_TURN_KEY_ID and CLOUDFLARE_TURN_KEY_API_TOKEN must be set')

export async function createIceServers(): Promise<IceServer[]> {
  const { iceServers } = simulated ? simulateCloudflare() : await requestCloudflare()
  return withoutPort53(iceServers)
}

async function requestCloudflare(): Promise<{ iceServers: IceServer[] }> {
  const response = await fetch(
    `https://rtc.live.cloudflare.com/v1/turn/keys/${turnKeyId}/credentials/generate-ice-servers`,
    {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${turnKeyApiToken}`, 'Content-Type': 'application/json' },
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
