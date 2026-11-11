import type { Page } from '@playwright/test'
import { expect } from '@playwright/test'
import { cameraThumbnails, createRoom, expectAdvancingVideo, joinAsCamera, joinAsCameraWithKey, joinAsViewer, openCameraMenu, openDevice, rotateKey, test } from './devices'

function recentRooms(page: Page) {
  return page.getByRole('list', { name: 'Le tue Stanze' }).getByRole('listitem')
}

test('a recent room shows the animal, how the device was in it and the last visit, which entering updates', async ({ browser }) => {
  const camera = await openDevice(browser)
  const key = await createRoom(camera, 'Casa al mare')
  await joinAsCamera(camera, 'soggiorno', 'Gatto')
  const viewer = await openDevice(browser)
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  await viewer.clock.setFixedTime(yesterday)
  await joinAsViewer(viewer, key, 'Andrea', 'Coniglio')
  await expect(cameraThumbnails(viewer)).toHaveCount(1)
  await viewer.getByRole('button', { name: 'Esci' }).click()
  await (await openCameraMenu(camera)).getByRole('button', { name: 'Esci' }).click()

  await viewer.clock.setFixedTime(new Date())
  await viewer.reload()

  const cameraRoom = recentRooms(camera).getByRole('button', { name: 'Casa al mare', exact: true })
  await expect(cameraRoom).toHaveAccessibleDescription('Telecamera soggiorno · ultima visita oggi')
  await expect(cameraRoom.getByRole('img')).toHaveAccessibleName('Gatto seduto')
  const viewerRoom = recentRooms(viewer).getByRole('button', { name: 'Casa al mare', exact: true })
  await expect(viewerRoom).toHaveAccessibleDescription('Spettatore · Andrea · ultima visita ieri')
  await expect(viewerRoom.getByRole('img')).toHaveAccessibleName('Coniglio affacciato')

  await viewerRoom.click()
  await expect(viewer.getByText('Qui non c\'è ancora nessuna telecamera')).toBeVisible()
  await viewer.getByRole('button', { name: 'Esci' }).click()

  await expect(viewerRoom).toHaveAccessibleDescription('Spettatore · Andrea · ultima visita oggi')
})

test('a reloaded camera re-enters by itself and the viewer sees it again', async ({ browser }) => {
  const camera = await openDevice(browser)
  const key = await createRoom(camera, 'Casa al mare')
  await joinAsCamera(camera, 'soggiorno')
  const viewer = await openDevice(browser)
  await joinAsViewer(viewer, key, 'Andrea')
  await expectAdvancingVideo(viewer.getByLabel('Telecamera soggiorno'))

  await camera.reload()

  await expect(camera.getByLabel('Anteprima')).toBeVisible()
  await expect(camera.getByRole('button', { name: '1 persona guarda' })).toBeVisible()
  await expectAdvancingVideo(viewer.getByLabel('Telecamera soggiorno'))
})

test('a camera re-enters by itself after the browser restarts', async ({ browser }) => {
  const camera = await openDevice(browser)
  const key = await createRoom(camera, 'Casa al mare')
  await joinAsCamera(camera, 'soggiorno')
  const viewer = await openDevice(browser)
  await joinAsViewer(viewer, key, 'Andrea')
  await expectAdvancingVideo(viewer.getByLabel('Telecamera soggiorno'))

  const storage = await camera.context().storageState()
  await camera.context().close()
  const restarted = await openDevice(browser, { storageState: storage })

  await expect(restarted.getByLabel('Anteprima')).toBeVisible()
  await expectAdvancingVideo(viewer.getByLabel('Telecamera soggiorno'))
})

