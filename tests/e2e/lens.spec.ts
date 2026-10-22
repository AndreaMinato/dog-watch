import type { Page } from '@playwright/test'
import { expect, test } from '@playwright/test'
import { createRoom, expectAdvancingVideo, joinAsCamera, joinAsViewer, openDevice, openPeerConnections } from './devices'

// Chromium's fake_device_1 films Y16 depth frames, which WebRTC cannot encode on Linux.
test.use({
  launchOptions: {
    args: ['--use-fake-device-for-media-stream=device-count=3', '--use-fake-ui-for-media-stream'],
  },
})

function filmingCamera(page: Page): Promise<string | undefined> {
  return page.getByLabel('Anteprima').evaluate((preview: HTMLVideoElement) =>
    (preview.srcObject as MediaStream).getVideoTracks()[0]?.getSettings().deviceId)
}

test('a camera with several lenses switches lens while its viewers keep watching', async ({ browser }) => {
  const camera = await openDevice(browser)
  const key = await createRoom(camera, 'Casa al mare')
  await joinAsCamera(camera, 'soggiorno')
  const viewer = await openDevice(browser)
  await joinAsViewer(viewer, key, 'Andrea')
  const feed = viewer.getByLabel('Camera soggiorno')
  await expectAdvancingVideo(feed)

  const lens = camera.getByLabel('Obiettivo')
  await expect(lens.getByRole('option')).toHaveCount(3)
  const other = (await lens.getByRole('option', { name: 'fake_device_2' }).getAttribute('value'))!
  await lens.selectOption(other)

  await expect.poll(() => filmingCamera(camera)).toBe(other)
  await expectAdvancingVideo(feed)
  expect(await openPeerConnections(camera)).toBe(1)
})
