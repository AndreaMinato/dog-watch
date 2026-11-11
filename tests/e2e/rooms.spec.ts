import { expect } from '@playwright/test'
import { cameraThumbnails, createRoom, enter, joinAsCamera, joinAsViewer, members, next, openDevice, test } from './devices'

test('a camera and a viewer join the same room and see each other', async ({ browser }) => {
  const camera = await openDevice(browser)
  const key = await createRoom(camera, 'Casa al mare')
  await joinAsCamera(camera, 'soggiorno')

  const viewer = await openDevice(browser)
  await joinAsViewer(viewer, key.toUpperCase().replaceAll('-', ' '), 'Andrea')

  await expect(members(camera)).toHaveCount(2)
  await expect(members(camera).filter({ hasText: 'Telecamera' })).toContainText('soggiorno')
  await expect(members(camera).filter({ hasText: 'Spettatore' })).toContainText('Andrea')
  await expect(cameraThumbnails(viewer)).toHaveAccessibleName('soggiorno, in diretta')

  await viewer.getByRole('button', { name: 'Esci' }).click()

  await expect(viewer).toHaveURL('/')
  await expect(members(camera)).toHaveCount(1)
  await expect(members(camera)).toContainText('soggiorno')
})

test('too many wrong keys ask to retry later, back at the key', async ({ browser }) => {
  const viewer = await openDevice(browser)
  await joinAsViewer(viewer, 'abaco abete abisso zuppa', 'Andrea')
  for (let attempt = 0; attempt < 10; attempt++) {
    await next(viewer)
    await next(viewer)
    await enter(viewer)
  }

  await expect(viewer.getByRole('alert')).toHaveText('Troppi tentativi, riprova più tardi.')
  await expect(viewer.getByLabel('Hai la Chiave della Stanza?')).toHaveValue('abaco abete abisso zuppa')
})
