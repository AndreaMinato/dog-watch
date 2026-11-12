import type { Browser, BrowserContextOptions, Page } from '@playwright/test'
import { devices, expect } from '@playwright/test'
import { offerToInstall, openDevice, test } from './devices'

const shareSteps = 'Per installare l\'app tocca Condividi, poi Aggiungi alla schermata Home.'
const installedCameraNeedsIos184 = 'Con l\'app installata su iPhone o iPad serve iOS 18.4 o successivo, perché lo schermo resti acceso.'
// Safari on the iPad says it is a Mac.
const iPad = { ...devices['Desktop Safari'], hasTouch: true }

/** Playwright cannot emulate the display mode: in a tab it is `browser`, so asked about `standalone` the page gets that answer. */
async function openInstalledApp(browser: Browser, options?: BrowserContextOptions): Promise<Page> {
  const page = await openDevice(browser, options)
  await page.addInitScript(() => {
    const matchMedia = window.matchMedia.bind(window)
    window.matchMedia = query => matchMedia(query.replaceAll('display-mode: standalone', 'display-mode: browser'))
  })
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Cosa farà questo dispositivo?', exact: true })).toBeVisible()
  return page
}

test('when the browser offers to install the app, a button opens its prompt once', async ({ browser }) => {
  const page = await openDevice(browser)
  await expect(page.getByRole('heading', { name: 'Cosa farà questo dispositivo?', exact: true })).toBeVisible()
  const install = page.getByRole('button', { name: 'Installa l\'app', exact: true })
  await expect(install).toBeHidden()

  await offerToInstall(page)
  await install.click()

  expect(await page.evaluate(() => window.installPrompts)).toBe(1)
  await expect(install).toBeHidden()
})

test('the button goes away when the app is installed from the browser menu', async ({ browser }) => {
  const page = await openDevice(browser)
  await offerToInstall(page)
  const install = page.getByRole('button', { name: 'Installa l\'app', exact: true })
  await expect(install).toBeVisible()

  await page.evaluate(() => window.dispatchEvent(new Event('appinstalled')))

  await expect(install).toBeHidden()
})

test('iPhone and iPad, which install only from Share, say how; a Mac does not', async ({ browser }) => {
  for (const device of [devices['iPhone 13 Mini'], iPad]) {
    const page = await openDevice(browser, device)
    await expect(page.getByText(shareSteps)).toBeVisible()
    await expect(page.getByText(installedCameraNeedsIos184)).toBeVisible()
  }

  const mac = await openDevice(browser, devices['Desktop Safari'])
  await expect(mac.getByRole('heading', { name: 'Cosa farà questo dispositivo?', exact: true })).toBeVisible()
  await expect(mac.getByText(shareSteps)).toBeHidden()
})

test('the installed app does not offer to install itself', async ({ browser }) => {
  const chrome = await openInstalledApp(browser)
  await offerToInstall(chrome)
  await expect(chrome.getByRole('button', { name: 'Installa l\'app', exact: true })).toBeHidden()

  const iPhone = await openInstalledApp(browser, devices['iPhone 13 Mini'])
  await expect(iPhone.getByText(shareSteps)).toBeHidden()
})
