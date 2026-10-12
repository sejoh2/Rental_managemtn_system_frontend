import { useEffect, useState } from 'react'
import { deviceDarkQuery, readMode, themeKey, writeMode } from '../utils/theme'
import { useAuth } from './AuthContext'
import { ThemeContext } from './ThemeContext'

function ThemeProvider({ children }) {
  const { user } = useAuth()
  const key = themeKey(user)

  // Choices made since the page loaded, by account; older ones come from storage.
  const [chosen, setChosen] = useState({})
  const [deviceDark, setDeviceDark] = useState(() => window.matchMedia(deviceDarkQuery).matches)

  const mode = chosen[key] || readMode(key)
  const shown = mode === 'system' ? (deviceDark ? 'dark' : 'light') : mode

  // "Follow device" changes with the device, without a refresh.
  useEffect(() => {
    const query = window.matchMedia(deviceDarkQuery)
    const update = (event) => setDeviceDark(event.matches)

    query.addEventListener('change', update)

    return () => query.removeEventListener('change', update)
  }, [])

  useEffect(() => {
    document.documentElement.dataset.theme = shown
  }, [shown])

  // Signing in on a device makes that account's choice the one the sign-in page shows next.
  useEffect(() => {
    if (user) writeMode(key, mode)
  }, [user, key, mode])

  function setMode(next) {
    writeMode(key, next)
    setChosen((current) => ({ ...current, [key]: next }))
  }

  return <ThemeContext.Provider value={{ mode, shown, setMode }}>{children}</ThemeContext.Provider>
}

export default ThemeProvider
