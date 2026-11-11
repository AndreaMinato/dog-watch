import process from 'node:process'
import { defineConfig, devices } from '@playwright/test'

const isCI = Boolean(process.env.CI)
const port = isCI ? 4173 : 5173
const fakeMedia = {
  args: [
    '--use-fake-device-for-media-stream',
    '--use-fake-ui-for-media-stream',
  ],
}

export default defineConfig({
  testDir: './tests/e2e',
  // Presence and WebRTC between several browsers take seconds to settle, more on a loaded machine.
  expect: { timeout: 15_000 },
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  workers: isCI ? 1 : undefined,
  reporter: isCI ? [['github'], ['html', { open: 'never' }]] : 'html',
  use: {
    baseURL: `http://localhost:${port}`,
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      testIgnore: /phone\.spec\.ts/,
      use: { ...devices['Desktop Chrome'], launchOptions: fakeMedia },
    },
    {
      name: 'phone',
      testMatch: /phone\.spec\.ts/,
      use: { ...devices['iPhone 13 Mini'], browserName: 'chromium', launchOptions: fakeMedia },
    },
  ],
  webServer: {
    command: isCI ? 'pnpm preview' : 'pnpm dev',
    port,
    reuseExistingServer: !isCI,
  },
})
