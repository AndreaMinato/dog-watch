import { expect } from '@playwright/test'
import { test } from './devices'

test('the app serves its own fonts and never asks another site for them', async ({ page }) => {
  const fontRequests: string[] = []
  page.on('request', (request) => {
    if (['font', 'stylesheet'].includes(request.resourceType()))
      fontRequests.push(request.url())
  })

  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  const loadedFamilies = await page.evaluate(async () => {
    await document.fonts.ready
    return [...document.fonts].filter(font => font.status === 'loaded').map(font => font.family.replaceAll('"', ''))
  })

  expect(loadedFamilies).toEqual(expect.arrayContaining(['Young Serif', 'Atkinson Hyperlegible']))
  const appOrigin = new URL(page.url()).origin
  expect(fontRequests.map(url => new URL(url).origin)).toEqual(fontRequests.map(() => appOrigin))
})

test('each font comes with its licence', async ({ page }) => {
  for (const font of ['young-serif', 'atkinson-hyperlegible']) {
    const licence = await page.request.get(`/fonts/${font}/OFL.txt`)
    expect(await licence.text()).toContain('SIL Open Font License')
  }
})
