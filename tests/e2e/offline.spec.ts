import type { Page } from '@playwright/test'
import { expect } from '@playwright/test'
import { createRoom, joinAsCamera, joinAsViewer, openCameraMenu, openDevice, test } from './devices'

const supabase = /\/(auth|functions)\/v1\//
const unreachable = 'Veglia non riesce a raggiungere il servizio. Controlla la connessione a internet e riprova.'

/** The stored session is kept, but its access token must be renewed before the next call. */
async function expireSession(page: Page): Promise<void> {
  await page.evaluate(() => {
    const key = Object.keys(localStorage).find(name => name.endsWith('-auth-token'))!
    localStorage.setItem(key, JSON.stringify({ ...JSON.parse(localStorage.getItem(key)!), expires_at: 1 }))
  })
}

/** Renewing an expired session fails only after half a minute of retries: without one, signing in fails at once. */
async function forgetSession(page: Page): Promise<void> {
  await page.evaluate(() => {
    localStorage.removeItem(Object.keys(localStorage).find(name => name.endsWith('-auth-token'))!)
  })
}

test('without a connection the app says so, and opens once the connection is back', async ({ page }) => {
  await page.route('**/auth/v1/**', route => route.abort('internetdisconnected'))
  await page.goto('/')

  await expect(page.getByRole('heading', { name: 'Impossibile collegarsi' })).toBeVisible()
  await expect(page.getByText('Controlla la connessione a internet e riprova.')).toBeVisible()

  await page.unroute('**/auth/v1/**')
  await page.getByRole('button', { name: 'Riprova' }).click()

  await expect(page.getByRole('heading', { level: 1, name: 'Cosa farà questo dispositivo?' })).toBeVisible()
})

test('with a slow connection the app opens at once, while its session is being renewed', async ({ browser }) => {
  const page = await openDevice(browser)
  await expect(page.getByRole('heading', { name: 'Cosa farà questo dispositivo?' })).toBeVisible()
  await expireSession(page)
  await page.route('**/auth/v1/**', () => {})

  await page.reload()

  await expect(page.getByRole('heading', { name: 'Cosa farà questo dispositivo?' })).toBeVisible()
})

test('entering a room without a connection says the service cannot be reached', async ({ browser }) => {
  const page = await openDevice(browser)
  const key = await createRoom(page, 'Casa al mare')
  await joinAsCamera(page, 'soggiorno')
  await (await openCameraMenu(page)).getByRole('button', { name: 'Esci' }).click()
  await page.route(supabase, route => route.abort('internetdisconnected'))

  await page.getByRole('list', { name: 'Le tue Stanze' }).getByRole('button', { name: 'Casa al mare', exact: true }).click()
  await expect(page.getByRole('alert')).toHaveText(unreachable)

  await page.getByRole('button', { name: 'Usa questo dispositivo in un\'altra Stanza' }).click()
  await joinAsViewer(page, key, 'Andrea')
  await expect(page.getByRole('alert')).toHaveText(unreachable)
})

test('a camera that starts without a connection re-enters its room on its own once the connection is back', async ({ browser }) => {
  const camera = await openDevice(browser)
  const key = await createRoom(camera, 'Casa al mare')
  await joinAsCamera(camera, 'soggiorno')
  await expect(camera.getByLabel('Anteprima')).toBeVisible()
  await forgetSession(camera)
  await camera.route(supabase, route => route.abort('internetdisconnected'))
  await camera.reload()
  await expect(camera.getByRole('heading', { name: 'Impossibile collegarsi' })).toBeVisible()

  await camera.context().setOffline(true)
  await camera.unroute(supabase)
  await camera.context().setOffline(false)

  await expect(camera.getByLabel('Anteprima')).toBeVisible()
  const viewer = await openDevice(browser)
  await joinAsViewer(viewer, key, 'Andrea')
  await expect(camera.getByRole('button', { name: '1 persona guarda' })).toBeVisible()
})
