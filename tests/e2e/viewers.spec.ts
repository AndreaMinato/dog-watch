import { expect } from '@playwright/test'
import { createRoom, joinAsCamera, joinAsViewer, members, openDevice, openWatchers, test, watchers } from './devices'

test('the camera lists the nicknames of the connected viewers', async ({ browser }) => {
  const camera = await openDevice(browser)
  const key = await createRoom(camera, 'Casa al mare')
  await joinAsCamera(camera, 'soggiorno')

  const andrea = await openDevice(browser)
  await joinAsViewer(andrea, key, 'Andrea')
  const giulia = await openDevice(browser)
  await joinAsViewer(giulia, key, 'Giulia')

  await openWatchers(camera)
  await expect(watchers(camera)).toHaveCount(2)
  await expect(watchers(camera).filter({ hasText: 'Andrea' })).toHaveCount(1)
  await expect(watchers(camera).filter({ hasText: 'Giulia' })).toHaveCount(1)
})

test('the camera drops a viewer from the list when it leaves', async ({ browser }) => {
  const camera = await openDevice(browser)
  const key = await createRoom(camera, 'Casa al mare')
  await joinAsCamera(camera, 'soggiorno')

  const andrea = await openDevice(browser)
  await joinAsViewer(andrea, key, 'Andrea')
  const giulia = await openDevice(browser)
  await joinAsViewer(giulia, key, 'Giulia')
  await openWatchers(camera)
  await expect(watchers(camera)).toHaveCount(2)

  await giulia.close()

  await expect(watchers(camera)).toHaveText([/^Andrea /])
})

test('a viewer is told when another viewer joins', async ({ browser }) => {
  const camera = await openDevice(browser)
  const key = await createRoom(camera, 'Casa al mare')
  await joinAsCamera(camera, 'soggiorno')

  const andrea = await openDevice(browser)
  await joinAsViewer(andrea, key, 'Andrea')
  await expect(members(andrea)).toHaveCount(2)

  const giulia = await openDevice(browser)
  await joinAsViewer(giulia, key, 'Giulia')

  await expect(andrea.getByText('Nuovo Spettatore: Giulia')).toBeVisible()
  await expect(members(giulia)).toHaveCount(3)
  await expect(giulia.getByText(/Nuovo Spettatore/)).toHaveCount(0)
})
