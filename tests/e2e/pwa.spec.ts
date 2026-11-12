import { expect } from '@playwright/test'
import { createRoom, openDevice, pngSize, test } from './devices'

interface ManifestIcon { src: string, sizes: string, purpose?: string }

test('the manifest is linked and has what installing the app needs', async ({ page }) => {
  await page.goto('/')

  const href = await page.locator('link[rel="manifest"]').getAttribute('href')
  const manifestUrl = new URL(href!, page.url()).href
  const manifest = await (await page.request.get(manifestUrl)).json()
  expect(manifest).toMatchObject({
    name: 'Veglia',
    short_name: 'Veglia',
    lang: 'it',
    display: 'standalone',
    start_url: '/',
    scope: '/',
    background_color: '#cbdac6',
    theme_color: '#cbdac6',
  })

  const icons = await Promise.all((manifest.icons as ManifestIcon[]).map(async icon =>
    `${icon.purpose ?? 'any'} ${icon.sizes} ${await pngSize(page, new URL(icon.src, manifestUrl).href)}`))
  expect(icons.sort()).toEqual([
    'any 192x192 192x192',
    'any 512x512 512x512',
    'maskable 192x192 192x192',
    'maskable 512x512 512x512',
  ])
})

test('the app opens without a network, with its fonts, and leaves every Supabase call to the network', async ({ browser }) => {
  const page = await openDevice(browser)
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready
    if (!navigator.serviceWorker.controller)
      await new Promise(resolve => navigator.serviceWorker.addEventListener('controllerchange', resolve, { once: true }))
  })

  const appOrigin = new URL(page.url()).origin
  const supabaseAnsweredByServiceWorker: boolean[] = []
  page.on('response', (response) => {
    if (new URL(response.url()).origin !== appOrigin)
      supabaseAnsweredByServiceWorker.push(response.fromServiceWorker())
  })
  await createRoom(page, 'Casa al mare')
  expect(supabaseAnsweredByServiceWorker).not.toEqual([])
  expect(supabaseAnsweredByServiceWorker).not.toContain(true)

  await page.context().setOffline(true)
  await page.reload()

  await expect(page.getByText('Veglia', { exact: true })).toBeVisible()
  const loadedFamilies = await page.evaluate(async () => {
    await document.fonts.ready
    return [...document.fonts].filter(font => font.status === 'loaded').map(font => font.family.replaceAll('"', ''))
  })
  expect(loadedFamilies).toEqual(expect.arrayContaining(['Young Serif', 'Atkinson Hyperlegible']))
})
