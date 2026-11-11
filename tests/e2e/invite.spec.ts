import type { Locator } from '@playwright/test'
import { expect } from '@playwright/test'
import jsQR from 'jsqr'
import { PNG } from 'pngjs'
import { createRoom, joinAsCamera, joinAsViewer, members, openCameraMenu, openDevice, openInviteSheet, test } from './devices'

declare global {
  interface Window {
    shared?: ShareData
  }
}

async function decodeQr(sheet: Locator): Promise<string | undefined> {
  const png = PNG.sync.read(await sheet.getByRole('img', { name: 'QR del link' }).screenshot())
  return jsQR(new Uint8ClampedArray(png.data), png.width, png.height)?.data
}

async function expectInvitationTo(sheet: Locator, key: string) {
  const link = new URL((await sheet.getByRole('status', { name: 'Link per entrare' }).textContent())!)
  expect(link.pathname).toBe('/entra')
  expect(link.hash).toBe(`#${key}`)
  expect(await decodeQr(sheet)).toBe(link.href)
  await expect(sheet.getByRole('list', { name: 'Chiave della Stanza' }).getByRole('listitem')).toHaveText(key.split('-'))
}

test('the camera invites with the link, its QR and the key in words', async ({ browser }) => {
  const camera = await openDevice(browser)
  const key = await createRoom(camera, 'Casa al mare')
  await joinAsCamera(camera, 'soggiorno')

  await openCameraMenu(camera)
  await expectInvitationTo(await openInviteSheet(camera), key)
})

test('the viewer invites with the same sheet', async ({ browser }) => {
  const camera = await openDevice(browser)
  const key = await createRoom(camera, 'Casa al mare')
  await joinAsCamera(camera, 'soggiorno')
  const viewer = await openDevice(browser)
  await joinAsViewer(viewer, key, 'Andrea')
  await expect(members(viewer)).toHaveCount(2)

  await expectInvitationTo(await openInviteSheet(viewer), key)
})

test('the sheet closes with Chiudi, Esc or a tap outside, giving the focus back to the camera menu', async ({ browser }) => {
  const camera = await openDevice(browser)
  await createRoom(camera, 'Casa al mare')
  await joinAsCamera(camera, 'soggiorno')
  const opener = camera.getByRole('button', { name: 'Menu', exact: true })

  const closings = [
    (sheet: Locator) => sheet.getByRole('button', { name: 'Chiudi', exact: true }).click(),
    () => camera.keyboard.press('Escape'),
    () => camera.mouse.click(5, 5),
  ]
  for (const close of closings) {
    await openCameraMenu(camera)
    const sheet = await openInviteSheet(camera)
    await close(sheet)
    await expect(sheet).toBeHidden()
    await expect(opener).toBeFocused()
  }
})

test('"Copia il link" copies the link and says so', async ({ browser }) => {
  const camera = await openDevice(browser, { permissions: ['clipboard-read', 'clipboard-write', 'screen-wake-lock'] })
  await createRoom(camera, 'Casa al mare')
  await joinAsCamera(camera, 'soggiorno')
  await openCameraMenu(camera)
  const sheet = await openInviteSheet(camera)

  await sheet.getByRole('button', { name: 'Copia il link' }).click()

  await expect(sheet.getByText('Link copiato')).toBeVisible()
  expect(await camera.evaluate(() => navigator.clipboard.readText()))
    .toBe(await sheet.getByRole('status', { name: 'Link per entrare' }).textContent())
})

test('"Condividi il link" hands the link to the system share sheet', async ({ browser }) => {
  const camera = await openDevice(browser)
  await camera.addInitScript(() => {
    Object.defineProperty(navigator, 'share', { value: async (data: ShareData) => {
      window.shared = data
    } })
  })
  await camera.reload()
  await createRoom(camera, 'Casa al mare')
  await joinAsCamera(camera, 'soggiorno')
  await openCameraMenu(camera)
  const sheet = await openInviteSheet(camera)

  await sheet.getByRole('button', { name: 'Condividi il link' }).click()

  await expect.poll(() => camera.evaluate(() => window.shared?.url))
    .toBe(await sheet.getByRole('status', { name: 'Link per entrare' }).textContent())
})

test('without a system share sheet the link can only be copied', async ({ browser }) => {
  const camera = await openDevice(browser)
  await camera.addInitScript(() => {
    delete (Navigator.prototype as Partial<Navigator>).share
  })
  await camera.reload()
  await createRoom(camera, 'Casa al mare')
  await joinAsCamera(camera, 'soggiorno')
  await openCameraMenu(camera)
  const sheet = await openInviteSheet(camera)

  await expect(sheet.getByRole('button', { name: 'Copia il link' })).toBeVisible()
  await expect(sheet.getByRole('button', { name: 'Condividi il link' })).toHaveCount(0)
})
