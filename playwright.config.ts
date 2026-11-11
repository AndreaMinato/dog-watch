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
    // A service worker answers pages from its cache: only the pwa project lets it in, against a fresh build.
    serviceWorkers: 'block',
  },
  projects: [
    {
      name: 'chromium',
      testIgnore: /(layout|pwa)\.spec\.ts/,
      use: { ...devices['Desktop Chrome'], launchOptions: fakeMedia },
    },
    {
      name: 'phone',
      testMatch: /layout\.spec\.ts/,
      use: { ...devices['iPhone 13 Mini'], browserName: 'chromium', launchOptions: fakeMedia },
    },
    {
      name: 'tablet',
      testMatch: /layout\.spec\.ts/,
      use: { ...devices['iPad Mini'], browserName: 'chromium', launchOptions: fakeMedia },
    },
    // The manifest and the service worker exist only in a production build, the one CI serves.
    ...(isCI
      ? [{ name: 'pwa', testMatch: /pwa\.spec\.ts/, use: { ...devices['Desktop Chrome'], serviceWorkers: 'allow' as const } }]
      : []),
  ],
  webServer: {
    command: isCI ? 'pnpm preview' : 'pnpm dev',
    port,
    reuseExistingServer: !isCI,
  },
})
