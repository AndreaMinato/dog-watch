import type { Page } from '@playwright/test'
import { expect, test } from '@playwright/test'
import { createRoom, expectAdvancingVideo, joinAsCamera, joinAsViewer, openDevice } from './devices'

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
