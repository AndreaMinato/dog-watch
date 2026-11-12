import process from 'node:process'
import { chromium, devices } from '@playwright/test'

const [link, name = 'Prova'] = process.argv.slice(2)
if (!link) {
  console.error('Usage: node scripts/test-camera.mjs "<invite link>" [camera name]')
  process.exit(1)
}

const browser = await chromium.launch({
  args: ['--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream'],
  handleSIGINT: false,
})
const context = await browser.newContext({ ...devices['iPhone 13 Mini'], permissions: ['camera', 'microphone'] })
const page = await context.newPage()
await page.goto(link)
await page.getByRole('button', { name: /Farà da telecamera/ }).click()
await page.getByRole('textbox').fill(name)
await page.getByRole('button', { name: 'Avanti', exact: true }).click()
await page.getByRole('button', { name: 'Entra', exact: true }).click()
await page.getByText('In diretta').first().waitFor()
console.log(`${name} is live. Ctrl-C leaves the Stanza.`)

process.on('SIGINT', async () => {
  const rest = page.getByText('Tocca per riaccendere lo schermo')
  if (await rest.isVisible())
    await rest.click()
  await page.getByRole('button', { name: 'Menu', exact: true }).click()
  await page.getByRole('button', { name: 'Esci', exact: true }).click()
  await browser.close()
  process.exit(0)
})
