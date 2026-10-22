import { test } from '@playwright/test'
import { createRoom, expectAdvancingVideo, joinAsCamera, joinAsViewer, openDevice } from './devices'

test('the viewer watches the camera live', async ({ browser }) => {
  const camera = await openDevice(browser)
  const key = await createRoom(camera, 'Casa al mare')
  await joinAsCamera(camera, 'soggiorno')

  const viewer = await openDevice(browser)
  await joinAsViewer(viewer, key, 'Andrea')

  await expectAdvancingVideo(viewer.getByLabel('Camera soggiorno'))
})
