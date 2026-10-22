import type { Browser, Page } from '@playwright/test'
import { expect } from '@playwright/test'
import { createRoom, joinAsCamera, joinAsViewer, members, openDevice, test } from './devices'

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

async function tryWrongKey(page: Page) {
  await page.getByLabel('Chiave').fill('abaco abete abisso zuppa')
  await page.getByRole('button', { name: 'Entra' }).click()
}

async function openJoinForm(browser: Browser): Promise<Page> {
  const viewer = await openDevice(browser)
  await viewer.getByRole('link', { name: 'Entra in una Stanza' }).click()
  await viewer.getByLabel('Spettatore').check()
  await viewer.getByLabel('Soprannome').fill('Andrea')
  return viewer
}

test('a wrong key is refused', async ({ browser }) => {
  const viewer = await openJoinForm(browser)

  await tryWrongKey(viewer)

  await expect(viewer.getByRole('alert')).toHaveText('Chiave non valida')
})

test('too many wrong keys ask to retry later', async ({ browser }) => {
  const viewer = await openJoinForm(browser)
  for (let attempt = 0; attempt < 10; attempt++)
    await tryWrongKey(viewer)

  await tryWrongKey(viewer)

  await expect(viewer.getByRole('alert')).toHaveText('Troppi tentativi, riprova più tardi.')
})
