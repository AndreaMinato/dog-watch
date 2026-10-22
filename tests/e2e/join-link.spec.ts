import type { Page } from '@playwright/test'
import { expect } from '@playwright/test'
import jsQR from 'jsqr'
import { PNG } from 'pngjs'
import { createRoom, joinAsCamera, members, openDevice, test } from './devices'

async function decodeQr(page: Page): Promise<string | undefined> {
  const png = PNG.sync.read(await page.getByRole('img', { name: 'QR del link' }).screenshot())
  return jsQR(new Uint8ClampedArray(png.data), png.width, png.height)?.data
}

test('the camera shows the join link and its QR only on request', async ({ browser }) => {
  const camera = await openDevice(browser)
  const key = await createRoom(camera, 'Casa al mare')
  await joinAsCamera(camera, 'soggiorno')
  const link = camera.getByLabel('Link per entrare')
  const qr = camera.getByRole('img', { name: 'QR del link' })
  await expect(members(camera)).toHaveCount(1)
  await expect(link).toBeHidden()
  await expect(qr).toBeHidden()

  await camera.getByRole('button', { name: 'Mostra link e QR' }).click()

  const shown = new URL((await link.textContent())!)
  expect(shown.hash).toBe(`#${key}`)
  expect(shown.pathname + shown.search).not.toContain(key)
  expect(await decodeQr(camera)).toBe(shown.href)

  await camera.getByRole('button', { name: 'Nascondi link e QR' }).click()

  await expect(link).toBeHidden()
  await expect(qr).toBeHidden()
})

test('opening the join link asks only for role and name', async ({ browser }) => {
  const camera = await openDevice(browser)
  await createRoom(camera, 'Casa al mare')
  await joinAsCamera(camera, 'soggiorno')
  await camera.getByRole('button', { name: 'Mostra link e QR' }).click()
  const link = (await camera.getByLabel('Link per entrare').textContent())!

  const viewer = await openDevice(browser)
  await viewer.goto(link)

  await expect(viewer.getByRole('heading', { name: 'Entra in una Stanza' })).toBeVisible()
  await expect(viewer.getByLabel('Chiave')).toHaveCount(0)
  await viewer.getByLabel('Spettatore').check()
  await viewer.getByLabel('Soprannome').fill('Andrea')
  await viewer.getByRole('button', { name: 'Entra' }).click()
  await expect(members(viewer)).toHaveCount(2)
})
