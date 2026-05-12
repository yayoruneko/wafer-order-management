import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.integration.test.{js,jsx}'],
    testTimeout: 30_000,
    hookTimeout: 30_000,
    restoreMocks: true,
    clearMocks: true,
  },
})
