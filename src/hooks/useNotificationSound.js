import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { playChime, readSoundAllowed, writeSoundAllowed } from '../utils/sound'

// How often a bell looks for something new while the page is open.
const CHECK_EVERY_MS = 60000

/*
  Keeps a bell up to date and plays a sound when its count goes up.

  total  - how many things need attention now; null until first loaded.
  reload - looks the count up again.
  kind   - which sound: 'owner' for the owner dashboard's bell, 'admin' for the admin's.

  const { soundAllowed, setSoundAllowed } = useNotificationSound(total, reload, 'owner')
*/
export function useNotificationSound(total, reload, kind) {
  const { user } = useAuth()
  const [soundAllowed, setAllowed] = useState(() => readSoundAllowed(user))
  // The count last seen, so only a rise makes a sound, never the first load.
  const lastTotal = useRef(null)

  // Looks again every minute, also while Kodi is in a background tab, so the sound
  // can call the person back to it.
  useEffect(() => {
    const timer = setInterval(reload, CHECK_EVERY_MS)

    return () => clearInterval(timer)
  }, [reload])

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
