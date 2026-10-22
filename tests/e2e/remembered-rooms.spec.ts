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

test('a camera re-enters by itself after the browser restarts', async ({ browser }) => {
  const camera = await openDevice(browser)
  const key = await createRoom(camera, 'Casa al mare')
  await joinAsCamera(camera, 'soggiorno')
  const viewer = await openDevice(browser)
  await joinAsViewer(viewer, key, 'Andrea')
  await expectAdvancingVideo(viewer.getByLabel('Camera soggiorno'))

  const storage = await camera.context().storageState()
  await camera.context().close()
  const restarted = await openDevice(browser, storage)

  await expect(restarted.getByLabel('Anteprima')).toBeVisible()
  await expectAdvancingVideo(viewer.getByLabel('Camera soggiorno'))
})

test('a viewer finds the room among the recent ones and re-enters with a tap', async ({ browser }) => {
  const camera = await openDevice(browser)
  const key = await createRoom(camera, 'Casa al mare')
  await joinAsCamera(camera, 'soggiorno')
  const viewer = await openDevice(browser)
  await joinAsViewer(viewer, key, 'Andrea')
  await expectAdvancingVideo(viewer.getByLabel('Camera soggiorno'))

  await viewer.reload()
  const recent = viewer.getByRole('list', { name: 'Stanze recenti' }).getByRole('listitem')
  await expect(recent).toHaveCount(1)
  await expect(recent).toContainText('Casa al mare')
  await expect(recent).toContainText('Spettatore')
  await recent.getByRole('button', { name: 'Casa al mare' }).click()

  await expectAdvancingVideo(viewer.getByLabel('Camera soggiorno'))
  await expect(members(viewer)).toHaveText(['Camera: soggiorno', 'Spettatore: Andrea (tu)'])
})
