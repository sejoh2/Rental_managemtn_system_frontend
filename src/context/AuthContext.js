import { createContext, useContext } from 'react'
import { formatPhone } from '../utils/format'

export const AuthContext = createContext(null)

/*
  const { status, user, signIn, signOut, refreshUser } = useAuth()
  status: 'loading' | 'signedOut' | 'signedIn'

  For a system admin only:
  actingOwner: { user_id, name } | null   the owner account the admin has opened
  openOwnerAccount(ownerId), closeOwnerAccount()
*/
export function useAuth() {
  return useContext(AuthContext)
}

// Accounts created by OTP have no name until the profile is filled in.
export function displayName(user) {
  const name = [user?.first_name, user?.last_name].filter(Boolean).join(' ').trim()

  return name || formatPhone(user?.phone, 'Account')
}
