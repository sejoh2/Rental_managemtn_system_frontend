import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { playChime, readSoundAllowed, unlockSound, writeSoundAllowed } from '../utils/sound'
import { useLiveBell } from './useLiveBell'

// The server says at once when a bell changes (useLiveBell). This regular look is
// only the safety net, for a moment the live connection was down.
const CHECK_EVERY_MS = 120000

/*
  Keeps a bell up to date and plays a sound when its count goes up.

  total  - how many things need attention now; null until first loaded.
  reload - looks the count up again.
  kind   - which bell and sound: 'owner' for the owner dashboard's bell, 'admin' for the admin's.

  const { soundAllowed, setSoundAllowed } = useNotificationSound(total, reload, 'owner')
*/
export function useNotificationSound(total, reload, kind) {
  const { user } = useAuth()
  const [soundAllowed, setAllowed] = useState(() => readSoundAllowed(user))
  // The count last seen, so only a rise makes a sound, never the first load.
  const lastTotal = useRef(null)

  // Told at once by the server when the count changes, also in a background tab,
  // so the sound can call the person back to it.
  useLiveBell(kind, reload)

  // And looks again every 2 minutes, in case the live connection was down.
  useEffect(() => {
    const timer = setInterval(reload, CHECK_EVERY_MS)

    return () => clearInterval(timer)
  }, [reload])

  // And at once when the person comes back to the tab or the window.
  useEffect(() => {
    function lookAgain() {
      if (document.visibilityState === 'visible') reload()
    }

    document.addEventListener('visibilitychange', lookAgain)
    window.addEventListener('focus', lookAgain)

    return () => {
      document.removeEventListener('visibilitychange', lookAgain)
      window.removeEventListener('focus', lookAgain)
    }
  }, [reload])

  // With the sound on, the first click or key press after the page loads gets the
  // browser's permission to play it, so later chimes are heard.
  useEffect(() => {
    if (!soundAllowed) return undefined

    function unlock() {
      unlockSound()
      window.removeEventListener('pointerdown', unlock)
      window.removeEventListener('keydown', unlock)
    }

    window.addEventListener('pointerdown', unlock)
    window.addEventListener('keydown', unlock)

    return () => {
      window.removeEventListener('pointerdown', unlock)
      window.removeEventListener('keydown', unlock)
    }
  }, [soundAllowed])

  useEffect(() => {
    if (total === null || total === undefined) return

    if (soundAllowed && lastTotal.current !== null && total > lastTotal.current) playChime(kind)

    lastTotal.current = total
  }, [total, soundAllowed, kind])

  function setSoundAllowed(allowed) {
    writeSoundAllowed(user, allowed)
    setAllowed(allowed)

    // Lets the person hear it, and is the click the browser needs before it allows sound.
    if (allowed) playChime(kind)
  }

  return { soundAllowed, setSoundAllowed }
}
