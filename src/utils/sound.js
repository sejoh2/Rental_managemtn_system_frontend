/*
  The notification sound. It is off until the person turns it on, and the
  choice is kept in this browser only, one per account.

  Browsers only let a page make sound after the person has clicked or typed
  somewhere on it, so after a refresh the first sound waits for that.
*/
const KEY = 'kodi-sound'

function soundKey(user) {
  return `${KEY}-${user.role}-${user.user_id ?? user.id}`
}

export function readSoundAllowed(user) {
  try {
    return localStorage.getItem(soundKey(user)) === 'on'
  } catch {
    return false
  }
}

export function writeSoundAllowed(user, allowed) {
  try {
    localStorage.setItem(soundKey(user), allowed ? 'on' : 'off')
  } catch {
    // Not saved; the choice still applies until the page is closed.
  }
}

let audio = null

/*
  The owner and the admin hear different sounds, so someone who uses both
  can tell them apart. Each is [pitch in Hz, seconds after the start] notes.

  owner  two soft rising notes
  admin  three lower, quicker notes, the last one higher
*/
const chimes = {
  owner: { wave: 'sine', notes: [[880, 0], [1175, 0.16]] },
  admin: { wave: 'triangle', notes: [[523, 0], [523, 0.13], [784, 0.26]] },
}

// Made in the browser, so no sound file is needed. kind: 'owner' | 'admin'.
export function playChime(kind = 'owner') {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext

    if (!AudioContext) return

    audio = audio || new AudioContext()

    if (audio.state === 'suspended') audio.resume()

    const start = audio.currentTime

    const chime = chimes[kind] || chimes.owner

    chime.notes.forEach(([frequency, delay]) => {
      const tone = audio.createOscillator()
      const volume = audio.createGain()

      tone.type = chime.wave
      tone.frequency.value = frequency

      // A quick fade in and out, so the tone does not click.
      volume.gain.setValueAtTime(0.0001, start + delay)
      volume.gain.exponentialRampToValueAtTime(0.18, start + delay + 0.02)
      volume.gain.exponentialRampToValueAtTime(0.0001, start + delay + 0.22)

      tone.connect(volume).connect(audio.destination)
      tone.start(start + delay)
      tone.stop(start + delay + 0.24)
    })
  } catch {
    // The browser refused to play; a missed sound must never break the page.
  }
}
