import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { LoadingState } from './components/common/DataState'
import { useAuth } from './context/AuthContext'
import NoAccessPage from './pages/auth/NoAccessPage'
import SignInPage from './pages/auth/SignInPage'
import DashboardPage from './pages/dashboard/DashboardPage'

function App() {
  const { status, user } = useAuth()
  const location = useLocation()

  if (status === 'loading') {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[var(--bg)]">
        <LoadingState label="Restoring your session..." />
      </main>
    )
  }

  const signedIn = status === 'signedIn'

  return (
    <Routes>
      <Route
        path="/login"
        element={
          signedIn ? (
            <Navigate to={location.state?.from || '/dashboard'} replace />
          ) : (
            <SignInPage />
          )
        }
      />

      <Route
        path="/*"
        element={
          !signedIn ? (
            <Navigate to="/login" replace state={{ from: location.pathname }} />
          ) : user.role === 'owner' ? (
            <DashboardPage />
          ) : (
            // The dashboard API is owner-only; other roles would get 403 on every page.
            <NoAccessPage />
          )
        }
      />
    </Routes>
  )
}

export default App
