import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import OrderListPage from './pages/OrderListPage'
import CreateOrderPage from './pages/CreateOrderPage'
import EditOrderPage from './pages/EditOrderPage'
import LoginPage from './pages/LoginPage'
import CalendarPage from './pages/CalendarPage'
import UserAdminPage from './pages/UserAdminPage'
import StatsChartsPage from './pages/StatsChartsPage'
import { AuthProvider } from './auth/AuthProvider'
import ProtectedRoute from './auth/ProtectedRoute'
import I18nProvider from './i18n/I18nProvider'
import OAuth2Redirect from './components/OAuth2Redirect'; 



function AnimatedRoutes() {
  const location = useLocation()
  return (
    <div key={location.pathname} className="route-fade">
      <Routes location={location}>
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
        <Route
          path="/admin/stats"
          element={
            <ProtectedRoute>
              <StatsChartsPage />
            </ProtectedRoute>
          }
        />
      </Routes>
    </div>
  )
}

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
          <Route path="/oauth2/redirect" element={<OAuth2Redirect />} />
        </Routes>
        <AnimatedRoutes />
        </AuthProvider>
      </I18nProvider>
    </BrowserRouter>
  )
}
