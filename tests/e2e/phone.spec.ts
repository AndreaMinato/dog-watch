import type { Page } from '@playwright/test'
import { expect } from '@playwright/test'
import { createRoom, joinAsCamera, joinAsViewer, members, openDevice, test } from './devices'

const MIN_TOUCH_TARGET = 44

async function expectFitsThePhone(page: Page) {
  await expect.poll(() => page.evaluate(() =>
    document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBe(0)

  const tooSmall = await page
    .locator('button, a, input:not([type=radio]), select, label:has(> input[type=radio])')
    .evaluateAll((elements, min) => elements
      .filter(element => element.checkVisibility())
      .map((element) => {
        const { width, height } = element.getBoundingClientRect()
        return { target: element.textContent?.trim() || element.outerHTML, width, height }
      })
      .filter(({ width, height }) => width < min || height < min), MIN_TOUCH_TARGET)
  expect(tooSmall).toEqual([])
}

test('home, create and join fit the phone screen', async ({ browser }) => {
  const page = await openDevice(browser)
  await expectFitsThePhone(page)

  await createRoom(page, 'Casa al mare')
  await expectFitsThePhone(page)

  await page.goto('/entra')
  await expect(page.getByLabel('Chiave')).toBeVisible()
  await expectFitsThePhone(page)
})

test('camera and viewer fit the phone screen', async ({ browser }) => {
  const camera = await openDevice(browser)
  const key = await createRoom(camera, 'Casa al mare')
  await joinAsCamera(camera, 'soggiorno')
  await expect(camera.getByRole('button', { name: 'Metti in pausa' })).toBeVisible()
  await camera.getByRole('button', { name: 'Mostra link e QR' }).click()
  await expect(camera.getByRole('img', { name: 'QR del link' })).toBeVisible()
  await expectFitsThePhone(camera)

  const viewer = await openDevice(browser)
  await joinAsViewer(viewer, key, 'Andrea')
  await expect(members(viewer)).toHaveCount(2)
  const feed = viewer.getByLabel('Camera soggiorno')
  await expect(feed).toBeVisible()
  await expectFitsThePhone(viewer)

  await feed.click()
  await expect(viewer.getByRole('button', { name: 'Torna alla griglia' })).toBeVisible()
  await expectFitsThePhone(viewer)
})

test('the rest screen stays black in both color schemes', async ({ browser }) => {
  const camera = await openDevice(browser)
  await createRoom(camera, 'Casa al mare')
  await joinAsCamera(camera, 'soggiorno')
  await camera.getByRole('button', { name: 'Schermata a riposo' }).click()
  const rest = camera.getByRole('region', { name: 'Schermata a riposo' })

  for (const colorScheme of ['light', 'dark'] as const) {
    await camera.emulateMedia({ colorScheme })
    await expect(rest).toHaveCSS('background-color', 'rgb(0, 0, 0)')
  }
})
