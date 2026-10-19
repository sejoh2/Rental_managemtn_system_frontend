import { useSyncExternalStore } from 'react'
import { getMyBilling } from '../../api/billing'

/*
  The owner's Kodi billing, shared by everything on the page that
  shows it (the top bar countdown, the banner). Loaded once while
  any of them is on screen, every 5 minutes, and whenever
  'kodi-billing-changed' is announced (a payment, or the server
  refusing a change because the account is read-only). Forgotten
  when none is on screen, so another account never sees it.
*/
let current = null
let timer = null
const listeners = new Set()

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
    window.addEventListener('kodi-billing-changed', load)
  }

  return () => {
    listeners.delete(listener)

    if (!listeners.size) {
      clearInterval(timer)
      window.removeEventListener('kodi-billing-changed', load)
      current = null
    }
  }
}

export function useMyBilling() {
  return useSyncExternalStore(subscribe, () => current)
}
