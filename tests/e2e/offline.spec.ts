import { expect } from '@playwright/test'
import { test } from './devices'

test('without a connection the app says so, and opens once the connection is back', async ({ page }) => {
  await page.route('**/auth/v1/**', route => route.abort('internetdisconnected'))
  await page.goto('/')

  await expect(page.getByRole('heading', { name: 'Impossibile collegarsi' })).toBeVisible()
  await expect(page.getByText('Controlla la connessione a internet e riprova.')).toBeVisible()

  await page.unroute('**/auth/v1/**')
  await page.getByRole('button', { name: 'Riprova' }).click()

  await expect(page.getByRole('heading', { level: 1, name: 'Veglia' })).toBeVisible()
})
