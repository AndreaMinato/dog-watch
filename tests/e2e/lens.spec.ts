import type { Page } from '@playwright/test'
import { expect } from '@playwright/test'
import { createRoom, expectAdvancingVideo, joinAsCamera, joinAsViewer, openDevice, openPeerConnections, test } from './devices'

// Chromium's fake_device_1 films Y16 depth frames, which WebRTC cannot encode on Linux:
// the viewer is checked only while the other two film.
test.use({
  launchOptions: {
    args: ['--use-fake-device-for-media-stream=device-count=3', '--use-fake-ui-for-media-stream'],
  },
})

function filmingCamera(page: Page): Promise<string | undefined> {
  return page.getByLabel('Anteprima').evaluate((preview: HTMLVideoElement) =>
    (preview.srcObject as MediaStream).getVideoTracks()[0]?.getSettings().deviceId)
}

function lenses(page: Page): Promise<string[]> {
  return page.evaluate(async () => (await navigator.mediaDevices.enumerateDevices())
    .filter(device => device.kind === 'videoinput')
    .map(device => device.deviceId))
}

test('a camera with several lenses moves to the next one at each tap while its viewers keep watching', async ({ browser }) => {
  const camera = await openDevice(browser)
  const key = await createRoom(camera, 'Casa al mare')
  await joinAsCamera(camera, 'soggiorno')
  const viewer = await openDevice(browser)
  await joinAsViewer(viewer, key, 'Andrea')
  const feed = viewer.getByLabel('Telecamera soggiorno')
  await expectAdvancingVideo(feed)
  const [first, second, third] = await lenses(camera)
  await expect.poll(() => filmingCamera(camera)).toBe(first)

  const lens = camera.getByRole('button', { name: 'Cambia obiettivo' })
  await lens.click()
  await expect.poll(() => filmingCamera(camera)).toBe(second)
  await lens.click()
  await expect.poll(() => filmingCamera(camera)).toBe(third)
  await expectAdvancingVideo(feed)
  await lens.click()

  await expect.poll(() => filmingCamera(camera)).toBe(first)
  await expectAdvancingVideo(feed)
  expect(await openPeerConnections(camera)).toBe(1)
})

test('a lens that cannot be opened is reported on the camera', async ({ browser }) => {
  const camera = await openDevice(browser)
  await camera.addInitScript(() => {
    const getUserMedia = MediaDevices.prototype.getUserMedia
    MediaDevices.prototype.getUserMedia = function (constraints) {
      const video = constraints?.video
      if (typeof video === 'object' && video.deviceId)
        return Promise.reject(new DOMException('Could not start video source', 'NotReadableError'))
      return getUserMedia.call(this, constraints)
    }
  })
  await camera.reload()
  await createRoom(camera, 'Casa al mare')
  await joinAsCamera(camera, 'soggiorno')

  await camera.getByRole('button', { name: 'Cambia obiettivo' }).click()

  await expect(camera.getByRole('alert')).toHaveText('Impossibile usare l\'altro obiettivo: potrebbe essere occupato da un\'altra app o non essere più collegato.')
})
