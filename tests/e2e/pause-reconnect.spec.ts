import type { Page } from '@playwright/test'
import { expect } from '@playwright/test'
import { createRoom, expectAdvancingVideo, joinAsCamera, joinAsViewer, openCameraMenu, openDevice, openPeerConnections, test } from './devices'

async function watchCamera(browser: Parameters<typeof openDevice>[0]): Promise<{ camera: Page, viewer: Page }> {
  const camera = await openDevice(browser)
  const key = await createRoom(camera, 'Casa al mare')
  await joinAsCamera(camera, 'soggiorno')
  const viewer = await openDevice(browser)
  await joinAsViewer(viewer, key, 'Andrea')
  await expectAdvancingVideo(viewer.getByLabel('Telecamera soggiorno'))
  return { camera, viewer }
}

test('the camera and the viewer see the camera paused, then live again when it resumes', async ({ browser }) => {
  const { camera, viewer } = await watchCamera(browser)

  await (await openCameraMenu(camera)).getByRole('button', { name: 'Metti in pausa' }).click()

  for (const page of [camera, viewer]) {
    await expect(page.getByText('In pausa', { exact: true })).toBeVisible()
    await expect(page.getByText('In diretta', { exact: true })).toBeHidden()
  }

  await (await openCameraMenu(camera)).getByRole('button', { name: 'Riprendi' }).click()

  for (const page of [camera, viewer]) {
    await expect(page.getByText('In diretta', { exact: true })).toBeVisible()
    await expect(page.getByText('In pausa', { exact: true })).toBeHidden()
  }
  await expectAdvancingVideo(viewer.getByLabel('Telecamera soggiorno'))
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

  await (await openCameraMenu(camera)).getByRole('button', { name: 'Silenzia' }).click()

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

  const offline = viewer.getByText(/soggiorno è scollegata dalle \d\d:\d\d/)
  await expect(offline).toBeVisible()
  expect(clockTimes(droppedAt)).toContain(/dalle (\d\d:\d\d)/.exec((await offline.textContent())!)![1])
})

async function loseNetwork(camera: Page): Promise<void> {
  await camera.context().setOffline(true)
  // Offline emulation leaves established WebRTC media flowing: break it by hand.
  await camera.evaluate(() => window.peerConnections.forEach(connection => connection.close()))
}

test('the viewer gets the video back after the camera briefly loses the network', async ({ browser }) => {
  test.setTimeout(120_000)
  const { camera, viewer } = await watchCamera(browser)
  const offline = viewer.getByText(/soggiorno è scollegata dalle/)

  await loseNetwork(camera)

  await expect(offline).toBeVisible({ timeout: 30_000 })

  await camera.context().setOffline(false)

  await expect(offline).toBeHidden({ timeout: 60_000 })
  await expectAdvancingVideo(viewer.getByLabel('Telecamera soggiorno'))
})

test('the viewer gets the video back after the camera drops out of the room for lack of network', async ({ browser }) => {
  test.setTimeout(240_000)
  const { camera, viewer } = await watchCamera(browser)
  const offline = viewer.getByText(/soggiorno è scollegata dalle/)

  await loseNetwork(camera)

  // Once the camera is out of the room, the viewer stops trying to reach it until it is back.
  await expect.poll(() => openPeerConnections(viewer), { timeout: 120_000 }).toBe(0)
  await expect(offline).toBeVisible()

  await camera.context().setOffline(false)

  await expect.poll(() => openPeerConnections(viewer), { timeout: 60_000 }).toBe(1)
  await expect(offline).toBeHidden({ timeout: 60_000 })
  await expectAdvancingVideo(viewer.getByLabel('Telecamera soggiorno'))
})
