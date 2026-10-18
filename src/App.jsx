import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { LoadingState } from './components/common/DataState'
import { useAuth } from './context/AuthContext'
import AdminPage from './pages/admin/AdminPage'
import NamePage from './pages/auth/NamePage'
import NoAccessPage from './pages/auth/NoAccessPage'
import SignInPage from './pages/auth/SignInPage'
import DashboardPage from './pages/dashboard/DashboardPage'
import HomePage from './pages/home/HomePage'
import PrivacyPage from './pages/legal/PrivacyPage'
import TermsPage from './pages/legal/TermsPage'

function App() {
  const { status, user, actingOwner } = useAuth()
  const location = useLocation()

  if (status === 'loading') {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[var(--bg)]">
        <LoadingState label="Restoring your session..." />
      </main>
    )
  }

  const signedIn = status === 'signedIn'
  const onAdminPages = location.pathname.startsWith('/admin')

  return (
    <Routes>
      {/* Open to everyone, signed in or not (also linked from app stores and Meta, TikTok and Google). */}
      <Route path="/terms" element={<TermsPage />} />
      <Route path="/privacy" element={<PrivacyPage />} />

      {/* The public home page; someone signed in goes straight to their pages. */}
      <Route path="/" element={signedIn ? <Navigate to="/dashboard" replace /> : <HomePage />} />

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
          ) : user.needs_name ? (
            // An account created by OTP has no name until the person gives one.
            <NamePage />
          ) : user.role === 'owner' ? (
            <DashboardPage />
          ) : user.role === 'admin' && actingOwner && !onAdminPages ? (
            // An admin working inside an owner's account sees that owner's dashboard.
            // The admin's own pages always win, so the browser's back button returns to them.
            <DashboardPage key={actingOwner.user_id} />
          ) : user.role === 'admin' ? (
            <AdminPage />
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
