import type { Page } from '@playwright/test'
import { expect } from '@playwright/test'
import { createRoom, joinAsCamera, members, openDevice, openInviteSheet, test } from './devices'

async function invitationLink(camera: Page): Promise<string> {
  const sheet = await openInviteSheet(camera)
  return (await sheet.getByRole('status', { name: 'Link per entrare' }).textContent())!
}

test('opening the join link asks only for role and name', async ({ browser }) => {
  const camera = await openDevice(browser)
  await createRoom(camera, 'Casa al mare')
  await joinAsCamera(camera, 'soggiorno')
  const link = await invitationLink(camera)

  const viewer = await openDevice(browser)
  await viewer.goto(link)

  await expect(viewer.getByRole('heading', { name: 'Entra in una Stanza' })).toBeVisible()
  await expect(viewer).toHaveURL(new URL('/entra', link).href)
  await expect(viewer.getByLabel('Chiave')).toHaveCount(0)
  await viewer.getByLabel('Spettatore').check()
  await viewer.getByLabel('Soprannome').fill('Andrea')
  await viewer.getByRole('button', { name: 'Entra' }).click()
  await expect(members(viewer)).toHaveCount(2)
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
