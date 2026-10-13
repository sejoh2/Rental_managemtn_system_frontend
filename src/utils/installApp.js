/*
  Makes the app installable (see public/sw.js and public/manifest.webmanifest).

  The service worker runs only in the built app: during development it would
  serve kept files instead of the ones just changed.
*/
export function registerServiceWorker() {
  if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return

  window.addEventListener('load', () => {
    // Failing to register only means the app is not installable; it still works.
    navigator.serviceWorker.register('/sw.js').catch(() => {})
  })
}

/*
  The browser's own offer to install, kept until the user asks for it.
  Chrome and Edge make the offer; Safari and Firefox do not, and are
  installed from the browser's menu instead.
*/
let offer = null
const listeners = new Set()

function changed() {
  listeners.forEach((listener) => listener())
}

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (event) => {
    // Stops the browser's own banner, so the offer can be shown from Settings.
    event.preventDefault()
    offer = event
    changed()
  })

  window.addEventListener('appinstalled', () => {
    offer = null
    changed()
  })
}

export function subscribeToInstall(listener) {
  listeners.add(listener)

  return () => listeners.delete(listener)
}

export function canInstall() {
  return offer !== null
}

// True when the app is already open in its own window, installed.
export function isInstalled() {
  return (
    window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true
  )
}

// Shows the browser's install question. -> true when the user accepted.
export async function installApp() {
  if (!offer) return false

  const asked = offer

  // An offer can be used once.
  offer = null
  changed()
  asked.prompt()

  const { outcome } = await asked.userChoice

  return outcome === 'accepted'
}
