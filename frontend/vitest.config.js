import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.js'],
    include: ['src/**/*.test.{js,jsx}'],
    exclude: ['src/**/*.integration.test.{js,jsx}'],
    restoreMocks: true,
    clearMocks: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],   // lcov is what Sonar reads
      reportsDirectory: './coverage',
      include: ['src/**/*.{js,jsx}'],
      // Exclude code that doesn't carry logic:
      //  - pages: pure composition, validated by E2E rather than unit tests
      //  - i18n dictionaries / data / styles: data, not logic
      //  - main.jsx / index: bootstrap wiring
      //  - leaf UI primitives without conditionals: 1-liner wrappers
      exclude: [
        'src/**/*.test.{js,jsx}',
        'src/**/*.integration.test.{js,jsx}',
        'src/test/**',
        'src/main.jsx',
        'src/pages/**',
        'src/i18n/dictionaries/**',
        'src/data/**',
        'src/styles/**',
        'src/assets/**',
        'src/components/createOrder/Spinner.jsx',
        'src/components/createOrder/CustomerAvatar.jsx',
        'src/components/orders/CustomerLogo.jsx',
        'src/components/orders/Cell.jsx',
        'src/components/orders/PageBtn.jsx',
        'src/components/orders/SortableHeader.jsx',
        'src/components/createOrder/FormField.jsx',
      ],
    },
  },
})
