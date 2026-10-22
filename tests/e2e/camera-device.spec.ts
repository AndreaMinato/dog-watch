import { expect, test } from '@playwright/test'
import { createRoom, expectAdvancingVideo, expectFrozenVideo, heldWakeLocks, hideAndShow, joinAsCamera, joinAsViewer, openDevice, openPeerConnections, releaseWakeLocks } from './devices'

test('the camera keeps the screen on', async ({ browser }) => {
  const camera = await openDevice(browser)
  await createRoom(camera, 'Casa al mare')
  await joinAsCamera(camera, 'soggiorno')

  await expect.poll(() => heldWakeLocks(camera)).toBe(1)
})

test('the camera takes the screen lock back when it becomes visible again', async ({ browser }) => {
  const camera = await openDevice(browser)
  await createRoom(camera, 'Casa al mare')
  await joinAsCamera(camera, 'soggiorno')
  await expect.poll(() => heldWakeLocks(camera)).toBe(1)

  await releaseWakeLocks(camera)
  await hideAndShow(camera)

  await expect.poll(() => heldWakeLocks(camera)).toBe(1)
})

test('the camera films again for its viewers after losing the camera while hidden', async ({ browser }) => {
  const camera = await openDevice(browser)
  const key = await createRoom(camera, 'Casa al mare')
  await joinAsCamera(camera, 'soggiorno')
  const viewer = await openDevice(browser)
  await joinAsViewer(viewer, key, 'Andrea')
  const feed = viewer.getByLabel('Camera soggiorno')
  await expectAdvancingVideo(feed)

  await camera.getByLabel('Anteprima').evaluate((preview: HTMLVideoElement) =>
    (preview.srcObject as MediaStream).getVideoTracks().forEach(track => track.stop()))
  await expectFrozenVideo(feed)
  await hideAndShow(camera)

  await expectAdvancingVideo(feed)
  await expectAdvancingVideo(camera.getByLabel('Anteprima'))
  expect(await openPeerConnections(camera)).toBe(1)
})

test('the camera is reminded to stay plugged in and in the foreground', async ({ browser }) => {
  const camera = await openDevice(browser)
  const key = await createRoom(camera, 'Casa al mare')
  await joinAsCamera(camera, 'soggiorno')
  const viewer = await openDevice(browser)
  await joinAsViewer(viewer, key, 'Andrea')

  await expect(camera.getByText('Tieni il dispositivo in carica e questa pagina in primo piano')).toBeVisible()
  await expect(viewer.getByRole('list', { name: 'Nella Stanza' })).toBeVisible()
  await expect(viewer.getByText('Tieni il dispositivo in carica')).toHaveCount(0)
})

test('the camera rests on a black screen listing its viewers and wakes up on a tap', async ({ browser }) => {
  const camera = await openDevice(browser)
  const key = await createRoom(camera, 'Casa al mare')
  await joinAsCamera(camera, 'soggiorno')
  const viewer = await openDevice(browser)
  await joinAsViewer(viewer, key, 'Andrea')

  await camera.getByRole('button', { name: 'Schermata a riposo' }).click()

  const rest = camera.getByRole('region', { name: 'Schermata a riposo' })
  await expect(rest).toHaveCSS('background-color', 'rgb(0, 0, 0)')
  await expect(rest.getByRole('list', { name: 'Spettatori' })).toHaveText(['Andrea'])
  await expect(camera.getByLabel('Anteprima')).toBeHidden()
  await expectAdvancingVideo(viewer.getByLabel('Camera soggiorno'))

  await rest.click()

  await expect(rest).toBeHidden()
  await expectAdvancingVideo(camera.getByLabel('Anteprima'))
})

test('a device with a single camera offers no lens choice', async ({ browser }) => {
  const camera = await openDevice(browser)
  await createRoom(camera, 'Casa al mare')
  await joinAsCamera(camera, 'soggiorno')
  await expectAdvancingVideo(camera.getByLabel('Anteprima'))

  await expect(camera.getByLabel('Obiettivo')).toHaveCount(0)
})
