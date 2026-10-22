import type { Browser, Page } from '@playwright/test'
import { expect, test } from '@playwright/test'

async function openDevice(browser: Browser): Promise<Page> {
  const context = await browser.newContext()
  const page = await context.newPage()
  await page.goto('/')
  return page
}

async function createRoom(page: Page, name: string): Promise<string> {
  await page.getByRole('link', { name: 'Crea una Stanza' }).click()
  await page.getByLabel('Nome della Stanza').fill(name)
  await page.getByRole('button', { name: 'Crea' }).click()
  const key = page.getByRole('status', { name: 'Chiave della Stanza' })
  await expect(key).toHaveText(/^[a-z]+(?:-[a-z]+){3}$/)
  return (await key.textContent())!
}

function members(page: Page) {
  return page.getByRole('list', { name: 'Nella Stanza' }).getByRole('listitem')
}

test('a camera and a viewer join the same room and see each other', async ({ browser }) => {
  const camera = await openDevice(browser)
  const key = await createRoom(camera, 'Casa al mare')
  await camera.getByLabel('Camera').check()
  await camera.getByLabel('Nome della Camera').fill('soggiorno')
  await camera.getByRole('button', { name: 'Entra' }).click()

  const viewer = await openDevice(browser)
  await viewer.getByRole('link', { name: 'Entra in una Stanza' }).click()
  await viewer.getByLabel('Chiave').fill(key.toUpperCase().replaceAll('-', ' '))
  await viewer.getByLabel('Spettatore').check()
  await viewer.getByLabel('Soprannome').fill('Andrea')
  await viewer.getByRole('button', { name: 'Entra' }).click()

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
  await viewer.getByRole('link', { name: 'Entra in una Stanza' }).click()
  await viewer.getByLabel('Chiave').fill('abaco abete abisso zuppa')
  await viewer.getByLabel('Spettatore').check()
  await viewer.getByLabel('Soprannome').fill('Andrea')
  await viewer.getByRole('button', { name: 'Entra' }).click()

  await expect(viewer.getByRole('alert')).toHaveText('Chiave non valida')
})
