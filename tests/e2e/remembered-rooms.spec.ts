import { expect, test } from '@playwright/test'
import { createRoom, expectAdvancingVideo, joinAsCamera, joinAsViewer, members, openDevice } from './devices'

test('a reloaded camera re-enters by itself and the viewer sees it again', async ({ browser }) => {
  const camera = await openDevice(browser)
  const key = await createRoom(camera, 'Casa al mare')
  await joinAsCamera(camera, 'soggiorno')
  const viewer = await openDevice(browser)
  await joinAsViewer(viewer, key, 'Andrea')
  await expectAdvancingVideo(viewer.getByLabel('Camera soggiorno'))

  await camera.reload()

  await expect(camera.getByLabel('Anteprima')).toBeVisible()
  await expect(members(camera)).toHaveText(['Spettatore: Andrea', 'Camera: soggiorno (tu)'])
  await expectAdvancingVideo(viewer.getByLabel('Camera soggiorno'))
})
