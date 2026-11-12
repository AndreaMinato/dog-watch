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
}, {
  files: ['tests/e2e/**/*.ts'],
  rules: {
    'no-restricted-syntax': ['error', {
      selector: 'CallExpression[callee.property.name=\'getByRole\'] > ObjectExpression:has(Property[key.name=\'name\'][value.type=/^(Literal|TemplateLiteral)$/]:not([value.regex])):not(:has(Property[key.name=\'exact\']))',
      message: 'Add `exact: true`: Playwright matches a string name as a substring, so a renamed or longer name still passes.',
    }, {
      selector: 'CallExpression[callee.property.name=\'getByLabel\'][arguments.0.type=/^(Literal|TemplateLiteral)$/]:not([arguments.0.regex]):not(:has(Property[key.name=\'exact\']))',
      message: 'Add `{ exact: true }`: Playwright matches a string label as a substring, so a renamed or longer label still passes.',
    }],
  },
})
