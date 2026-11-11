import type { Page } from '@playwright/test'
import { expect } from '@playwright/test'
import { cameraThumbnails, createRoom, expectAdvancingVideo, joinAsCamera, joinAsCameraWithKey, joinAsViewer, openCameraMenu, openDevice, openPeerConnections, test } from './devices'

test('the viewer watches the first camera big and brings another one there with a tap on its thumbnail', async ({ browser }) => {
  const livingRoom = await openDevice(browser)
  const key = await createRoom(livingRoom, 'Casa al mare')
  await joinAsCamera(livingRoom, 'soggiorno')
  const kitchen = await openDevice(browser)
  await joinAsCameraWithKey(kitchen, key, 'cucina')

  const viewer = await openDevice(browser)
  await joinAsViewer(viewer, key, 'Andrea')

  const livingRoomThumbnail = cameraThumbnails(viewer).filter({ hasText: 'soggiorno' })
  const kitchenThumbnail = cameraThumbnails(viewer).filter({ hasText: 'cucina' })
  await expect(cameraThumbnails(viewer)).toHaveCount(2)
  await expectAdvancingVideo(viewer.getByLabel('Telecamera soggiorno'))
  await expect(livingRoomThumbnail).toHaveAttribute('aria-current', 'true')

  await kitchenThumbnail.click()

  await expectAdvancingVideo(viewer.getByLabel('Telecamera cucina'))
  await expect(viewer.getByLabel('Telecamera soggiorno')).toHaveCount(0)
  await expect(kitchenThumbnail).toHaveAttribute('aria-current', 'true')
  await expect(livingRoomThumbnail).not.toHaveAttribute('aria-current')
})

test('the viewer starts on the first camera that is live', async ({ browser }) => {
  const livingRoom = await openDevice(browser)
  const key = await createRoom(livingRoom, 'Casa al mare')
  await joinAsCamera(livingRoom, 'soggiorno')
  await (await openCameraMenu(livingRoom)).getByRole('button', { name: 'Metti in pausa' }).click()
  const kitchen = await openDevice(browser)
  await joinAsCameraWithKey(kitchen, key, 'cucina')

  const viewer = await openDevice(browser)
  await joinAsViewer(viewer, key, 'Andrea')

  await expectAdvancingVideo(viewer.getByLabel('Telecamera cucina'))
  await expect(cameraThumbnails(viewer).filter({ hasText: 'cucina' })).toHaveAttribute('aria-current', 'true')
})

function unmutedVideos(page: Page): Promise<(string | null)[]> {
  return page.locator('video').evaluateAll((videos: HTMLVideoElement[]) => videos
    .filter(video => !video.muted)
    .map(video => video.getAttribute('aria-label')))
}

test('the thumbnails play live and silent: only the big video has sound, with its control', async ({ browser }) => {
  const livingRoom = await openDevice(browser)
  const key = await createRoom(livingRoom, 'Casa al mare')
  await joinAsCamera(livingRoom, 'soggiorno')
  const kitchen = await openDevice(browser)
  await joinAsCameraWithKey(kitchen, key, 'cucina')
  const viewer = await openDevice(browser)
  await joinAsViewer(viewer, key, 'Andrea')
  await expect(cameraThumbnails(viewer)).toHaveCount(2)
  for (const thumbnail of await cameraThumbnails(viewer).all())
    await expectAdvancingVideo(thumbnail.locator('video'))
  expect(await openPeerConnections(viewer)).toBe(2)

  await viewer.getByRole('button', { name: 'Attiva audio' }).click()

  expect(await unmutedVideos(viewer)).toEqual(['Telecamera soggiorno'])

  await cameraThumbnails(viewer).filter({ hasText: 'cucina' }).click()

  await expect.poll(() => unmutedVideos(viewer)).toEqual(['Telecamera cucina'])

  await viewer.getByRole('button', { name: 'Disattiva audio' }).click()

  expect(await unmutedVideos(viewer)).toEqual([])
})

