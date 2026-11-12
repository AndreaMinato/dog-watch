import type { Page } from '@playwright/test'
import { expect } from '@playwright/test'
import { cameraThumbnails, createRoom, enter, joinAsCamera, next, openCameraMenu, openDevice, openInviteSheet, test } from './devices'

async function invitationLink(camera: Page): Promise<string> {
  await openCameraMenu(camera)
  const sheet = await openInviteSheet(camera)
  return (await sheet.getByRole('status', { name: 'Link per entrare', exact: true }).textContent())!
}

test('opening the join link skips the key: three questions and the device is in', async ({ browser }) => {
  const camera = await openDevice(browser)
  await createRoom(camera, 'Casa al mare')
  await joinAsCamera(camera, 'soggiorno')
  const link = await invitationLink(camera)

  const viewer = await openDevice(browser)
  await viewer.goto(link)

  await expect(viewer).toHaveURL(new URL('/entra', link).href)
  await expect(viewer.getByText('Hai un invito per Casa al mare.')).toBeVisible()
  await expect(viewer.getByText('1 di 3')).toBeVisible()
  await viewer.getByRole('button', { name: 'Guarderà la casa', exact: true }).click()
  await expect(viewer.getByText('2 di 3')).toBeVisible()
  await viewer.getByLabel('Come ti chiami?', { exact: true }).fill('Andrea')
  await next(viewer)
  await expect(viewer.getByText('3 di 3')).toBeVisible()
  await enter(viewer)
  await expect(cameraThumbnails(viewer)).toHaveCount(1)
})

test('a link shared before it carried the room name says only that there is an invitation', async ({ browser }) => {
  const camera = await openDevice(browser)
  const key = await createRoom(camera, 'Casa al mare')
  await joinAsCamera(camera, 'soggiorno')
  const viewer = await openDevice(browser)

  await viewer.goto(`/entra#${key}`)

  await expect(viewer).toHaveURL(/\/entra$/)
  await expect(viewer.getByText('Hai un invito per una Stanza.')).toBeVisible()
  await viewer.getByRole('button', { name: 'Guarderà la casa', exact: true }).click()
  await viewer.getByLabel('Come ti chiami?', { exact: true }).fill('Andrea')
  await next(viewer)
  await enter(viewer)
  await expect(viewer.getByRole('heading', { level: 1, name: 'Casa al mare', exact: true })).toBeVisible()
})

test('once in, the room goes by the name it has, not the one written in the link', async ({ browser }) => {
  const camera = await openDevice(browser)
  const key = await createRoom(camera, 'Casa al mare')
  await joinAsCamera(camera, 'soggiorno')
  const viewer = await openDevice(browser)

  await viewer.goto(`/entra#${key}&${encodeURIComponent('Casa di Marta & Luca')}`)

  await expect(viewer).toHaveURL(/\/entra$/)
  await expect(viewer.getByText('Hai un invito per Casa di Marta & Luca.')).toBeVisible()
  await viewer.getByRole('button', { name: 'Guarderà la casa', exact: true }).click()
  await viewer.getByLabel('Come ti chiami?', { exact: true }).fill('Andrea')
  await next(viewer)
  await enter(viewer)
  await expect(viewer.getByRole('heading', { level: 1, name: 'Casa al mare', exact: true })).toBeVisible()
})

test('a link with a key that no longer works leads to the key question, with the link\'s key to correct', async ({ browser }) => {
  const viewer = await openDevice(browser)
  await viewer.goto('/entra#abaco-abete-abisso-zuppa&Casa%20al%20mare')

  await viewer.getByRole('button', { name: 'Guarderà la casa', exact: true }).click()
  await viewer.getByLabel('Come ti chiami?', { exact: true }).fill('Andrea')
  await next(viewer)
  await enter(viewer)

  await expect(viewer.getByRole('alert')).toHaveText('Chiave non valida')
  await expect(viewer.getByText('2 di 4')).toBeVisible()
  await expect(viewer.getByLabel('Hai la Chiave della Stanza?', { exact: true })).toHaveValue('abaco-abete-abisso-zuppa')
})

test('going back after opening the join link brings back neither the key nor the room name', async ({ browser }) => {
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
  expect(viewer.url()).not.toContain('Casa')
})
