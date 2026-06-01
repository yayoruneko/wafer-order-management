import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'

vi.mock('./useAuth', () => ({
  default: vi.fn(),
}))

import ProtectedRoute from './ProtectedRoute'
import useAuth from './useAuth'

function renderWithRoutes(initialEntries = ['/protected']) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <Routes>
        <Route
          path="/protected"
          element={
            <ProtectedRoute>
              <div>secret area</div>
            </ProtectedRoute>
          }
        />
        <Route path="/login" element={<div>login page</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

/**
 * 規則：未登入使用者必須被踢到 /login；登入後直接看見受保護內容。
 * 這個 guard 是整個權限模型的最後一道牆，回歸性極高。
 */
describe('ProtectedRoute', () => {
  it('renders the children when authenticated', () => {
    useAuth.mockReturnValue({ isAuthenticated: true })
    renderWithRoutes()
    expect(screen.getByText('secret area')).toBeInTheDocument()
    expect(screen.queryByText('login page')).toBeNull()
  })

  it('redirects to /login when unauthenticated', () => {
    useAuth.mockReturnValue({ isAuthenticated: false })
    renderWithRoutes()
    expect(screen.getByText('login page')).toBeInTheDocument()
    expect(screen.queryByText('secret area')).toBeNull()
  })
})
