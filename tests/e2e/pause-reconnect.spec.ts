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
