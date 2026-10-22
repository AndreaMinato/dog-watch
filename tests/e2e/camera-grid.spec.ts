import { expect } from '@playwright/test'
import { createRoom, expectAdvancingVideo, joinAsCamera, joinAsCameraWithKey, joinAsViewer, openDevice, test } from './devices'

test('the viewer watches every camera in a grid and enlarges one with a tap', async ({ browser }) => {
  const livingRoom = await openDevice(browser)
  const key = await createRoom(livingRoom, 'Casa al mare')
  await joinAsCamera(livingRoom, 'soggiorno')
  const kitchen = await openDevice(browser)
  await joinAsCameraWithKey(kitchen, key, 'cucina')

  const viewer = await openDevice(browser)
  await joinAsViewer(viewer, key, 'Andrea')

  const livingRoomFeed = viewer.getByLabel('Camera soggiorno')
  const kitchenFeed = viewer.getByLabel('Camera cucina')
  await expectAdvancingVideo(livingRoomFeed)
  await expectAdvancingVideo(kitchenFeed)

  await kitchenFeed.click()

  await expect(livingRoomFeed).toBeHidden()
  await expectAdvancingVideo(kitchenFeed)

  await viewer.getByRole('button', { name: 'Torna alla griglia' }).click()

  await expect(livingRoomFeed).toBeVisible()
  await expect(kitchenFeed).toBeVisible()
})

test('the viewer of a room without cameras is told there is none', async ({ browser }) => {
  const host = await openDevice(browser)
  const key = await createRoom(host, 'Casa al mare')

  const viewer = await openDevice(browser)
  await joinAsViewer(viewer, key, 'Andrea')

  await expect(viewer.getByText('Nessuna Camera nella Stanza')).toBeVisible()

  await joinAsCamera(host, 'soggiorno')

  await expectAdvancingVideo(viewer.getByLabel('Camera soggiorno'))
  await expect(viewer.getByText('Nessuna Camera nella Stanza')).toBeHidden()
})

test('a camera that leaves the room disappears from the viewer\'s grid', async ({ browser }) => {
  const livingRoom = await openDevice(browser)
  const key = await createRoom(livingRoom, 'Casa al mare')
  await joinAsCamera(livingRoom, 'soggiorno')
  const kitchen = await openDevice(browser)
  await joinAsCameraWithKey(kitchen, key, 'cucina')
  const viewer = await openDevice(browser)
  await joinAsViewer(viewer, key, 'Andrea')
  await expectAdvancingVideo(viewer.getByLabel('Camera cucina'))

  await kitchen.getByRole('button', { name: 'Esci' }).click()

  await expect(viewer.getByLabel('Camera cucina')).toHaveCount(0)
  await expect(viewer.getByText(/offline/)).toHaveCount(0)
  await expectAdvancingVideo(viewer.getByLabel('Camera soggiorno'))

  await livingRoom.getByRole('button', { name: 'Esci' }).click()

  await expect(viewer.getByText('Nessuna Camera nella Stanza')).toBeVisible()
  await expect(viewer.getByLabel('Camera soggiorno')).toHaveCount(0)
})

test('the viewer is told there is no camera while the only one is offline', async ({ browser }) => {
  const camera = await openDevice(browser)
  const key = await createRoom(camera, 'Casa al mare')
  await joinAsCamera(camera, 'soggiorno')
  const viewer = await openDevice(browser)
  await joinAsViewer(viewer, key, 'Andrea')
  await expectAdvancingVideo(viewer.getByLabel('Camera soggiorno'))

  await camera.close()

  await expect(viewer.getByText(/Camera soggiorno offline dalle/)).toBeVisible()
  await expect(viewer.getByText('Nessuna Camera nella Stanza')).toBeVisible()
})