test('each thumbnail tells the state of its camera', async ({ browser }) => {
  const livingRoom = await openDevice(browser)
  const key = await createRoom(livingRoom, 'Casa al mare')
  await joinAsCamera(livingRoom, 'soggiorno')
  const kitchen = await openDevice(browser)
  await joinAsCameraWithKey(kitchen, key, 'cucina')
  const viewer = await openDevice(browser)
  await joinAsViewer(viewer, key, 'Andrea')
  const livingRoomThumbnail = cameraThumbnails(viewer).filter({ hasText: 'soggiorno' })
  const kitchenThumbnail = cameraThumbnails(viewer).filter({ hasText: 'cucina' })
  await expect(livingRoomThumbnail).toHaveAccessibleName('soggiorno, in diretta')
  await expect(kitchenThumbnail).toHaveAccessibleName('cucina, in diretta')

  await (await openCameraMenu(kitchen)).getByRole('button', { name: 'Metti in pausa' }).click()
  await livingRoom.close()

  await expect(livingRoomThumbnail).toHaveAccessibleName(/^soggiorno, scollegata dalle \d\d:\d\d$/)
  await expect(kitchenThumbnail).toHaveAccessibleName('cucina, in pausa')
})

test('the viewer of a room without cameras is told there is none', async ({ browser }) => {
  const host = await openDevice(browser)
  const key = await createRoom(host, 'Casa al mare')

  const viewer = await openDevice(browser)
  await joinAsViewer(viewer, key, 'Andrea', 'Gatto')

  const none = viewer.getByRole('heading', { name: 'Qui non c\'è ancora nessuna telecamera' })
  await expect(none).toBeVisible()
  // Looking around is for a camera being connected: nothing is coming here.
  await expect(viewer.getByRole('img', { name: 'Gatto affacciato', exact: true })).toBeVisible()
  await expect(viewer.getByText('apri l\'app su un altro telefono, entra con la Chiave di questa Stanza e scegli di usarlo come telecamera')).toBeVisible()

  await joinAsCamera(host, 'soggiorno')

  await expectAdvancingVideo(viewer.getByLabel('Telecamera soggiorno'))
  await expect(none).toBeHidden()
})

test('a camera that leaves the room disappears from the viewer\'s screen', async ({ browser }) => {
  const livingRoom = await openDevice(browser)
  const key = await createRoom(livingRoom, 'Casa al mare')
  await joinAsCamera(livingRoom, 'soggiorno')
  const kitchen = await openDevice(browser)
  await joinAsCameraWithKey(kitchen, key, 'cucina')
  const viewer = await openDevice(browser)
  await joinAsViewer(viewer, key, 'Andrea')
  await cameraThumbnails(viewer).filter({ hasText: 'cucina' }).click()
  await expectAdvancingVideo(viewer.getByLabel('Telecamera cucina'))

  await (await openCameraMenu(kitchen)).getByRole('button', { name: 'Esci' }).click()

  await expect(cameraThumbnails(viewer)).toHaveCount(1)
  await expect(viewer.getByText(/scollegata/)).toHaveCount(0)
  await expectAdvancingVideo(viewer.getByLabel('Telecamera soggiorno'))

  await (await openCameraMenu(livingRoom)).getByRole('button', { name: 'Esci' }).click()

  await expect(viewer.getByRole('heading', { name: 'Qui non c\'è ancora nessuna telecamera' })).toBeVisible()
  await expect(cameraThumbnails(viewer)).toHaveCount(0)
})

