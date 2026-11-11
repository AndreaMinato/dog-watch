import { expect } from '@playwright/test'
import { pngSize, test } from './devices'

test('the status bar takes the colour of the day and of the night theme', async ({ page }) => {
  await page.goto('/')

  await expect(page.locator('meta[name="theme-color"][media="(prefers-color-scheme: light)"]')).toHaveAttribute('content', '#cbdac6')
  await expect(page.locator('meta[name="theme-color"][media="(prefers-color-scheme: dark)"]')).toHaveAttribute('content', '#1b2249')
})

test('iPhone and iPad find an icon for the home screen', async ({ page }) => {
  await page.goto('/')

  const href = await page.locator('link[rel="apple-touch-icon"]').getAttribute('href')
  expect(await pngSize(page, href!)).toBe('180x180')
})
