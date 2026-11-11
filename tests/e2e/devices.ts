import type { Browser, BrowserContextOptions, Locator, Page } from '@playwright/test'
import { test as base, expect } from '@playwright/test'

declare global {
  interface Window {
    peerConnections: RTCPeerConnection[]
    wakeLocks: WakeLockSentinel[]
    installPrompts: number
  }
}

function recordPeerConnections() {
  const NativePeerConnection = window.RTCPeerConnection
  window.peerConnections = []
  window.RTCPeerConnection = class extends NativePeerConnection {
    constructor(...args: ConstructorParameters<typeof RTCPeerConnection>) {
      super(...args)
      window.peerConnections.push(this)
    }
  }
}

function recordWakeLocks() {
  const request = WakeLock.prototype.request
  window.wakeLocks = []
  WakeLock.prototype.request = async function (...args) {
    const sentinel = await request.apply(this, args)
    window.wakeLocks.push(sentinel)
    return sentinel
  }
}

/** Every test closes the devices it opened, so they never pile up within a worker. */
export const test = base.extend<{ closeDevices: void }>({
  closeDevices: [async ({ browser }, use) => {
    await use()
    await Promise.all(browser.contexts().map(context => context.close()))
  }, { auto: true }],
})

/**
 * The local gateway is not behind Cloudflare: give each device its own client IP, as
 * Cloudflare would, so failed join attempts never pile up across tests and runs.
 */
export async function openDevice(browser: Browser, options: BrowserContextOptions = {}): Promise<Page> {
  const context = await browser.newContext({ permissions: ['screen-wake-lock'], ...options })
  await context.addInitScript(recordPeerConnections)
  await context.addInitScript(recordWakeLocks)
  const ip = Array.from(crypto.getRandomValues(new Uint8Array(4))).join('.')
  await context.route('**/functions/v1/**', route =>
    route.continue({ headers: { ...route.request().headers(), 'cf-connecting-ip': ip } }))
  const page = await context.newPage()
  await page.goto('/')
  return page
}

export function next(page: Page): Promise<void> {
  return page.getByRole('button', { name: 'Avanti', exact: true }).click()
}

/** From the first question, as a future camera: returns the key of the new room, shown in words. */
export async function createRoom(page: Page, name: string): Promise<string> {
  await page.getByRole('button', { name: 'Farà da telecamera' }).click()
  await page.getByRole('button', { name: 'Non ce l\'ho: crea una Stanza nuova' }).click()
  await page.getByLabel('Come si chiama la Stanza?').fill(name)
  await page.getByRole('button', { name: 'Crea', exact: true }).click()
  const words = page.getByRole('list', { name: 'Chiave della Stanza' }).getByRole('listitem')
  await expect(words).toHaveCount(4)
  const key = (await words.allTextContents()).map(word => word.trim()).join('-')
  expect(key).toMatch(/^[a-z]+(?:-[a-z]+){3}$/)
  return key
}

/** Without an animal, the device enters with the one proposed. */
export async function enter(page: Page, animal?: string): Promise<void> {
  if (animal)
    await page.getByRole('radio', { name: animal, exact: true }).check()
  await page.getByRole('button', { name: 'Entra', exact: true }).click()
}

/** Goes on from the key just shown by createRoom. */
export async function joinAsCamera(page: Page, name: string, animal?: string): Promise<void> {
  await next(page)
  await page.getByLabel('Che stanza riprende?').fill(name)
  await next(page)
  await enter(page, animal)
}

export async function joinAsCameraWithKey(page: Page, key: string, name: string): Promise<void> {
  await page.getByRole('button', { name: 'Farà da telecamera' }).click()
  await page.getByLabel('Hai la Chiave della Stanza?').fill(key)
  await next(page)
  await page.getByLabel('Che stanza riprende?').fill(name)
  await next(page)
  await enter(page)
}

export async function joinAsViewer(page: Page, key: string, nickname: string, animal?: string): Promise<void> {
  await page.getByRole('button', { name: 'Guarderà la casa' }).click()
  await page.getByLabel('Hai la Chiave della Stanza?').fill(key)
  await next(page)
  await page.getByLabel('Come ti chiami?').fill(nickname)
  await next(page)
  await enter(page, animal)
}

export function members(page: Page) {
  return page.getByRole('list', { name: 'Nella Stanza' }).getByRole('listitem')
}

/** What a viewer sees of the cameras: a thumbnail each, named after the camera and its state ("soggiorno, in diretta"). */
export function cameraThumbnails(page: Page) {
  return page.getByRole('list', { name: 'Telecamere' }).getByRole('button')
}

/** Chromium offers to install the app with this event; each call of its `prompt()` is counted in `installPrompts`. */
export async function offerToInstall(page: Page): Promise<void> {
  await page.evaluate(() => {
    window.installPrompts = 0
    window.dispatchEvent(Object.assign(new Event('beforeinstallprompt', { cancelable: true }), {
      prompt: async () => {
        window.installPrompts++
      },
    }))
  })
}

export async function openInviteSheet(page: Page): Promise<Locator> {
  await page.getByRole('button', { name: 'Invita qualcuno' }).click()
  const sheet = page.getByRole('dialog', { name: 'Invita qualcuno' })
  await expect(sheet).toBeVisible()
  return sheet
}

function captureFrame(video: Locator): Promise<string> {
  return video.evaluate((element: HTMLVideoElement) => {
    const canvas = document.createElement('canvas')
    canvas.width = 160
    canvas.height = 90
    canvas.getContext('2d')!.drawImage(element, 0, 0, canvas.width, canvas.height)
    return canvas.toDataURL()
  })
}

export async function expectAdvancingVideo(video: Locator): Promise<void> {
  await expect(video).toBeVisible()
  await expect.poll(async () => {
    const before = await captureFrame(video)
    await video.page().waitForTimeout(300)
    return before !== await captureFrame(video)
  }).toBe(true)
}

export function openPeerConnections(page: Page): Promise<number> {
  return page.evaluate(() => window.peerConnections.filter(connection => connection.connectionState !== 'closed').length)
}

export function videoSenderMaxBitrate(page: Page): Promise<number | undefined> {
  return page.evaluate(() => window.peerConnections
    .flatMap(connection => connection.getSenders())
    .find(sender => sender.track?.kind === 'video')
    ?.getParameters()
    .encodings[0]
    ?.maxBitrate)
}

export function heldWakeLocks(page: Page): Promise<number> {
  return page.evaluate(() => window.wakeLocks.filter(sentinel => !sentinel.released).length)
}

export function releaseWakeLocks(page: Page): Promise<void> {
  return page.evaluate(async () => {
    await Promise.all(window.wakeLocks.map(sentinel => sentinel.release()))
  })
}

/** Headless pages are always visible: fake the visibility a phone goes through when it sleeps and wakes. */
export async function setVisibility(page: Page, state: DocumentVisibilityState): Promise<void> {
  await page.evaluate((visibilityState) => {
    Object.defineProperty(document, 'visibilityState', { value: visibilityState, configurable: true })
    document.dispatchEvent(new Event('visibilitychange'))
  }, state)
}

export async function hideAndShow(page: Page): Promise<void> {
  await setVisibility(page, 'hidden')
  await setVisibility(page, 'visible')
}

export async function expectFrozenVideo(video: Locator): Promise<void> {
  await expect.poll(async () => {
    const before = await captureFrame(video)
    await video.page().waitForTimeout(1_000)
    return before === await captureFrame(video)
  }).toBe(true)
}
