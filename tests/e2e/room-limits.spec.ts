import { expect, test } from '@playwright/test'
import { createRoom, joinAsCamera, joinAsCameraWithKey, joinAsViewer, members, openDevice } from './devices'

test('a camera named like one already in the room is refused', async ({ browser }) => {
  const first = await openDevice(browser)
  const key = await createRoom(first, 'Casa al mare')
  await joinAsCamera(first, 'soggiorno')
  await expect(members(first)).toHaveCount(1)

  const second = await openDevice(browser)
  await joinAsCameraWithKey(second, key, 'Soggiorno')

  await expect(second.getByRole('alert')).toHaveText('Nella Stanza c\'è già una Camera con questo nome: scegline un altro.')
  await expect(members(first)).toHaveCount(1)
})

test('a fifth camera is refused', async ({ browser }) => {
  const host = await openDevice(browser)
  const key = await createRoom(host, 'Casa al mare')
  await joinAsCamera(host, 'camera 1')
  for (const name of ['camera 2', 'camera 3', 'camera 4'])
    await joinAsCameraWithKey(await openDevice(browser), key, name)
  await expect(members(host)).toHaveCount(4)

  const fifth = await openDevice(browser)
  await joinAsCameraWithKey(fifth, key, 'camera 5')

  await expect(fifth.getByRole('alert')).toHaveText('La Stanza ha già 4 Camere: non puoi entrare come Camera.')
  await expect(members(host)).toHaveCount(4)
})

test('a fourth viewer is refused', async ({ browser }) => {
  const camera = await openDevice(browser)
  const key = await createRoom(camera, 'Casa al mare')
  await joinAsCamera(camera, 'soggiorno')
  for (const nickname of ['Andrea', 'Bea', 'Carlo'])
    await joinAsViewer(await openDevice(browser), key, nickname)
  await expect(members(camera)).toHaveCount(4)

  const fourth = await openDevice(browser)
  await joinAsViewer(fourth, key, 'Dario')

  await expect(fourth.getByRole('alert')).toHaveText('La Stanza ha già 3 Spettatori: non puoi entrare come Spettatore.')
  await expect(members(camera)).toHaveCount(4)
})

test('of two viewers joining together for the last place, the later one leaves even if it got in first', async ({ browser }) => {
  const camera = await openDevice(browser)
  const key = await createRoom(camera, 'Casa al mare')
  await joinAsCamera(camera, 'soggiorno')
  for (const nickname of ['Andrea', 'Bea'])
    await joinAsViewer(await openDevice(browser), key, nickname)
  await expect(members(camera)).toHaveCount(3)

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
  await expect(members(later)).toHaveCount(4)

  releaseSlowNetwork()

  await expect(later.getByRole('alert')).toHaveText('La Stanza ha già 3 Spettatori: non puoi entrare come Spettatore.')
  await expect(members(camera)).toHaveText(['Camera: soggiorno (tu)', 'Spettatore: Andrea', 'Spettatore: Bea', 'Spettatore: Carlo'])
})
