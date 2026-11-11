import type { Page } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { expect } from '@playwright/test'
import { createRoom, joinAsCamera, joinAsViewer, members, openDevice, test } from './devices'

const MIN_TOUCH_TARGET = 44

const palettes = {
  light: { background: 'rgb(203, 218, 198)', text: 'rgb(38, 48, 92)' },
  dark: { background: 'rgb(27, 34, 73)', text: 'rgb(238, 241, 232)' },
}

/** WCAG 2.2 AA contrast for every text on the screen. */
async function expectReadable(page: Page) {
  const { violations } = await new AxeBuilder({ page }).withRules(['color-contrast']).analyze()
  expect(violations.flatMap(violation => violation.nodes.map(node => `${node.target.join(' ')}: ${node.failureSummary}`))).toEqual([])
}

/** Every control reached with Tab, from the top of the page, shows a solid outline. */
async function expectVisibleFocus(page: Page) {
  await page.mouse.click(1, 1)
  const withoutOutline: string[] = []
  for (let tabs = 0; tabs < 50; tabs++) {
    await page.keyboard.press('Tab')
    const focused = await page.evaluate(() => {
      const element = document.activeElement
      if (!element || element === document.body)
        return null
      const { outlineStyle, outlineWidth } = getComputedStyle(element)
      return { target: element.textContent?.trim() || element.outerHTML, outlineStyle, outlineWidth: Number.parseFloat(outlineWidth) }
    })
    if (!focused)
      break
    if (focused.outlineStyle !== 'solid' || focused.outlineWidth < 2)
      withoutOutline.push(focused.target)
  }
  expect(withoutOutline).toEqual([])
}

/** With "riduci movimento" on, nothing on the screen moves. */
async function expectStillWithReducedMotion(page: Page) {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  expect(await page.evaluate(() => document.getAnimations().map(animation =>
    animation instanceof CSSAnimation ? animation.animationName : String(animation)))).toEqual([])
  await page.emulateMedia({ reducedMotion: 'no-preference' })
}

async function expectUsable(page: Page) {
  await expectFitsTheScreen(page)
  await expectReadable(page)
  await expectVisibleFocus(page)
  await expectStillWithReducedMotion(page)
}

async function expectFitsTheScreen(page: Page) {
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

for (const colorScheme of ['light', 'dark'] as const) {
  test.describe(`${colorScheme} scheme`, () => {
    test.use({ colorScheme })

    test('the page takes the palette of the scheme', async ({ browser }) => {
      const page = await openDevice(browser)

      await expect(page.locator('body')).toHaveCSS('background-color', palettes[colorScheme].background)
      await expect(page.locator('body')).toHaveCSS('color', palettes[colorScheme].text)
    })

    test('home, create and join are usable on this screen', async ({ browser }) => {
      const page = await openDevice(browser)
      await expectUsable(page)

      await createRoom(page, 'Casa al mare')
      await expectUsable(page)

      await page.goto('/entra')
      await expect(page.getByLabel('Chiave')).toBeVisible()
      await expectUsable(page)
    })

    test('the message without a connection is usable on this screen', async ({ page }) => {
      await page.route('**/auth/v1/**', route => route.abort('internetdisconnected'))
      await page.goto('/')
      await expect(page.getByRole('heading', { name: 'Impossibile collegarsi' })).toBeVisible()
      await expectUsable(page)
    })

    test('camera and viewer are usable on this screen', async ({ browser }) => {
      const camera = await openDevice(browser)
      const key = await createRoom(camera, 'Casa al mare')
      await joinAsCamera(camera, 'soggiorno')
      await expect(camera.getByRole('button', { name: 'Metti in pausa' })).toBeVisible()
      await camera.getByRole('button', { name: 'Mostra link e QR' }).click()
      await expect(camera.getByRole('img', { name: 'QR del link' })).toBeVisible()
      await expectUsable(camera)

      const viewer = await openDevice(browser)
      await joinAsViewer(viewer, key, 'Andrea')
      await expect(members(viewer)).toHaveCount(2)
      const feed = viewer.getByLabel('Telecamera soggiorno')
      await expect(feed).toBeVisible()
      await expectUsable(viewer)

      await feed.click()
      await expect(viewer.getByRole('button', { name: 'Torna alla griglia' })).toBeVisible()
      await expectUsable(viewer)
    })

    test('the rest screen stays black', async ({ browser }) => {
      const camera = await openDevice(browser)
      await createRoom(camera, 'Casa al mare')
      await joinAsCamera(camera, 'soggiorno')
      await camera.getByRole('button', { name: 'Schermata a riposo' }).click()

      await expect(camera.getByRole('region', { name: 'Schermata a riposo' })).toHaveCSS('background-color', 'rgb(0, 0, 0)')
      await expectReadable(camera)
    })
  })
}
