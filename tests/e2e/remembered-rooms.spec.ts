import { expect } from '@playwright/test'
import { createRoom, expectAdvancingVideo, joinAsCamera, joinAsCameraWithKey, joinAsViewer, members, openDevice, test } from './devices'

test('a reloaded camera re-enters by itself and the viewer sees it again', async ({ browser }) => {
  const camera = await openDevice(browser)
  const key = await createRoom(camera, 'Casa al mare')
  await joinAsCamera(camera, 'soggiorno')
  const viewer = await openDevice(browser)
  await joinAsViewer(viewer, key, 'Andrea')
  await expectAdvancingVideo(viewer.getByLabel('Camera soggiorno'))

  await camera.reload()

  await expect(camera.getByLabel('Anteprima')).toBeVisible()
  await expect(members(camera)).toHaveText(['Spettatore: Andrea', 'Camera: soggiorno (tu)'])
  await expectAdvancingVideo(viewer.getByLabel('Camera soggiorno'))
})

test('a camera re-enters by itself after the browser restarts', async ({ browser }) => {
  const camera = await openDevice(browser)
  const key = await createRoom(camera, 'Casa al mare')
  await joinAsCamera(camera, 'soggiorno')
  const viewer = await openDevice(browser)
  await joinAsViewer(viewer, key, 'Andrea')
  await expectAdvancingVideo(viewer.getByLabel('Camera soggiorno'))

  const storage = await camera.context().storageState()
  await camera.context().close()
  const restarted = await openDevice(browser, storage)

  await expect(restarted.getByLabel('Anteprima')).toBeVisible()
  await expectAdvancingVideo(viewer.getByLabel('Camera soggiorno'))
})

test('a camera keeps trying to re-enter while joining fails, and gets back on air by itself', async ({ browser }) => {
  const camera = await openDevice(browser)
  const key = await createRoom(camera, 'Casa al mare')
  await joinAsCamera(camera, 'soggiorno')
  const viewer = await openDevice(browser)
  await joinAsViewer(viewer, key, 'Andrea')
  await expectAdvancingVideo(viewer.getByLabel('Camera soggiorno'))
  let failingJoins = 2
  await camera.route('**/functions/v1/join-room', route => failingJoins-- > 0 ? route.abort() : route.fallback())

  await camera.reload()

  await expect(camera.getByLabel('Anteprima')).toBeVisible()
  expect(failingJoins).toBe(-1)
  await expectAdvancingVideo(viewer.getByLabel('Camera soggiorno'))
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
  await livingRoom.getByRole('button', { name: 'Rigenera la Chiave' }).click()
  await livingRoom.getByRole('dialog').getByRole('button', { name: 'Rigenera' }).click()
  await expect(livingRoom.getByRole('status', { name: 'Chiave della Stanza' })).not.toHaveText(key)

  const restarted = await openDevice(browser, storage)

  const recent = restarted.getByRole('list', { name: 'Stanze recenti' }).getByRole('listitem')
  await expect(recent.getByRole('alert')).toHaveText('La Chiave ricordata non funziona più: probabilmente è stata rigenerata. Inserisci la Chiave nuova.')
  await expect(recent.getByLabel('Chiave nuova')).toBeVisible()
})

test('a viewer finds the room among the recent ones and re-enters with a tap', async ({ browser }) => {
  const camera = await openDevice(browser)
  const key = await createRoom(camera, 'Casa al mare')
  await joinAsCamera(camera, 'soggiorno')
  const viewer = await openDevice(browser)
  await joinAsViewer(viewer, key, 'Andrea')
  await expectAdvancingVideo(viewer.getByLabel('Camera soggiorno'))

  await viewer.reload()
  const recent = viewer.getByRole('list', { name: 'Stanze recenti' }).getByRole('listitem')
  await expect(recent).toHaveCount(1)
  await expect(recent).toContainText('Casa al mare')
  await expect(recent).toContainText('Spettatore')
  await recent.getByRole('button', { name: 'Casa al mare' }).click()

  await expectAdvancingVideo(viewer.getByLabel('Camera soggiorno'))
  await expect(members(viewer)).toHaveText(['Camera: soggiorno', 'Spettatore: Andrea (tu)'])
})

