import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import OrderListPage from './pages/OrderListPage'
import CreateOrderPage from './pages/CreateOrderPage'
import EditOrderPage from './pages/EditOrderPage'
import LoginPage from './pages/LoginPage'
import CalendarPage from './pages/CalendarPage'
import UserAdminPage from './pages/UserAdminPage'
import { AuthProvider } from './auth/AuthProvider'
import ProtectedRoute from './auth/ProtectedRoute'
import I18nProvider from './i18n/I18nProvider'

export default function App() {
  return (
    <BrowserRouter>
      <I18nProvider>
        <AuthProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: '#1c1917',
              color: '#fafaf9',
              fontSize: '13px',
              padding: '10px 14px',
              borderRadius: '10px',
              boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
            },
            success: {
              iconTheme: { primary: '#10b981', secondary: '#1c1917' },
            },
            error: {
              iconTheme: { primary: '#ef4444', secondary: '#1c1917' },
            },
          }}
        />
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <OrderListPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/orders/new"
            element={
              <ProtectedRoute>
                <CreateOrderPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/orders/:id/edit"
            element={
              <ProtectedRoute>
                <EditOrderPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/calendar"
            element={
              <ProtectedRoute>
                <CalendarPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <ProtectedRoute>
                <UserAdminPage />
              </ProtectedRoute>
            }
          />
        </Routes>
        </AuthProvider>
      </I18nProvider>
    </BrowserRouter>
  )
}
