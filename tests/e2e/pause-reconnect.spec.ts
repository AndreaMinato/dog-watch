import type { Page } from '@playwright/test'
import { expect, test } from '@playwright/test'
import { createRoom, expectAdvancingVideo, joinAsCamera, joinAsViewer, members, openDevice } from './devices'

async function watchCamera(browser: Parameters<typeof openDevice>[0]): Promise<{ camera: Page, viewer: Page }> {
  const camera = await openDevice(browser)
  const key = await createRoom(camera, 'Casa al mare')
  await joinAsCamera(camera, 'soggiorno')
  const viewer = await openDevice(browser)
  await joinAsViewer(viewer, key, 'Andrea')
  await expectAdvancingVideo(viewer.getByLabel('Camera soggiorno'))
  return { camera, viewer }
}

test('the viewer sees the camera paused, then live again when it resumes', async ({ browser }) => {
  const { camera, viewer } = await watchCamera(browser)

  await camera.getByRole('button', { name: 'Metti in pausa' }).click()

  await expect(viewer.getByText('Camera in pausa')).toBeVisible()

  await camera.getByRole('button', { name: 'Riprendi' }).click()

  await expect(viewer.getByText('Camera in pausa')).toBeHidden()
  await expectAdvancingVideo(viewer.getByLabel('Camera soggiorno'))
})

function receivedAudioEnergy(page: Page): Promise<number> {
  return page.evaluate(async () => {
    let energy = 0
    for (const connection of window.peerConnections) {
      const stats = await connection.getStats()
      stats.forEach((report) => {
        if (report.type === 'inbound-rtp' && report.kind === 'audio')
          energy += report.totalAudioEnergy ?? 0
      })
    }
    return energy
  })
}

async function audioEnergyGain(page: Page): Promise<number> {
  const before = await receivedAudioEnergy(page)
  await page.waitForTimeout(1_000)
  return await receivedAudioEnergy(page) - before
}

test('the viewer receives no audio while the camera is silenced', async ({ browser }) => {
  const { camera, viewer } = await watchCamera(browser)
  await viewer.getByRole('button', { name: 'Attiva audio' }).click()
  await expect.poll(() => audioEnergyGain(viewer)).toBeGreaterThan(0.001)

  await camera.getByRole('button', { name: 'Silenzia' }).click()

  await expect.poll(() => audioEnergyGain(viewer)).toBeLessThan(0.000_01)
})

function clockTimes(around: number): string[] {
  return [around - 60_000, around, around + 60_000]
    .map(instant => new Date(instant).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }))
}

test('the viewer sees since when a camera that closed its page is offline', async ({ browser }) => {
  const { camera, viewer } = await watchCamera(browser)

  await camera.close()
  const droppedAt = Date.now()

  const offline = viewer.getByText(/Camera soggiorno offline dalle \d\d:\d\d/)
  await expect(offline).toBeVisible()
  expect(clockTimes(droppedAt)).toContain((await offline.textContent())!.trim().slice(-5))
})

async function loseNetwork(camera: Page): Promise<void> {
  await camera.context().setOffline(true)
  // Offline emulation leaves established WebRTC media flowing: break it by hand.
  await camera.evaluate(() => window.peerConnections.forEach(connection => connection.close()))
}

test('the viewer gets the video back after the camera briefly loses the network', async ({ browser }) => {
  test.setTimeout(120_000)
  const { camera, viewer } = await watchCamera(browser)
  const offline = viewer.getByText(/Camera soggiorno offline dalle/)

  await loseNetwork(camera)

  await expect(offline).toBeVisible({ timeout: 30_000 })

  await camera.context().setOffline(false)

  await expect(offline).toBeHidden({ timeout: 60_000 })
  await expectAdvancingVideo(viewer.getByLabel('Camera soggiorno'))
})

test('the viewer gets the video back after the camera drops out of the room for lack of network', async ({ browser }) => {
  test.setTimeout(240_000)
  const { camera, viewer } = await watchCamera(browser)
  const offline = viewer.getByText(/Camera soggiorno offline dalle/)

  await loseNetwork(camera)

  await expect(members(viewer)).toHaveCount(1, { timeout: 120_000 })
  await expect(offline).toBeVisible()

  await camera.context().setOffline(false)

  await expect(members(viewer)).toHaveCount(2, { timeout: 60_000 })
  await expect(offline).toBeHidden({ timeout: 60_000 })
  await expectAdvancingVideo(viewer.getByLabel('Camera soggiorno'))
})
