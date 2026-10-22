import type { Browser, BrowserContextOptions, Locator, Page } from '@playwright/test'
import { test as base, expect } from '@playwright/test'

declare global {
  interface Window {
    peerConnections: RTCPeerConnection[]
    wakeLocks: WakeLockSentinel[]
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
export async function openDevice(browser: Browser, storageState?: BrowserContextOptions['storageState']): Promise<Page> {
  const context = await browser.newContext({ permissions: ['screen-wake-lock'], storageState })
  await context.addInitScript(recordPeerConnections)
  await context.addInitScript(recordWakeLocks)
  const ip = Array.from(crypto.getRandomValues(new Uint8Array(4))).join('.')
  await context.route('**/functions/v1/**', route =>
    route.continue({ headers: { ...route.request().headers(), 'cf-connecting-ip': ip } }))
  const page = await context.newPage()
  await page.goto('/')
  return page
}

export async function createRoom(page: Page, name: string): Promise<string> {
  await page.getByRole('link', { name: 'Crea una Stanza' }).click()
  await page.getByLabel('Nome della Stanza').fill(name)
  await page.getByRole('button', { name: 'Crea' }).click()
  const key = page.getByRole('status', { name: 'Chiave della Stanza' })
  await expect(key).toHaveText(/^[a-z]+(?:-[a-z]+){3}$/)
  return (await key.textContent())!
}

export async function joinAsCamera(page: Page, name: string): Promise<void> {
  await page.getByLabel('Camera').check()
  await page.getByLabel('Nome della Camera').fill(name)
  await page.getByRole('button', { name: 'Entra' }).click()
}

export async function joinAsCameraWithKey(page: Page, key: string, name: string): Promise<void> {
  await page.getByRole('link', { name: 'Entra in una Stanza' }).click()
  await page.getByLabel('Chiave').fill(key)
  await joinAsCamera(page, name)
}

export async function joinAsViewer(page: Page, key: string, nickname: string): Promise<void> {
  await page.getByRole('link', { name: 'Entra in una Stanza' }).click()
  await page.getByLabel('Chiave').fill(key)
  await page.getByLabel('Spettatore').check()
  await page.getByLabel('Soprannome').fill(nickname)
  await page.getByRole('button', { name: 'Entra' }).click()
}

export function members(page: Page) {
  return page.getByRole('list', { name: 'Nella Stanza' }).getByRole('listitem')
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
export async function hideAndShow(page: Page): Promise<void> {
  for (const state of ['hidden', 'visible']) {
    await page.evaluate((visibilityState) => {
      Object.defineProperty(document, 'visibilityState', { value: visibilityState, configurable: true })
      document.dispatchEvent(new Event('visibilitychange'))
    }, state)
  }
}

export async function expectFrozenVideo(video: Locator): Promise<void> {
  await expect.poll(async () => {
    const before = await captureFrame(video)
    await video.page().waitForTimeout(1_000)
    return before === await captureFrame(video)
  }).toBe(true)
}
