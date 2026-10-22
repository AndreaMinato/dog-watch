import type { Browser, Locator, Page } from '@playwright/test'
import { expect } from '@playwright/test'

declare global {
  interface Window {
    peerConnections: RTCPeerConnection[]
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

/**
 * The local gateway is not behind Cloudflare: give each device its own client IP, as
 * Cloudflare would, so failed join attempts never pile up across tests and runs.
 */
export async function openDevice(browser: Browser): Promise<Page> {
  const context = await browser.newContext()
  await context.addInitScript(recordPeerConnections)
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
  }, { timeout: 15_000 }).toBe(true)
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
