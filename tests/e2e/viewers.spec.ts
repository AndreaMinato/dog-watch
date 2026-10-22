import { expect, test } from '@playwright/test'
import { createRoom, joinAsCamera, joinAsViewer, openDevice } from './devices'

test('the camera lists the nicknames of the connected viewers', async ({ browser }) => {
  const camera = await openDevice(browser)
  const key = await createRoom(camera, 'Casa al mare')
  await joinAsCamera(camera, 'soggiorno')

  const andrea = await openDevice(browser)
  await joinAsViewer(andrea, key, 'Andrea')
  const giulia = await openDevice(browser)
  await joinAsViewer(giulia, key, 'Giulia')

  const viewers = camera.getByRole('list', { name: 'Spettatori' }).getByRole('listitem')
  await expect(viewers).toHaveCount(2)
  await expect(viewers.filter({ hasText: 'Andrea' })).toHaveCount(1)
  await expect(viewers.filter({ hasText: 'Giulia' })).toHaveCount(1)
})

test('the camera drops a viewer from the list when it leaves', async ({ browser }) => {
  const camera = await openDevice(browser)
  const key = await createRoom(camera, 'Casa al mare')
  await joinAsCamera(camera, 'soggiorno')

  const andrea = await openDevice(browser)
  await joinAsViewer(andrea, key, 'Andrea')
  const giulia = await openDevice(browser)
  await joinAsViewer(giulia, key, 'Giulia')
  const viewers = camera.getByRole('list', { name: 'Spettatori' }).getByRole('listitem')
  await expect(viewers).toHaveCount(2)

  await giulia.close()

  await expect(viewers).toHaveText(['Andrea'])
})
