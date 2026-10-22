import { expect, test } from '@playwright/test'

test('a browser without WebRTC is told it is not supported', async ({ page }) => {
  await page.addInitScript(() => {
    Reflect.deleteProperty(window, 'RTCPeerConnection')
  })
  await page.goto('/')

  await expect(page.getByRole('heading', { name: 'Browser non supportato' })).toBeVisible()
  await expect(page.getByText('Safari su iPhone o iPad (iOS 16.4 o successivo)')).toBeVisible()
  await expect(page.getByRole('link', { name: 'Crea una Stanza' })).toBeHidden()
})

test('a browser without Wake Lock can join only as a viewer', async ({ page }) => {
  await page.addInitScript(() => {
    Reflect.deleteProperty(Navigator.prototype, 'wakeLock')
  })
  await page.goto('/')
  await page.getByRole('link', { name: 'Entra in una Stanza' }).click()

  const camera = page.getByLabel('Camera')
  await expect(camera).toBeDisabled()
  await expect(camera).toHaveAccessibleDescription(/non può usare la fotocamera o tenere lo schermo acceso/)
  await expect(page.getByLabel('Spettatore')).toBeEnabled()
  await expect(page.getByLabel('Spettatore')).toBeChecked()
})
