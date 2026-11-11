import type { Page } from '@playwright/test'
import { expect } from '@playwright/test'
import { cameraThumbnails, createRoom, joinAsCamera, joinAsViewer, members, openDevice, test } from './devices'

function mascotOf(page: Page, memberName: string) {
  return members(page).filter({ hasText: memberName }).getByRole('img')
}

test('each device sees the other\'s animal in the pose of its role', async ({ browser }) => {
  const camera = await openDevice(browser)
  const key = await createRoom(camera, 'Casa al mare')
  await joinAsCamera(camera, 'soggiorno', 'Gatto')
  const viewer = await openDevice(browser)
  await joinAsViewer(viewer, key, 'Andrea', 'Coniglio')

  await expect(mascotOf(camera, 'soggiorno')).toHaveAccessibleName('Gatto seduto')
  await expect(mascotOf(camera, 'Andrea')).toHaveAccessibleName('Coniglio affacciato')
  await expect(cameraThumbnails(viewer).getByRole('img')).toHaveAccessibleName('Gatto seduto')
})

test('the viewer sees the camera\'s animal on its video and its thumbnail, asleep once the camera drops out', async ({ browser }) => {
  const camera = await openDevice(browser)
  const key = await createRoom(camera, 'Casa al mare')
  await joinAsCamera(camera, 'soggiorno', 'Gatto')
  const viewer = await openDevice(browser)
  await joinAsViewer(viewer, key, 'Andrea')
  const mascots = [viewer.getByRole('region', { name: 'soggiorno' }).getByRole('img'), cameraThumbnails(viewer).getByRole('img')]
  for (const mascot of mascots)
    await expect(mascot).toHaveAccessibleName('Gatto seduto')

  await camera.close()

  for (const mascot of mascots)
    await expect(mascot).toHaveAccessibleName('Gatto seduto che dorme')
})

test('a device that keeps the proposed animal enters with it', async ({ browser }) => {
  const camera = await openDevice(browser)
  const key = await createRoom(camera, 'Casa al mare')
  await joinAsCamera(camera, 'soggiorno')
  const viewer = await openDevice(browser)
  await viewer.getByRole('link', { name: 'Entra in una Stanza' }).click()
  const proposed = viewer.getByRole('group', { name: 'Animale' }).getByRole('radio', { checked: true })
  const animal = await proposed.evaluate((input: HTMLInputElement) => input.labels![0]!.textContent!.trim())

  await viewer.getByLabel('Chiave').fill(key)
  await viewer.getByLabel('Spettatore').check()
  await viewer.getByLabel('Soprannome').fill('Andrea')
  await viewer.getByRole('button', { name: 'Entra' }).click()

  await expect(mascotOf(camera, 'Andrea')).toHaveAccessibleName(`${animal} affacciato`)
})

/** Simulates a device on another version: what its Presence says about its animal. */
async function sendInPresence(page: Page, mascot: string | undefined) {
  await page.context().routeWebSocket(/\/realtime\/v1\/websocket/, (client) => {
    const server = client.connectToServer()
    server.onMessage(message => client.send(message))
    client.onMessage((message) => {
      if (typeof message !== 'string')
        return server.send(message)
      const [joinRef, ref, topic, event, payload] = JSON.parse(message)
      if (event === 'presence' && payload.event === 'track')
        return server.send(JSON.stringify([joinRef, ref, topic, event, { ...payload, payload: { ...payload.payload, mascot } }]))
      server.send(message)
    })
  })
  await page.reload()
}

for (const [mascot, version] of [[undefined, 'an older version'], ['drago', 'a newer version']] as const) {
  test(`a device on ${version} shows up as a dog`, async ({ browser }) => {
    const camera = await openDevice(browser)
    const key = await createRoom(camera, 'Casa al mare')
    await joinAsCamera(camera, 'soggiorno')
    const viewer = await openDevice(browser)
    await sendInPresence(viewer, mascot)

    await joinAsViewer(viewer, key, 'Andrea', 'Gatto')

    await expect(mascotOf(camera, 'Andrea')).toHaveAccessibleName('Cane affacciato')
  })
}

test('a device re-entering a recent room comes back with the same animal', async ({ browser }) => {
  const camera = await openDevice(browser)
  const key = await createRoom(camera, 'Casa al mare')
  await joinAsCamera(camera, 'soggiorno', 'Gatto')
  const viewer = await openDevice(browser)
  await joinAsViewer(viewer, key, 'Andrea', 'Coniglio')
  await expect(members(camera)).toHaveCount(2)

  await viewer.reload()
  await viewer.getByRole('list', { name: 'Stanze recenti' }).getByRole('button', { name: 'Casa al mare' }).click()
  await camera.reload()

  await expect(members(camera)).toHaveCount(2)
  await expect(mascotOf(camera, 'soggiorno')).toHaveAccessibleName('Gatto seduto')
  await expect(mascotOf(camera, 'Andrea')).toHaveAccessibleName('Coniglio affacciato')
  await expect(cameraThumbnails(viewer).getByRole('img')).toHaveAccessibleName('Gatto seduto')
})