test('a camera that drops out sleeps on the big video, which says what to check', async ({ browser }) => {
  const camera = await openDevice(browser)
  const key = await createRoom(camera, 'Casa al mare')
  await joinAsCamera(camera, 'soggiorno', 'Gatto')
  const viewer = await openDevice(browser)
  await joinAsViewer(viewer, key, 'Andrea')
  const stage = viewer.getByRole('region', { name: 'soggiorno' })
  await expectAdvancingVideo(stage.getByLabel('Telecamera soggiorno'))
  await expect(stage.getByRole('img')).toHaveAccessibleName('Gatto seduto')

  await camera.close()

  await expect(stage.getByText(/soggiorno è scollegata dalle \d\d:\d\d\. Controlla che il telefono sia acceso e connesso al Wi-Fi\./)).toBeVisible()
  await expect(stage.getByRole('img')).toHaveAccessibleName('Gatto seduto che dorme')
})

/** The cameras never answer this device, as when the connection to them can't be made. */
async function withholdSignals(page: Page) {
  await page.context().routeWebSocket(/\/realtime\/v1\/websocket/, (client) => {
    const server = client.connectToServer()
    client.onMessage(message => server.send(message))
    server.onMessage((message) => {
      // Broadcasts arrive as binary frames, with the signal in their JSON payload.
      if (!message.toString().includes('"signal":'))
        client.send(message)
    })
  })
  await page.reload()
}

test('until the video arrives the big video says it is connecting, the animal looking around', async ({ browser }) => {
  const camera = await openDevice(browser)
  const key = await createRoom(camera, 'Casa al mare')
  await joinAsCamera(camera, 'soggiorno', 'Gatto')
  const viewer = await openDevice(browser)
  await withholdSignals(viewer)

  await joinAsViewer(viewer, key, 'Andrea')

  const stage = viewer.getByRole('region', { name: 'soggiorno' })
  await expect(stage.getByText('Collegamento a soggiorno…')).toBeVisible()
  await expect(stage.getByRole('img')).toHaveAccessibleName('Gatto seduto che si guarda intorno')
  await expect(cameraThumbnails(viewer)).toHaveAccessibleName('soggiorno, collegamento in corso')
})

test('the big video fills the screen and comes back', async ({ browser }) => {
  const camera = await openDevice(browser)
  const key = await createRoom(camera, 'Casa al mare')
  await joinAsCamera(camera, 'soggiorno')
  const viewer = await openDevice(browser)
  await joinAsViewer(viewer, key, 'Andrea')
  const stage = viewer.getByRole('region', { name: 'soggiorno' })
  await expectAdvancingVideo(stage.getByLabel('Telecamera soggiorno'))
  const screen = viewer.viewportSize()!

  await stage.getByRole('button', { name: 'Schermo intero' }).click()

  await expect.poll(() => stage.boundingBox()).toEqual({ x: 0, y: 0, ...screen })
  await expectAdvancingVideo(stage.getByLabel('Telecamera soggiorno'))

  await stage.getByRole('button', { name: 'Esci dallo schermo intero' }).click()

  await expect.poll(async () => (await stage.boundingBox())!.width).toBeLessThan(screen.width)
  await expect(stage.getByRole('button', { name: 'Schermo intero' })).toBeVisible()
})

declare global {
  interface Window {
    filledTheScreen?: string | null
  }
}

test('on an iPhone, where only a video can fill the screen, the big video opens in the phone\'s own player', async ({ browser }) => {
  const camera = await openDevice(browser)
  const key = await createRoom(camera, 'Casa al mare')
  await joinAsCamera(camera, 'soggiorno')
  const viewer = await openDevice(browser)
  await viewer.addInitScript(() => {
    Object.defineProperty(Document.prototype, 'fullscreenEnabled', { get: () => false })
    Object.defineProperty(HTMLVideoElement.prototype, 'webkitEnterFullscreen', {
      value(this: HTMLVideoElement) {
        window.filledTheScreen = this.getAttribute('aria-label')
      },
    })
  })
  await viewer.reload()
  await joinAsViewer(viewer, key, 'Andrea')

  await viewer.getByRole('button', { name: 'Schermo intero' }).click()

  expect(await viewer.evaluate(() => window.filledTheScreen)).toBe('Telecamera soggiorno')
})
