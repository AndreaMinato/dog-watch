import type { Page } from '@playwright/test'
import { expect, test } from '@playwright/test'
import { createRoom, expectAdvancingVideo, joinAsCamera, joinAsViewer, openDevice } from './devices'

async function shortenIceServersTtl(page: Page, seconds: number) {
  await page.route(/\/functions\/v1\/(?:join-room|ice-credentials)$/, async (route) => {
    const response = await route.fetch()
    await route.fulfill({ response, json: { ...await response.json(), iceServersTtl: seconds } })
  })
}

function turnUsername(page: Page): Promise<string | undefined> {
  return page.evaluate(() => window.peerConnections
    .filter(connection => connection.connectionState !== 'closed')
    .flatMap(connection => connection.getConfiguration().iceServers ?? [])
    .find(server => server.username)
    ?.username)
}

test('the camera renews its TURN credentials before they expire', async ({ browser }) => {
  const camera = await openDevice(browser)
  await shortenIceServersTtl(camera, 4)
  const key = await createRoom(camera, 'Casa al mare')
  await joinAsCamera(camera, 'soggiorno')
  const viewer = await openDevice(browser)
  await joinAsViewer(viewer, key, 'Andrea')
  const video = viewer.getByLabel('Camera soggiorno')
  await expectAdvancingVideo(video)

  const joined = await turnUsername(camera)

  expect(joined).toBeDefined()
  await expect.poll(() => turnUsername(camera), { timeout: 10_000 }).not.toBe(joined)
  await expectAdvancingVideo(video)
})