test('a camera keeps trying to re-enter while joining fails, even with the questions open, and gets back on air by itself', async ({ browser }) => {
  const camera = await openDevice(browser)
  const key = await createRoom(camera, 'Casa al mare')
  await joinAsCamera(camera, 'soggiorno')
  const viewer = await openDevice(browser)
  await joinAsViewer(viewer, key, 'Andrea')
  await expectAdvancingVideo(viewer.getByLabel('Telecamera soggiorno'))
  let failingJoins = 3
  await camera.route('**/functions/v1/join-room', route => failingJoins-- > 0 ? route.abort() : route.fallback())

  await camera.reload()
  await camera.getByRole('button', { name: 'Usa questo dispositivo in un\'altra Stanza' }).click()
  await expect(camera.getByRole('heading', { name: 'Cosa farà questo dispositivo?' })).toBeVisible()

  await expect(camera.getByLabel('Anteprima')).toBeVisible()
  expect(failingJoins).toBe(-1)
  await expectAdvancingVideo(viewer.getByLabel('Telecamera soggiorno'))
})

test('a camera stops re-entering when its remembered key no longer works', async ({ browser }) => {
  const livingRoom = await openDevice(browser)
  const key = await createRoom(livingRoom, 'Casa al mare')
  await joinAsCamera(livingRoom, 'soggiorno')
  const kitchen = await openDevice(browser)
  await joinAsCameraWithKey(kitchen, key, 'cucina')
  await expect(kitchen.getByLabel('Anteprima')).toBeVisible()
  const storage = await kitchen.context().storageState()
  await kitchen.context().close()
  expect(await rotateKey(livingRoom)).not.toBe(key)

  const restarted = await openDevice(browser, { storageState: storage })

  const recent = recentRooms(restarted)
  await expect(recent.getByRole('alert')).toHaveText('La Chiave ricordata non funziona più: probabilmente è stata rigenerata. Inserisci la Chiave nuova.')
  await expect(recent.getByLabel('Chiave nuova')).toBeVisible()
})

test('a viewer finds the room among the recent ones and re-enters with a tap', async ({ browser }) => {
  const camera = await openDevice(browser)
  const key = await createRoom(camera, 'Casa al mare')
  await joinAsCamera(camera, 'soggiorno')
  const viewer = await openDevice(browser)
  await joinAsViewer(viewer, key, 'Andrea')
  await expectAdvancingVideo(viewer.getByLabel('Telecamera soggiorno'))

  await viewer.reload()
  const recent = recentRooms(viewer)
  await expect(recent).toHaveCount(1)
  await expect(recent).toContainText('Casa al mare')
  await expect(recent).toContainText('Spettatore')
  await recent.getByRole('button', { name: 'Casa al mare', exact: true }).click()

  await expectAdvancingVideo(viewer.getByLabel('Telecamera soggiorno'))
  await expect(cameraThumbnails(viewer)).toHaveAccessibleName('soggiorno, in diretta')
  await expect(viewer.getByText('Stai guardando solo tu')).toBeVisible()
})

test('forgetting a room removes it from the recent ones', async ({ browser }) => {
  const device = await openDevice(browser)
  await createRoom(device, 'Casa al mare')
  await joinAsCamera(device, 'soggiorno')
  await (await openCameraMenu(device)).getByRole('button', { name: 'Esci' }).click()
  const recent = recentRooms(device)
  await expect(recent).toContainText('Casa al mare')

  await recent.getByRole('button', { name: 'Dimentica' }).click()

  await expect(device.getByRole('heading', { name: 'Cosa farà questo dispositivo?' })).toBeFocused()
  await expect(recentRooms(device)).toHaveCount(0)
  await device.reload()
  await expect(device.getByRole('heading', { name: 'Cosa farà questo dispositivo?' })).toBeVisible()
  await expect(recentRooms(device)).toHaveCount(0)
})

