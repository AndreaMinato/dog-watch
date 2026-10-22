import type { Page } from '@playwright/test'
import { expect, test } from '@playwright/test'
import { createRoom, expectAdvancingVideo, joinAsCamera, joinAsViewer, openDevice, openPeerConnections } from './devices'

test.use({
  launchOptions: {
    args: ['--use-fake-device-for-media-stream=device-count=2', '--use-fake-ui-for-media-stream'],
  },
})

function filmingCamera(page: Page): Promise<string | undefined> {
  return page.getByLabel('Anteprima').evaluate((preview: HTMLVideoElement) =>
    (preview.srcObject as MediaStream).getVideoTracks()[0]?.getSettings().deviceId)
}

test('a camera with two lenses switches lens while its viewers keep watching', async ({ browser }) => {
  const camera = await openDevice(browser)
  const key = await createRoom(camera, 'Casa al mare')
  await joinAsCamera(camera, 'soggiorno')
  const viewer = await openDevice(browser)
  await joinAsViewer(viewer, key, 'Andrea')
  const feed = viewer.getByLabel('Camera soggiorno')
  await expectAdvancingVideo(feed)

  const lens = camera.getByLabel('Obiettivo')
  await expect(lens.getByRole('option')).toHaveCount(2)
  const other = await lens.getByRole('option').evaluateAll((options: HTMLOptionElement[]) =>
    options.find(option => !option.selected)!.value)
  await lens.selectOption(other)

  await expect.poll(() => filmingCamera(camera)).toBe(other)
  await expectAdvancingVideo(feed)
  expect(await openPeerConnections(camera)).toBe(1)
})
