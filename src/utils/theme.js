/*
  The light/dark choice is kept in this browser only, one per account, so
  the owner and the admin each keep their own on a shared device.

  LAST_KEY is the choice most recently in use here. The sign-in page uses it,
  and so does the script in index.html, which runs before React loads.
*/
const LAST_KEY = 'kodi-theme'
const MODES = ['light', 'dark', 'system']

export function themeKey(user) {
  return user ? `${LAST_KEY}-${user.role}-${user.user_id ?? user.id}` : LAST_KEY
}

// Storage can be blocked (private windows); the app then follows the device.
export function readMode(key) {
  try {
    const mode = localStorage.getItem(key)

    return MODES.includes(mode) ? mode : 'system'
  } catch {
    return 'system'
  }
}

export function writeMode(key, mode) {
  try {
    localStorage.setItem(key, mode)
    localStorage.setItem(LAST_KEY, mode)
  } catch {
    // Not saved; the choice still applies until the page is closed.
  }
}

export const deviceDarkQuery = '(prefers-color-scheme: dark)'
