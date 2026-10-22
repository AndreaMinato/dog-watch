import antfu from '@antfu/eslint-config'

export default antfu({
  vue: true,
  typescript: true,
  pnpm: true,
  antislop: true,
  formatters: {
    css: true,
    html: true,
  },
}, {
  files: ['tests/e2e/**/*.spec.ts'],
  rules: {
    'no-restricted-imports': ['error', {
      paths: [{
        name: '@playwright/test',
        importNames: ['test'],
        message: 'Import test from ./devices: its fixture closes every browser context a test opens.',
      }],
    }],
  },
})
