import { expect } from '@playwright/test'
import { test } from './devices'

test('a browser without WebRTC is told it is not supported', async ({ page }) => {
  await page.addInitScript(() => {
    Reflect.deleteProperty(window, 'RTCPeerConnection')
  })
  await page.goto('/')

  await expect(page.getByRole('heading', { name: 'Browser non supportato', exact: true })).toBeVisible()
  await expect(page.getByText('Telecamera: Safari su iPhone o iPad (iOS 16.4 o successivo)')).toBeVisible()
  await expect(page.getByText('Con l\'app installata su iPhone o iPad serve iOS 18.4 o successivo')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Farà da telecamera', exact: true })).toBeHidden()
})

test('a browser without Wake Lock can join only as a viewer', async ({ page }) => {
  await page.addInitScript(() => {
    Reflect.deleteProperty(Navigator.prototype, 'wakeLock')
  })
  await page.goto('/')

  const camera = page.getByRole('button', { name: 'Farà da telecamera', exact: true })
  await expect(camera).toBeDisabled()
  await expect(camera).toHaveAccessibleDescription(/non può usare la fotocamera o tenere lo schermo acceso.*Per fare da telecamera usa Safari.*Con l'app installata su iPhone o iPad serve iOS 18\.4 o successivo/)
  await expect(page.getByRole('button', { name: 'Guarderà la casa', exact: true })).toBeEnabled()

  await page.goto('/crea')

  await expect(page.getByRole('heading', { name: 'Cosa farà questo dispositivo?', exact: true })).toBeVisible()
})
