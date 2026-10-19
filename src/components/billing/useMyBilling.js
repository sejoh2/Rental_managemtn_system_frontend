import { useSyncExternalStore } from 'react'
import { getMyBilling } from '../../api/billing'

/*
  The owner's Kodi billing, shared by everything on the page that
  shows it (the top bar countdown, the banner). Loaded once while
  any of them is on screen, every 5 minutes, just after midnight,
  and whenever 'kodi-billing-changed' is announced: the server's
  live signal (a trial ended, a bill made, a payment), a payment
  made on this page, or the server refusing a change because the
  account is read-only. Forgotten
  when none is on screen, so another account never sees it.
*/
let current = null
let timer = null
let midnight = null
const listeners = new Set()

// Looks again one minute after Nairobi midnight, when a trial or grace period may have ended.
function scheduleMidnight() {
  clearTimeout(midnight)

  const nairobiNow = new Date(Date.now() + 3 * 3600 * 1000)
  const nextMidnight = Date.UTC(nairobiNow.getUTCFullYear(), nairobiNow.getUTCMonth(), nairobiNow.getUTCDate() + 1) - 3 * 3600 * 1000

  midnight = setTimeout(() => {
    load()
    scheduleMidnight()
  }, nextMidnight - Date.now() + 60 * 1000)
}

function emit() {
  listeners.forEach((listener) => listener())
}

function load() {
  getMyBilling().then(
    (data) => {
      current = data
      emit()
    },
    () => {}
  )
}

function subscribe(listener) {
  listeners.add(listener)

  if (listeners.size === 1) {
    load()
    timer = setInterval(load, 5 * 60 * 1000)
    scheduleMidnight()
    window.addEventListener('kodi-billing-changed', load)
  }

  return () => {
    listeners.delete(listener)

    if (!listeners.size) {
      clearInterval(timer)
      clearTimeout(midnight)
      window.removeEventListener('kodi-billing-changed', load)
      current = null
    }
  }
}

export function useMyBilling() {
  return useSyncExternalStore(subscribe, () => current)
}
