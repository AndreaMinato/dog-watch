import { expect } from '@playwright/test'
import { createRoom, joinAsCamera, joinAsViewer, openDevice, openWatchers, test, watchers } from './devices'

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
  await expect(andrea.getByText('Stai guardando solo tu')).toBeVisible()

  const giulia = await openDevice(browser)
  await joinAsViewer(giulia, key, 'Giulia')

  await expect(andrea.getByText('Nuovo Spettatore: Giulia')).toBeVisible()
  await expect(giulia.getByText('Con te: Andrea')).toBeVisible()
  await expect(giulia.getByText(/Nuovo Spettatore/)).toHaveCount(0)
})

test('a viewer sees who else is watching with it', async ({ browser }) => {
  const camera = await openDevice(browser)
  const key = await createRoom(camera, 'Casa al mare')
  await joinAsCamera(camera, 'soggiorno')
  const andrea = await openDevice(browser)
  await joinAsViewer(andrea, key, 'Andrea')
  await expect(andrea.getByText('Stai guardando solo tu')).toBeVisible()

  const giulia = await openDevice(browser)
  await joinAsViewer(giulia, key, 'Giulia')
  const marta = await openDevice(browser)
  await joinAsViewer(marta, key, 'Marta')

  await expect(andrea.getByText('Con te: Giulia e Marta')).toBeVisible()

  await giulia.close()
  await marta.getByRole('button', { name: 'Esci', exact: true }).click()

  await expect(andrea.getByText('Stai guardando solo tu')).toBeVisible()
})
