import { expect } from '@playwright/test'
import { createRoom, expectAdvancingVideo, joinAsCamera, joinAsViewer, members, openDevice, openPeerConnections, test, videoSenderMaxBitrate } from './devices'

test('the viewer watches the camera live', async ({ browser }) => {
  const camera = await openDevice(browser)
  const key = await createRoom(camera, 'Casa al mare')
  await joinAsCamera(camera, 'soggiorno')

  const viewer = await openDevice(browser)
  await joinAsViewer(viewer, key, 'Andrea')

  await expectAdvancingVideo(viewer.getByLabel('Camera soggiorno'))
})

test('the viewer starts watching a camera that joins after it', async ({ browser }) => {
  const camera = await openDevice(browser)
  const key = await createRoom(camera, 'Casa al mare')

  const viewer = await openDevice(browser)
  await joinAsViewer(viewer, key, 'Andrea')
  await expect(members(viewer)).toHaveCount(1)

  await joinAsCamera(camera, 'soggiorno')

  await expectAdvancingVideo(viewer.getByLabel('Camera soggiorno'))
})

test('the viewer hears the camera only after unmuting it', async ({ browser }) => {
  const camera = await openDevice(browser)
  const key = await createRoom(camera, 'Casa al mare')
  await joinAsCamera(camera, 'soggiorno')

  const viewer = await openDevice(browser)
  await joinAsViewer(viewer, key, 'Andrea')

  const video = viewer.getByLabel('Camera soggiorno')
  await expect.poll(() => video.evaluate((element: HTMLVideoElement) =>
    (element.srcObject as MediaStream).getAudioTracks().length)).toBe(1)
  await expect(video).toHaveJSProperty('muted', true)

  await viewer.getByRole('button', { name: 'Attiva audio' }).click()

  await expect(video).toHaveJSProperty('muted', false)
  await expect(viewer.getByRole('button', { name: 'Disattiva audio' })).toBeVisible()
})

test('the camera previews what it films', async ({ browser }) => {
  const camera = await openDevice(browser)
  await createRoom(camera, 'Casa al mare')
  await joinAsCamera(camera, 'soggiorno')

  await expectAdvancingVideo(camera.getByLabel('Anteprima'))
})

test('the camera keeps connections open only while viewers are present', async ({ browser }) => {
  const camera = await openDevice(browser)
  const key = await createRoom(camera, 'Casa al mare')
  await joinAsCamera(camera, 'soggiorno')
  await expectAdvancingVideo(camera.getByLabel('Anteprima'))
  expect(await openPeerConnections(camera)).toBe(0)

  const viewer = await openDevice(browser)
  await joinAsViewer(viewer, key, 'Andrea')
  await expectAdvancingVideo(viewer.getByLabel('Camera soggiorno'))
  expect(await openPeerConnections(camera)).toBe(1)

  await viewer.getByRole('button', { name: 'Esci' }).click()

  await expect.poll(() => openPeerConnections(camera)).toBe(0)
})

test('the camera caps its video bitrate at 1.5 Mbps', async ({ browser }) => {
  const camera = await openDevice(browser)
  const key = await createRoom(camera, 'Casa al mare')
  await joinAsCamera(camera, 'soggiorno')

  const viewer = await openDevice(browser)
  await joinAsViewer(viewer, key, 'Andrea')
  await expectAdvancingVideo(viewer.getByLabel('Camera soggiorno'))

  expect(await videoSenderMaxBitrate(camera)).toBe(1_500_000)
})
