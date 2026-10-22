import { expect, test } from '@playwright/test'
import { createRoom, joinAsCamera, joinAsViewer, members, openDevice } from './devices'

test('a camera and a viewer join the same room and see each other', async ({ browser }) => {
  const camera = await openDevice(browser)
  const key = await createRoom(camera, 'Casa al mare')
  await joinAsCamera(camera, 'soggiorno')

  const viewer = await openDevice(browser)
  await joinAsViewer(viewer, key.toUpperCase().replaceAll('-', ' '), 'Andrea')

  for (const page of [camera, viewer]) {
    await expect(members(page)).toHaveCount(2)
    await expect(members(page).filter({ hasText: 'Camera' })).toContainText('soggiorno')
    await expect(members(page).filter({ hasText: 'Spettatore' })).toContainText('Andrea')
  }

  await viewer.getByRole('button', { name: 'Esci' }).click()

  await expect(viewer).toHaveURL('/')
  await expect(members(camera)).toHaveCount(1)
  await expect(members(camera)).toContainText('soggiorno')
})

test('a wrong key is refused', async ({ browser }) => {
  const viewer = await openDevice(browser)
  await joinAsViewer(viewer, 'abaco abete abisso zuppa', 'Andrea')

  await expect(viewer.getByRole('alert')).toHaveText('Chiave non valida')
})
