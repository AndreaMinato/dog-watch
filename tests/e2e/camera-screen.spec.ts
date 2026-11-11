import { expect } from '@playwright/test'
import { createRoom, expectAdvancingVideo, joinAsCamera, joinAsViewer, openDevice, openWatchers, test, watchers } from './devices'

test('the camera films on the whole screen, with its animal, its name and "In diretta" on top', async ({ browser }) => {
  const camera = await openDevice(browser)
  await createRoom(camera, 'Casa al mare')
  await joinAsCamera(camera, 'soggiorno', 'Gatto')

  const preview = camera.getByLabel('Anteprima')
  await expectAdvancingVideo(preview)
  expect(await preview.boundingBox()).toEqual({ x: 0, y: 0, ...camera.viewportSize() })
  await expect(camera.getByRole('heading', { name: 'soggiorno' })).toBeVisible()
  await expect(camera.getByRole('img', { name: 'Gatto seduto', exact: true })).toBeVisible()
  await expect(camera.getByText('In diretta', { exact: true })).toBeVisible()
  await expect(camera.getByRole('button', { name: 'Nessuno guarda' })).toBeVisible()
})

test('the camera always shows how many are watching', async ({ browser }) => {
  const camera = await openDevice(browser)
  const key = await createRoom(camera, 'Casa al mare')
  await joinAsCamera(camera, 'soggiorno')
  const andrea = await openDevice(browser)
  await joinAsViewer(andrea, key, 'Andrea')

  await expect(camera.getByRole('button', { name: '1 persona guarda' })).toBeVisible()

  const giulia = await openDevice(browser)
  await joinAsViewer(giulia, key, 'Giulia')

  await expect(camera.getByRole('button', { name: '2 persone guardano' })).toHaveText('2')

  await andrea.close()
  await giulia.getByRole('button', { name: 'Esci' }).click()

  await expect(camera.getByRole('button', { name: 'Nessuno guarda' })).toHaveText('Nessuno guarda')
})

test('the camera is told for a while when someone starts watching', async ({ browser }) => {
  const camera = await openDevice(browser)
  const key = await createRoom(camera, 'Casa al mare')
  await joinAsCamera(camera, 'soggiorno')

  await joinAsViewer(await openDevice(browser), key, 'Marta')

  const notice = camera.getByRole('status').getByText('Marta sta guardando.', { exact: true })
  await expect(notice).toBeVisible()
  await expect(notice).toBeHidden()
})

test('a camera that re-enters is not told about who was already watching', async ({ browser }) => {
  const camera = await openDevice(browser)
  const key = await createRoom(camera, 'Casa al mare')
  await joinAsCamera(camera, 'soggiorno')
  await joinAsViewer(await openDevice(browser), key, 'Marta')
  await expect(camera.getByText('Marta sta guardando.')).toBeVisible()

  await camera.reload()

  await expect(camera.getByRole('button', { name: '1 persona guarda' })).toBeVisible()
  await expect(camera.getByText('Marta sta guardando.')).toHaveCount(0)
})

test('"Stanno guardando" shows the animal and the name of each viewer, and since when they watch', async ({ browser }) => {
  const camera = await openDevice(browser)
  const key = await createRoom(camera, 'Casa al mare')
  await joinAsCamera(camera, 'soggiorno')
  await joinAsViewer(await openDevice(browser), key, 'Andrea', 'Coniglio')
  await expect(camera.getByRole('button', { name: '1 persona guarda' })).toBeVisible()
  await joinAsViewer(await openDevice(browser), key, 'Giulia', 'Gatto')
  await expect(camera.getByRole('button', { name: '2 persone guardano' })).toBeVisible()

  await openWatchers(camera)

  await expect(watchers(camera)).toHaveText(['Andrea da meno di un minuto', 'Giulia da meno di un minuto'])
  await expect(watchers(camera).filter({ hasText: 'Andrea' }).getByRole('img')).toHaveAccessibleName('Coniglio affacciato')
  await expect(watchers(camera).filter({ hasText: 'Giulia' }).getByRole('img')).toHaveAccessibleName('Gatto affacciato')
})

test('"Stanno guardando" counts how long each viewer has been watching', async ({ browser }) => {
  const camera = await openDevice(browser)
  const key = await createRoom(camera, 'Casa al mare')
  await joinAsCamera(camera, 'soggiorno')
  await joinAsViewer(await openDevice(browser), key, 'Andrea')
  await expect(camera.getByRole('button', { name: '1 persona guarda' })).toBeVisible()

  await camera.clock.setFixedTime(Date.now() + 12.5 * 60_000)
  await openWatchers(camera)

  await expect(watchers(camera)).toHaveText(['Andrea da 12 minuti'])
})