test('a device with recent rooms answers the questions only to use another room, and keeps its rooms', async ({ browser }) => {
  const device = await openDevice(browser)
  await createRoom(device, 'Casa al mare')
  await joinAsCamera(device, 'soggiorno')
  await device.getByRole('button', { name: 'Esci' }).click()
  await expect(recentRooms(device)).toHaveCount(1)
  await expect(device.getByRole('heading', { name: 'Cosa farà questo dispositivo?' })).toHaveCount(0)

  await device.getByRole('button', { name: 'Usa questo dispositivo in un\'altra Stanza' }).click()
  await expect(device.getByRole('heading', { name: 'Cosa farà questo dispositivo?' })).toBeFocused()
  await expect(recentRooms(device)).toHaveCount(0)
  await device.getByRole('button', { name: 'Le tue Stanze' }).click()
  await expect(device.getByRole('heading', { name: 'Le tue Stanze' })).toBeFocused()
  await device.getByRole('button', { name: 'Usa questo dispositivo in un\'altra Stanza' }).click()
  await createRoom(device, 'Ufficio')
  await joinAsCamera(device, 'scrivania')
  await device.getByRole('button', { name: 'Esci' }).click()

  await expect(recentRooms(device).getByRole('button', { name: /^Casa al mare$|^Ufficio$/ })).toHaveText([/Ufficio/, /Casa al mare/])
})

test('a camera that left its room stays out after a reload', async ({ browser }) => {
  const device = await openDevice(browser)
  await createRoom(device, 'Casa al mare')
  await joinAsCamera(device, 'soggiorno')
  await (await openCameraMenu(device)).getByRole('button', { name: 'Esci' }).click()

  await device.reload()

  await expect(recentRooms(device)).toContainText('Casa al mare')
  await expect(device).toHaveURL(/\/$/)
})

test('after the key is rotated the remembered room asks for the new key', async ({ browser }) => {
  const camera = await openDevice(browser)
  const key = await createRoom(camera, 'Casa al mare')
  await joinAsCamera(camera, 'soggiorno')
  const viewer = await openDevice(browser)
  await joinAsViewer(viewer, key, 'Andrea')
  await expectAdvancingVideo(viewer.getByLabel('Telecamera soggiorno'))
  const newKey = await rotateKey(camera)
  await viewer.getByRole('link', { name: 'Torna alla home' }).click()

  const recent = recentRooms(viewer)
  await recent.getByRole('button', { name: 'Casa al mare', exact: true }).click()

  await expect(recent.getByRole('alert')).toHaveText('La Chiave ricordata non funziona più: probabilmente è stata rigenerata. Inserisci la Chiave nuova.')
  await recent.getByLabel('Chiave nuova').fill(newKey)
  await recent.getByRole('button', { name: 'Entra' }).click()
  await expectAdvancingVideo(viewer.getByLabel('Telecamera soggiorno'))

  await viewer.reload()
  await recent.getByRole('button', { name: 'Casa al mare', exact: true }).click()
  await expectAdvancingVideo(viewer.getByLabel('Telecamera soggiorno'))

  await camera.reload()
  await expect(camera.getByLabel('Anteprima')).toBeVisible()
  await expectAdvancingVideo(viewer.getByLabel('Telecamera soggiorno'))
})

test('a closed room is forgotten', async ({ browser }) => {
  const camera = await openDevice(browser)
  const key = await createRoom(camera, 'Casa al mare')
  await joinAsCamera(camera, 'soggiorno')
  const viewer = await openDevice(browser)
  await joinAsViewer(viewer, key, 'Andrea')
  await expect(cameraThumbnails(viewer)).toHaveCount(1)

  await (await openCameraMenu(camera)).getByRole('button', { name: 'Chiudi la Stanza' }).click()
  await camera.getByRole('dialog', { name: /^Chiudere la Stanza\?/ }).getByRole('button', { name: 'Chiudi', exact: true }).click()

  for (const device of [camera, viewer]) {
    await expect(device.getByRole('alert')).toHaveText('Stanza chiusa')
    await device.getByRole('link', { name: 'Torna alla home' }).click()
    await expect(device.getByRole('heading', { name: 'Cosa farà questo dispositivo?' })).toBeVisible()
    await expect(recentRooms(device)).toHaveCount(0)
  }
})
