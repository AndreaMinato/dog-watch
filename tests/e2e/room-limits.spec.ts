import type { Page } from '@playwright/test'
import { expect } from '@playwright/test'
import { createRoom, expectAdvancingVideo, joinAsCamera, joinAsCameraWithKey, joinAsViewer, openDevice, openPeerConnections, openWatchers, test, watchers } from './devices'

type PresenceEntries = Record<string, { metas: { name: string }[] }>

/** Simulates a client that ignores the room limits: it never sees these members in Presence. */
async function hideFromPresence(page: Page, names: string[]) {
  const visible = (entries: PresenceEntries) => Object.fromEntries(Object.entries(entries)
    .map(([key, { metas }]) => [key, { metas: metas.filter(meta => !names.includes(meta.name)) }] as const)
    .filter(([, { metas }]) => metas.length > 0))
  await page.context().routeWebSocket(/\/realtime\/v1\/websocket/, (client) => {
    const server = client.connectToServer()
    client.onMessage(message => server.send(message))
    server.onMessage((message) => {
      if (typeof message !== 'string')
        return client.send(message)
      const [joinRef, ref, topic, event, payload] = JSON.parse(message)
      if (event === 'presence_state')
        return client.send(JSON.stringify([joinRef, ref, topic, event, visible(payload)]))
      if (event === 'presence_diff')
        return client.send(JSON.stringify([joinRef, ref, topic, event, { joins: visible(payload.joins), leaves: visible(payload.leaves) }]))
      client.send(message)
    })
  })
  await page.reload()
}

test('a camera named like one already in the room is refused', async ({ browser }) => {
  const first = await openDevice(browser)
  const key = await createRoom(first, 'Casa al mare')
  await joinAsCamera(first, 'soggiorno')
  await expect(first.getByRole('heading', { name: 'soggiorno' })).toBeVisible()

  const second = await openDevice(browser)
  await joinAsCameraWithKey(second, key, 'Soggiorno')

  await expect(second.getByRole('alert')).toHaveText('Nella Stanza c\'è già una telecamera con questo nome: scegline un altro.')
  await expect(second.getByLabel('Che stanza riprende?')).toHaveValue('Soggiorno')
  await expect(first.getByRole('heading', { name: 'soggiorno' })).toBeVisible()
})

test('a fifth camera is refused', async ({ browser }) => {
  const host = await openDevice(browser)
  const key = await createRoom(host, 'Casa al mare')
  await joinAsCamera(host, 'camera 1')
  for (const name of ['camera 2', 'camera 3', 'camera 4']) {
    const camera = await openDevice(browser)
    await joinAsCameraWithKey(camera, key, name)
    await expect(camera.getByRole('heading', { name })).toBeVisible()
  }

  const fifth = await openDevice(browser)
  await joinAsCameraWithKey(fifth, key, 'camera 5')

  await expect(fifth.getByRole('alert')).toHaveText('La Stanza ha già 4 telecamere: non puoi entrare come telecamera.')
  await expect(fifth.getByRole('heading', { name: 'Cosa farà questo dispositivo?' })).toBeVisible()
})

test('a fourth viewer is refused', async ({ browser }) => {
  const camera = await openDevice(browser)
  const key = await createRoom(camera, 'Casa al mare')
  await joinAsCamera(camera, 'soggiorno')
  for (const nickname of ['Andrea', 'Bea', 'Carlo'])
    await joinAsViewer(await openDevice(browser), key, nickname)
  await expect(camera.getByRole('button', { name: '3 persone guardano' })).toBeVisible()

  const fourth = await openDevice(browser)
  await joinAsViewer(fourth, key, 'Dario')

  await expect(fourth.getByRole('alert')).toHaveText('La Stanza ha già 3 Spettatori: non puoi entrare come Spettatore.')
  await expect(fourth.getByRole('heading', { name: 'Cosa farà questo dispositivo?' })).toBeVisible()
  await expect(camera.getByRole('button', { name: '3 persone guardano' })).toBeVisible()
})

test('of two viewers joining together for the last place, the later one leaves even if it got in first', async ({ browser }) => {
  const camera = await openDevice(browser)
  const key = await createRoom(camera, 'Casa al mare')
  await joinAsCamera(camera, 'soggiorno')
  for (const nickname of ['Andrea', 'Bea'])
    await joinAsViewer(await openDevice(browser), key, nickname)
  await expect(camera.getByRole('button', { name: '2 persone guardano' })).toBeVisible()

  const slow = await openDevice(browser)
  const { promise: joined, resolve: onJoined } = Promise.withResolvers<void>()
  const { promise: slowNetwork, resolve: releaseSlowNetwork } = Promise.withResolvers<void>()
  await slow.route('**/functions/v1/join-room', async (route) => {
    const response = await route.fetch()
    onJoined()
    await slowNetwork
    await route.fulfill({ response })
  })
  await joinAsViewer(slow, key, 'Carlo')
  await joined

  const later = await openDevice(browser)
  await joinAsViewer(later, key, 'Dario')
  await expect(later.getByText('Con te: Andrea e Bea')).toBeVisible()

  releaseSlowNetwork()

  await expect(later.getByRole('alert')).toHaveText('La Stanza ha già 3 Spettatori: non puoi entrare come Spettatore.')
  await openWatchers(camera)
  await expect(watchers(camera)).toHaveText([/^Andrea /, /^Bea /, /^Carlo /])
})

test('the camera refuses a fourth viewer that ignores the limit', async ({ browser }) => {
  const camera = await openDevice(browser)
  const key = await createRoom(camera, 'Casa al mare')
  await joinAsCamera(camera, 'soggiorno')
  for (const nickname of ['Andrea', 'Bea', 'Carlo']) {
    const viewer = await openDevice(browser)
    await joinAsViewer(viewer, key, nickname)
    await expectAdvancingVideo(viewer.getByLabel('Telecamera soggiorno'))
  }

  const intruder = await openDevice(browser)
  await hideFromPresence(intruder, ['Andrea', 'Bea', 'Carlo'])
  await joinAsViewer(intruder, key, 'Dario')

  await expect(intruder.getByRole('alert')).toHaveText('La Stanza ha già 3 Spettatori: non puoi entrare come Spettatore.')
  expect(await openPeerConnections(camera)).toBe(3)
})
