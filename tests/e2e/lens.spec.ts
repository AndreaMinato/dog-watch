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
