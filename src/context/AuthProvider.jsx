import { useCallback, useEffect, useMemo, useState } from 'react'
import { fetchCurrentUser, logout } from '../api/auth'
import { clearTokens, hasSession, onSessionExpired, setTokens } from '../api/client'
import { AuthContext } from './AuthContext'

function AuthProvider({ children }) {
  const [session, setSession] = useState(() => ({
    status: hasSession() ? 'loading' : 'signedOut',
    user: null,
  }))

  // Restore the session after a page refresh.
  useEffect(() => {
    onSessionExpired(() => setSession({ status: 'signedOut', user: null }))

    if (!hasSession()) return

    fetchCurrentUser().then(
      (user) => setSession({ status: 'signedIn', user }),
      () => setSession({ status: 'signedOut', user: null })
    )
  }, [])

  const signIn = useCallback(({ user, access_token, refresh_token }) => {
    setTokens({ access_token, refresh_token })
    setSession({ status: 'signedIn', user })
  }, [])

  const signOut = useCallback(async () => {
    // Revoking the refresh token is best effort; the local session ends either way.
    await logout().catch(() => {})
    clearTokens()
    setSession({ status: 'signedOut', user: null })
  }, [])

  const refreshUser = useCallback(async () => {
    const user = await fetchCurrentUser()

    setSession({ status: 'signedIn', user })

    return user
  }, [])

  const value = useMemo(
    () => ({ ...session, signIn, signOut, refreshUser }),
    [session, signIn, signOut, refreshUser]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export default AuthProvider
