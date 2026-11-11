import { expect } from '@playwright/test'
import { test } from './devices'

test('a browser without WebRTC is told it is not supported', async ({ page }) => {
  await page.addInitScript(() => {
    Reflect.deleteProperty(window, 'RTCPeerConnection')
  })
  await page.goto('/')

  await expect(page.getByRole('heading', { name: 'Browser non supportato' })).toBeVisible()
  await expect(page.getByText('Telecamera: Safari su iPhone o iPad (iOS 16.4 o successivo)')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Farà da telecamera' })).toBeHidden()
})

test('a browser without Wake Lock can join only as a viewer', async ({ page }) => {
  await page.addInitScript(() => {
    Reflect.deleteProperty(Navigator.prototype, 'wakeLock')
  })
  await page.goto('/')

  const camera = page.getByRole('button', { name: 'Farà da telecamera' })
  await expect(camera).toBeDisabled()
  await expect(camera).toHaveAccessibleDescription(/non può usare la fotocamera o tenere lo schermo acceso.*Per fare da telecamera usa Safari/)
  await expect(page.getByRole('button', { name: 'Guarderà la casa' })).toBeEnabled()

  await page.goto('/crea')

  await expect(page.getByRole('heading', { name: 'Cosa farà questo dispositivo?' })).toBeVisible()
})
