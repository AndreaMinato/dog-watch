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
