import { expect, test } from '@playwright/test'

test('home page opens in Italian', async ({ page }) => {
  await page.goto('/')

  await expect(page.locator('html')).toHaveAttribute('lang', 'it')
  await expect(page.getByRole('heading', { name: 'dog-watch' })).toBeVisible()
})

test('test browser provides a fake camera', async ({ page }) => {
  await page.goto('/')

  const videoTracks = await page.evaluate(async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
    return stream.getVideoTracks().length
  })

  expect(videoTracks).toBe(1)
})

test('home links to what the app stores', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('link', { name: 'Come funziona e cosa salviamo' }).click()

  await expect(page.getByRole('heading', { name: 'Come funziona e cosa salviamo' })).toBeVisible()
  for (const fact of [
    'non viene registrato',
    'come hash',
    'dopo 30 giorni',
    'Nessun cookie di tracciamento',
  ])
    await expect(page.getByText(fact)).toBeVisible()
})
