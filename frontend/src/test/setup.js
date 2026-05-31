import '@testing-library/jest-dom/vitest'
import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'

// Vitest doesn't auto-cleanup RTL renders between tests unless globals are
// enabled. Without this, modals from one test stay mounted in the next test
// and `getByText` etc. start finding "multiple elements".
afterEach(() => {
  cleanup()
})
