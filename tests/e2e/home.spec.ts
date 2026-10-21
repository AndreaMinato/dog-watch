import { expect, test } from '@playwright/test'

test('la Home si apre in italiano', async ({ page }) => {
  await page.goto('/')

  await expect(page.locator('html')).toHaveAttribute('lang', 'it')
  await expect(page.getByRole('heading', { name: 'dog-watch' })).toBeVisible()
})

test('il browser di test fornisce una fotocamera finta', async ({ page }) => {
  await page.goto('/')

  const videoTracks = await page.evaluate(async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
    return stream.getVideoTracks().length
  })

  expect(videoTracks).toBe(1)
})
