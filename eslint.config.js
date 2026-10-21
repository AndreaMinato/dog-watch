import antfu from '@antfu/eslint-config'

export default antfu({
  vue: true,
  typescript: true,
  pnpm: true,
  antislop: true,
  formatters: {
    html: true,
  },
})