test('forgetting a room removes it from the recent ones', async ({ browser }) => {
  const device = await openDevice(browser)
  await createRoom(device, 'Casa al mare')
  await joinAsCamera(device, 'soggiorno')
  await device.getByRole('button', { name: 'Esci' }).click()
  const recent = device.getByRole('list', { name: 'Stanze recenti' }).getByRole('listitem')
  await expect(recent).toContainText('Casa al mare')

  await recent.getByRole('button', { name: 'Dimentica questa Stanza' }).click()

  await expect(device.getByRole('list', { name: 'Stanze recenti' })).toHaveCount(0)
  await device.reload()
  await expect(device.getByRole('link', { name: 'Crea una Stanza' })).toBeVisible()
  await expect(device.getByRole('list', { name: 'Stanze recenti' })).toHaveCount(0)
})

test('a camera that left its room stays out after a reload', async ({ browser }) => {
  const device = await openDevice(browser)
  await createRoom(device, 'Casa al mare')
  await joinAsCamera(device, 'soggiorno')
  await device.getByRole('button', { name: 'Esci' }).click()

  await device.reload()

  await expect(device.getByRole('list', { name: 'Stanze recenti' })).toContainText('Casa al mare')
  await expect(device).toHaveURL(/\/$/)
})

test('after the key is rotated the remembered room asks for the new key', async ({ browser }) => {
  const camera = await openDevice(browser)
  const key = await createRoom(camera, 'Casa al mare')
  await joinAsCamera(camera, 'soggiorno')
  const viewer = await openDevice(browser)
  await joinAsViewer(viewer, key, 'Andrea')
  await expectAdvancingVideo(viewer.getByLabel('Camera soggiorno'))
  await camera.getByRole('button', { name: 'Rigenera la Chiave' }).click()
  await camera.getByRole('dialog').getByRole('button', { name: 'Rigenera' }).click()
  const newKey = (await camera.getByRole('status', { name: 'Chiave della Stanza' }).textContent())!
  await viewer.getByRole('link', { name: 'Torna alla home' }).click()

  const recent = viewer.getByRole('list', { name: 'Stanze recenti' }).getByRole('listitem')
  await recent.getByRole('button', { name: 'Casa al mare' }).click()

  await expect(recent.getByRole('alert')).toHaveText('La Chiave ricordata non funziona più: probabilmente è stata rigenerata. Inserisci la Chiave nuova.')
  await recent.getByLabel('Chiave nuova').fill(newKey)
  await recent.getByRole('button', { name: 'Entra' }).click()
  await expectAdvancingVideo(viewer.getByLabel('Camera soggiorno'))

  await viewer.reload()
  await recent.getByRole('button', { name: 'Casa al mare' }).click()
  await expectAdvancingVideo(viewer.getByLabel('Camera soggiorno'))

  await camera.reload()
  await expect(camera.getByLabel('Anteprima')).toBeVisible()
  await expectAdvancingVideo(viewer.getByLabel('Camera soggiorno'))
})

test('a closed room is forgotten', async ({ browser }) => {
  const camera = await openDevice(browser)
  const key = await createRoom(camera, 'Casa al mare')
  await joinAsCamera(camera, 'soggiorno')
  const viewer = await openDevice(browser)
  await joinAsViewer(viewer, key, 'Andrea')
  await expect(members(viewer)).toHaveCount(2)

  await camera.getByRole('button', { name: 'Chiudi la Stanza' }).click()
  await camera.getByRole('dialog').getByRole('button', { name: 'Chiudi' }).click()

  for (const device of [camera, viewer]) {
    await expect(device.getByRole('alert')).toHaveText('Stanza chiusa')
    await device.getByRole('link', { name: 'Torna alla home' }).click()
    await expect(device.getByRole('link', { name: 'Crea una Stanza' })).toBeVisible()
    await expect(device.getByRole('list', { name: 'Stanze recenti' })).toHaveCount(0)
  }
})
