import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.js'],
    include: ['src/**/*.test.{js,jsx}'],
    exclude: ['src/**/*.integration.test.{js,jsx}'],
    restoreMocks: true,
    clearMocks: true,
  },
})
