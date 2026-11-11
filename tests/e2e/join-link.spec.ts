import type { Page } from '@playwright/test'
import { expect } from '@playwright/test'
import { createRoom, enter, joinAsCamera, members, next, openCameraMenu, openDevice, openInviteSheet, test } from './devices'

async function invitationLink(camera: Page): Promise<string> {
  await openCameraMenu(camera)
  const sheet = await openInviteSheet(camera)
  return (await sheet.getByRole('status', { name: 'Link per entrare' }).textContent())!
}

test('opening the join link skips the key: three questions and the device is in', async ({ browser }) => {
  const camera = await openDevice(browser)
  await createRoom(camera, 'Casa al mare')
  await joinAsCamera(camera, 'soggiorno')
  const link = await invitationLink(camera)

  const viewer = await openDevice(browser)
  await viewer.goto(link)

  await expect(viewer).toHaveURL(new URL('/entra', link).href)
  await expect(viewer.getByText('Hai un invito per una Stanza.')).toBeVisible()
  await expect(viewer.getByText('1 di 3')).toBeVisible()
  await viewer.getByRole('button', { name: 'Guarderà la casa' }).click()
  await expect(viewer.getByText('2 di 3')).toBeVisible()
  await viewer.getByLabel('Come ti chiami?').fill('Andrea')
  await next(viewer)
  await expect(viewer.getByText('3 di 3')).toBeVisible()
  await enter(viewer)
  await expect(members(viewer)).toHaveCount(2)
})

test('a link with a key that no longer works leads to the key question, with the link\'s key to correct', async ({ browser }) => {
  const viewer = await openDevice(browser)
  await viewer.goto('/entra#abaco-abete-abisso-zuppa')

  await viewer.getByRole('button', { name: 'Guarderà la casa' }).click()
  await viewer.getByLabel('Come ti chiami?').fill('Andrea')
  await next(viewer)
  await enter(viewer)

  await expect(viewer.getByRole('alert')).toHaveText('Chiave non valida')
  await expect(viewer.getByText('2 di 4')).toBeVisible()
  await expect(viewer.getByLabel('Hai la Chiave della Stanza?')).toHaveValue('abaco-abete-abisso-zuppa')
})

test('going back after opening the join link does not bring the key back', async ({ browser }) => {
  const camera = await openDevice(browser)
  const key = await createRoom(camera, 'Casa al mare')
  await joinAsCamera(camera, 'soggiorno')
  const link = await invitationLink(camera)

  const viewer = await openDevice(browser)
  await viewer.goto('/')
  await viewer.goto(link)
  await expect(viewer).toHaveURL(new URL('/entra', link).href)

  await viewer.goBack()

  await expect(viewer).toHaveURL(new URL('/', link).href)
  expect(viewer.url()).not.toContain(key)
})
