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
