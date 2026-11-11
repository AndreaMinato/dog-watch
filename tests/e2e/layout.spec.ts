import type { Locator, Page } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { devices, expect } from '@playwright/test'
import { cameraThumbnails, createRoom, enter, expectAdvancingVideo, joinAsCamera, joinAsCameraWithKey, joinAsViewer, next, offerToInstall, openCameraMenu, openDevice, openInviteSheet, openWatchers, rotateKey, test, watchers } from './devices'

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

/** Every control reached with Tab, from the top of the page or of the open dialog, shows a solid outline. */
async function expectVisibleFocus(page: Page) {
  // A click outside an open dialog would close it.
  const dialog = page.getByRole('dialog')
  const box = await dialog.isVisible() ? await dialog.boundingBox() : null
  await page.mouse.click(box ? box.x + box.width / 2 : 1, box ? box.y + 1 : 1)
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

/** On the phone a sheet rises from the bottom edge; on wider screens it is a dialog in the middle. */
async function expectPlacedForTheScreen(sheet: Locator) {
  const { width, height } = sheet.page().viewportSize()!
  const box = (await sheet.boundingBox())!
  if (test.info().project.name === 'phone') {
    expect(box.width).toBe(width)
    expect(box.y + box.height).toBeCloseTo(height, 0)
  }
  else {
    expect(box.x + box.width / 2).toBeCloseTo(width / 2, 0)
    expect(box.y + box.height / 2).toBeCloseTo(height / 2, 0)
  }
}

/** On the phone the thumbnails sit below the big video; on wider screens, in a column on its right. */
async function expectThumbnailsPlacedForTheScreen(page: Page) {
  const video = (await page.getByRole('region', { name: 'soggiorno' }).boundingBox())!
  const thumbnails = (await page.getByRole('list', { name: 'Telecamere' }).boundingBox())!
  if (test.info().project.name === 'phone')
    expect(thumbnails.y).toBeGreaterThanOrEqual(video.y + video.height)
  else
    expect(thumbnails.x).toBeGreaterThanOrEqual(video.x + video.width)
}

for (const colorScheme of ['light', 'dark'] as const) {
  test.describe(`${colorScheme} scheme`, () => {
    test.use({ colorScheme })

    test('the page takes the palette of the scheme', async ({ browser }) => {
      const page = await openDevice(browser)

      await expect(page.locator('body')).toHaveCSS('background-color', palettes[colorScheme].background)
      await expect(page.locator('body')).toHaveCSS('color', palettes[colorScheme].text)
    })

    test('each question of a new camera is usable on this screen', async ({ browser }) => {
      const page = await openDevice(browser)
      await expect(page.getByRole('heading', { name: 'Cosa farà questo dispositivo?' })).toBeVisible()
      await expectUsable(page)

      await page.getByRole('button', { name: 'Farà da telecamera' }).click()
      await expect(page.getByRole('button', { name: 'Non ce l\'ho: crea una Stanza nuova' })).toBeVisible()
      await expectUsable(page)

      await page.getByRole('button', { name: 'Non ce l\'ho: crea una Stanza nuova' }).click()
      await expect(page.getByLabel('Come si chiama la Stanza?')).toBeVisible()
      await expectUsable(page)

      await page.getByLabel('Come si chiama la Stanza?').fill('Casa al mare')
      await page.getByRole('button', { name: 'Crea', exact: true }).click()
      await expect(page.getByRole('list', { name: 'Chiave della Stanza' })).toBeVisible()
      await expectUsable(page)

      await next(page)
      await expect(page.getByRole('button', { name: 'Camera da letto' })).toBeVisible()
      await expectUsable(page)

      await page.getByRole('button', { name: 'Camera da letto' }).click()
      await next(page)
      await expect(page.getByRole('group', { name: 'Scegli il tuo animale' })).toBeVisible()
      await expectUsable(page)
    })

    test('each question of an invited viewer, and a refused key, are usable on this screen', async ({ browser }) => {
      const page = await openDevice(browser)
      await page.goto('/entra#abaco-abete-abisso-zuppa&Casa%20al%20mare')
      await expect(page.getByText('Hai un invito per Casa al mare.')).toBeVisible()
      await expectUsable(page)

      await page.getByRole('button', { name: 'Guarderà la casa' }).click()
      await expect(page.getByLabel('Come ti chiami?')).toBeVisible()
      await expectUsable(page)

      await page.getByLabel('Come ti chiami?').fill('Andrea')
      await next(page)
      await expect(page.getByRole('group', { name: 'Scegli il tuo animale' })).toBeVisible()
      await expectUsable(page)

      await enter(page)
      await expect(page.getByRole('alert')).toHaveText('Chiave non valida')
      await expectUsable(page)
    })

    test('the recent rooms, one asking for the new key, and the questions they open are usable on this screen', async ({ browser }) => {
      const page = await openDevice(browser)
      await createRoom(page, 'Casa al mare')
      await joinAsCamera(page, 'soggiorno')
      await (await openCameraMenu(page)).getByRole('button', { name: 'Esci' }).click()
      await expect(page.getByRole('heading', { name: 'Le tue Stanze' })).toBeVisible()
      await expectUsable(page)

      await page.route('**/functions/v1/join-room', route => route.fulfill({ status: 403 }))
      await page.getByRole('button', { name: 'Casa al mare', exact: true }).click()
      await expect(page.getByLabel('Chiave nuova')).toBeVisible()
      await expectUsable(page)

      await page.getByRole('button', { name: 'Usa questo dispositivo in un\'altra Stanza' }).click()
      await expect(page.getByRole('button', { name: 'Le tue Stanze' })).toBeVisible()
      await expectUsable(page)
    })

    test('the button and the steps to install the app are usable on this screen', async ({ browser }) => {
      const page = await openDevice(browser)
      await offerToInstall(page)
      await expect(page.getByRole('button', { name: 'Installa l\'app' })).toBeVisible()
      await expectUsable(page)

      const iPhone = await openDevice(browser, { userAgent: devices['iPhone 13 Mini'].userAgent })
      await expect(iPhone.getByText('Per installare l\'app tocca Condividi, poi Aggiungi alla schermata Home.')).toBeVisible()
      await expectUsable(iPhone)
    })

    test('the message without a connection is usable on this screen', async ({ page }) => {
      await page.route('**/auth/v1/**', route => route.abort('internetdisconnected'))
      await page.goto('/')
      await expect(page.getByRole('heading', { name: 'Impossibile collegarsi' })).toBeVisible()
      await expectUsable(page)
    })

    test('the camera is usable on this screen', async ({ browser }) => {
      const camera = await openDevice(browser)
      await createRoom(camera, 'Casa al mare')
      await joinAsCamera(camera, 'soggiorno')
      await expectAdvancingVideo(camera.getByLabel('Anteprima'))
      await expectUsable(camera)
    })

    test('the viewer is usable on this screen, its thumbnails below the big video on the phone and on its right on wider screens', async ({ browser }) => {
      const host = await openDevice(browser)
      const key = await createRoom(host, 'Casa al mare')
      const viewer = await openDevice(browser)
      await joinAsViewer(viewer, key, 'Andrea')
      await expect(viewer.getByRole('heading', { name: 'Qui non c\'è ancora nessuna telecamera' })).toBeVisible()
      await expectUsable(viewer)

      await joinAsCamera(host, 'soggiorno')
      for (const name of ['cucina', 'studio'])
        await joinAsCameraWithKey(await openDevice(browser), key, name)

      await expect(cameraThumbnails(viewer)).toHaveCount(3)
      for (const thumbnail of await cameraThumbnails(viewer).all())
        await expect(thumbnail).toHaveAccessibleName(/, in diretta$/)
      await expectUsable(viewer)
      await expectThumbnailsPlacedForTheScreen(viewer)
    })

    test('a camera that dropped out, its animal asleep, is usable on this screen', async ({ browser }) => {
      const camera = await openDevice(browser)
      const key = await createRoom(camera, 'Casa al mare')
      await joinAsCamera(camera, 'soggiorno')
      const viewer = await openDevice(browser)
      await joinAsViewer(viewer, key, 'Andrea')
      await expect(viewer.getByLabel('Telecamera soggiorno')).toBeVisible()

      await camera.close()

      await expect(viewer.getByRole('region', { name: 'soggiorno' }).getByRole('img', { name: /seduto che dorme$/ })).toBeVisible()
      expect(await viewer.evaluate(() => document.getAnimations().length)).toBeGreaterThan(0)
      await expectUsable(viewer)
    })

    test('the invite sheet is usable on this screen', async ({ browser }) => {
      const camera = await openDevice(browser)
      // Phones and tablets offer a system share sheet, which brings "Condividi il link".
      await camera.addInitScript(() => {
        Object.defineProperty(navigator, 'share', { value: async () => {} })
      })
      await camera.reload()
      await createRoom(camera, 'Casa al mare')
      await joinAsCamera(camera, 'soggiorno')
      await openCameraMenu(camera)
      const sheet = await openInviteSheet(camera)
      await expect(sheet.getByRole('button', { name: 'Condividi il link' })).toBeVisible()

      await expectUsable(camera)
      await expect(sheet).toBeVisible()
      await expectPlacedForTheScreen(sheet)
    })

    test('the camera screen, "Stanno guardando" and the menu are usable on this screen', async ({ browser }) => {
      const camera = await openDevice(browser)
      const key = await createRoom(camera, 'Casa al mare')
      await joinAsCamera(camera, 'soggiorno')
      await joinAsViewer(await openDevice(browser), key, 'Andrea')
      await expect(camera.getByRole('button', { name: '1 persona guarda' })).toBeVisible()
      await expectAdvancingVideo(camera.getByLabel('Anteprima'))
      await expectUsable(camera)

      const watching = await openWatchers(camera)
      await expect(watchers(camera)).toHaveCount(1)
      await expectUsable(camera)
      await expect(watching).toBeVisible()
      await expectPlacedForTheScreen(watching)
      await watching.getByRole('button', { name: 'Chiudi', exact: true }).click()

      await rotateKey(camera)
      await expectUsable(camera)
      await watching.getByRole('button', { name: 'Chiudi', exact: true }).click()

      const menu = await openCameraMenu(camera)
      await expectUsable(camera)
      await expect(menu).toBeVisible()
      await expectPlacedForTheScreen(menu)
    })

    test('the rest screen stays black', async ({ browser }) => {
      const camera = await openDevice(browser)
      await createRoom(camera, 'Casa al mare')
      await joinAsCamera(camera, 'soggiorno')
      await camera.getByRole('button', { name: 'Oscura lo schermo' }).click()

      await expect(camera.getByRole('region', { name: 'Schermata a riposo' })).toHaveCSS('background-color', 'rgb(0, 0, 0)')
      await expectReadable(camera)
    })
  })
}
