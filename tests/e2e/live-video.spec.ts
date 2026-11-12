import { expect } from '@playwright/test'
import { createRoom, expectAdvancingVideo, joinAsCamera, joinAsViewer, openDevice, openPeerConnections, test, videoSenderMaxBitrate } from './devices'

test('the viewer watches the camera live', async ({ browser }) => {
  const camera = await openDevice(browser)
  const key = await createRoom(camera, 'Casa al mare')
  await joinAsCamera(camera, 'soggiorno')

  const viewer = await openDevice(browser)
  await joinAsViewer(viewer, key, 'Andrea')

  await expectAdvancingVideo(viewer.getByLabel('Telecamera soggiorno'))
})

test('"In diretta" is the same apricot pill for the camera and the viewer, by day and by night', async ({ browser }) => {
  const camera = await openDevice(browser)
  const key = await createRoom(camera, 'Casa al mare')
  await joinAsCamera(camera, 'soggiorno')
  const viewer = await openDevice(browser)
  await joinAsViewer(viewer, key, 'Andrea')

  for (const colorScheme of ['light', 'dark'] as const) {
    for (const page of [camera, viewer]) {
      await page.emulateMedia({ colorScheme })
      const live = page.getByText('In diretta', { exact: true })
      await expect(live).toHaveCSS('background-color', 'rgb(241, 176, 124)')
      await expect(live).toHaveCSS('color', 'rgb(38, 48, 92)')
    }
  }
})

test('the viewer starts watching a camera that joins after it', async ({ browser }) => {
  const camera = await openDevice(browser)
  const key = await createRoom(camera, 'Casa al mare')

  const viewer = await openDevice(browser)
  await joinAsViewer(viewer, key, 'Andrea')
  await expect(viewer.getByRole('heading', { name: 'Qui non c\'è ancora nessuna telecamera' })).toBeVisible()

  await joinAsCamera(camera, 'soggiorno')

  await expectAdvancingVideo(viewer.getByLabel('Telecamera soggiorno'))
})

test('the viewer hears the camera only after unmuting it', async ({ browser }) => {
  const camera = await openDevice(browser)
  const key = await createRoom(camera, 'Casa al mare')
  await joinAsCamera(camera, 'soggiorno')

  const viewer = await openDevice(browser)
  await joinAsViewer(viewer, key, 'Andrea')

  const video = viewer.getByLabel('Telecamera soggiorno')
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
  await expectAdvancingVideo(viewer.getByLabel('Telecamera soggiorno'))
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
  await expectAdvancingVideo(viewer.getByLabel('Telecamera soggiorno'))

  expect(await videoSenderMaxBitrate(camera)).toBe(1_500_000)
})
