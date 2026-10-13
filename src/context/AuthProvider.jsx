import { useCallback, useEffect, useMemo, useState } from 'react'
import { openOwnerAccount as recordOpenedAccount } from '../api/admin'
import { fetchCurrentUser, logout } from '../api/auth'
import {
  clearTokens,
  getActingOwner,
  hasSession,
  onSessionExpired,
  setActingOwner,
  setTokens,
} from '../api/client'
import { AuthContext } from './AuthContext'

function AuthProvider({ children }) {
  const [session, setSession] = useState(() => ({
    status: hasSession() ? 'loading' : 'signedOut',
    user: null,
  }))

  // The owner account a system admin is working in; it survives a refresh of the tab.
  const [actingOwner, setActing] = useState(getActingOwner)

  // Restore the session after a page refresh.
  useEffect(() => {
    onSessionExpired(() => {
      setActing(null)
      setSession({ status: 'signedOut', user: null })
    })

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
    setActing(null)
    setSession({ status: 'signedOut', user: null })
  }, [])

  // The backend writes this to the audit log before the admin sees anything.
  const openOwnerAccount = useCallback(async (ownerId) => {
    const owner = await recordOpenedAccount(ownerId)
    const acting = { user_id: owner.user_id, name: owner.name }

    setActingOwner(acting)
    setActing(acting)
  }, [])

  const closeOwnerAccount = useCallback(() => {
    setActingOwner(null)
    setActing(null)
  }, [])

  // Going back to the admin pages with the browser's back button leaves the owner's account,
  // so returning to it means opening it again, which is audited.
  useEffect(() => {
    function leaveOnBack() {
      if (window.location.pathname.startsWith('/admin')) closeOwnerAccount()
    }

    window.addEventListener('popstate', leaveOnBack)

    return () => window.removeEventListener('popstate', leaveOnBack)
  }, [closeOwnerAccount])

  const refreshUser = useCallback(async () => {
    const user = await fetchCurrentUser()

    setSession({ status: 'signedIn', user })

    return user
  }, [])

  const value = useMemo(
    () => ({
      ...session,
      // Only an admin can be inside someone else's account.
      actingOwner: session.user?.role === 'admin' ? actingOwner : null,
      signIn,
      signOut,
      refreshUser,
      openOwnerAccount,
      closeOwnerAccount,
    }),
    [session, actingOwner, signIn, signOut, refreshUser, openOwnerAccount, closeOwnerAccount]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export default AuthProvider
