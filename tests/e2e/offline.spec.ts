import type { Page, Route } from '@playwright/test'
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

/** On a first visit, asks to create a room while the sign-in is still on its way: returns that held sign-in. */
async function createRoomDuringSignIn(page: Page): Promise<Route> {
  const { promise: signIn, resolve: holdSignIn } = Promise.withResolvers<Route>()
  await page.route('**/auth/v1/signup', holdSignIn)
  await page.goto('/')
  await page.getByRole('button', { name: 'Farà da telecamera', exact: true }).click()
  await page.getByRole('button', { name: 'Non ce l\'ho: crea una Stanza nuova', exact: true }).click()
  await page.getByLabel('Come si chiama la Stanza?', { exact: true }).fill('Casa al mare')
  await page.getByRole('button', { name: 'Crea', exact: true }).click()
  return signIn
}

test('on a slow first visit, creating a room waits for the sign-in', async ({ page }) => {
  const signIn = await createRoomDuringSignIn(page)

  await signIn.continue()

  await expect(page.getByRole('list', { name: 'Chiave della Stanza', exact: true }).getByRole('listitem')).toHaveCount(4)
})

test('on a slow first visit, a sign-in that fails says the service cannot be reached', async ({ page }) => {
  const signIn = await createRoomDuringSignIn(page)

  await signIn.abort('internetdisconnected')

  await expect(page.getByText(unreachable)).toBeVisible()
  await expect(page.getByText('Qualcosa è andato storto, riprova.')).toBeHidden()
})

test('without a connection the app says so, and opens once the connection is back', async ({ page }) => {
  await page.route('**/auth/v1/**', route => route.abort('internetdisconnected'))
  await page.goto('/')

  await expect(page.getByRole('heading', { name: 'Impossibile collegarsi', exact: true })).toBeVisible()
  await expect(page.getByText('Controlla la connessione a internet e riprova.')).toBeVisible()

  await page.unroute('**/auth/v1/**')
  await page.getByRole('button', { name: 'Riprova', exact: true }).click()

  await expect(page.getByRole('heading', { level: 1, name: 'Cosa farà questo dispositivo?', exact: true })).toBeVisible()
})

test('with a slow connection the app opens at once, while its session is being renewed', async ({ browser }) => {
  const page = await openDevice(browser)
  await expect(page.getByRole('heading', { name: 'Cosa farà questo dispositivo?', exact: true })).toBeVisible()
  await expireSession(page)
  await page.route('**/auth/v1/**', () => {})

  await page.reload()

  await expect(page.getByRole('heading', { name: 'Cosa farà questo dispositivo?', exact: true })).toBeVisible()
})

test('entering a room without a connection says the service cannot be reached', async ({ browser }) => {
  const page = await openDevice(browser)
  const key = await createRoom(page, 'Casa al mare')
  await joinAsCamera(page, 'soggiorno')
  await (await openCameraMenu(page)).getByRole('button', { name: 'Esci', exact: true }).click()
  await page.route(supabase, route => route.abort('internetdisconnected'))

  await page.getByRole('list', { name: 'Le tue Stanze', exact: true }).getByRole('button', { name: 'Casa al mare', exact: true }).click()
  await expect(page.getByRole('alert')).toHaveText(unreachable)

  await page.getByRole('button', { name: 'Usa questo dispositivo in un\'altra Stanza', exact: true }).click()
  await joinAsViewer(page, key, 'Andrea')
  await expect(page.getByRole('alert')).toHaveText(unreachable)
})

test('a camera that starts without a connection re-enters its room on its own once the connection is back', async ({ browser }) => {
  const camera = await openDevice(browser)
  const key = await createRoom(camera, 'Casa al mare')
  await joinAsCamera(camera, 'soggiorno')
  await expect(camera.getByLabel('Anteprima', { exact: true })).toBeVisible()
  await forgetSession(camera)
  await camera.route(supabase, route => route.abort('internetdisconnected'))
  await camera.reload()
  await expect(camera.getByRole('heading', { name: 'Impossibile collegarsi', exact: true })).toBeVisible()

  await camera.context().setOffline(true)
  await camera.unroute(supabase)
  await camera.context().setOffline(false)

  await expect(camera.getByLabel('Anteprima', { exact: true })).toBeVisible()
  const viewer = await openDevice(browser)
  await joinAsViewer(viewer, key, 'Andrea')
  await expect(camera.getByRole('button', { name: '1 persona guarda', exact: true })).toBeVisible()
})
