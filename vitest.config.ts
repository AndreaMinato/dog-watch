import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    passWithNoTests: true,
    projects: [
      {
        test: {
          name: 'unit',
          include: ['src/**/*.test.ts', 'supabase/functions/**/*.test.ts'],
        },
      },
      {
        test: {
          name: 'api',
          include: ['tests/api/**/*.test.ts'],
          // The first call to a function downloads its dependencies inside the edge runtime.
          testTimeout: 30_000,
        },
      },
    ],
  },
})
