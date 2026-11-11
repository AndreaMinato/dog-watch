import { expect } from '@playwright/test'
import { cameraThumbnails, createRoom, enter, joinAsCamera, joinAsViewer, next, openDevice, openWatchers, test, watchers } from './devices'

test('a camera and a viewer join the same room and see each other', async ({ browser }) => {
  const camera = await openDevice(browser)
  const key = await createRoom(camera, 'Casa al mare')
  await joinAsCamera(camera, 'soggiorno')

  const viewer = await openDevice(browser)
  await joinAsViewer(viewer, key.toUpperCase().replaceAll('-', ' '), 'Andrea')

  await expect(cameraThumbnails(viewer)).toHaveAccessibleName('soggiorno, in diretta')
  await openWatchers(camera)
  await expect(watchers(camera)).toHaveText([/^Andrea /])

  await viewer.getByRole('button', { name: 'Esci' }).click()

  await expect(viewer).toHaveURL('/')
  await expect(watchers(camera)).toHaveCount(0)
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
