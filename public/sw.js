/*
  The service worker that makes the app installable and quick to open.

  It keeps only the app's own files (the page, its scripts, styles and icons).
  It never keeps anything from the server: tenants, payments and every other
  record are always fetched fresh, and nothing private is left on the device.

  Raise the number when this file's behaviour changes; older copies are removed.
*/
const SHELL = 'app-shell-v1'
const PAGE = '/index.html'
// Built files carry a fingerprint in their name, so a kept copy is never out of date.
const MAX_BUILT_FILES = 80

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(SHELL)
      .then((cache) => cache.add(new Request(PAGE, { cache: 'reload' })))
      .then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((names) => Promise.all(names.filter((name) => name !== SHELL).map((name) => caches.delete(name))))
      .then(() => self.clients.claim())
  )
})

// Drops the oldest built files once there are too many, left behind by earlier versions.
async function trim(cache) {
  const kept = await cache.keys()
  const built = kept.filter((request) => new URL(request.url).pathname.startsWith('/assets/'))

  await Promise.all(built.slice(0, Math.max(0, built.length - MAX_BUILT_FILES)).map((request) => cache.delete(request)))
}

// The page itself: the newest from the network, the kept copy when there is no connection.
async function page(request) {
  const cache = await caches.open(SHELL)

  try {
    const response = await fetch(request)

    if (response.ok) await cache.put(PAGE, response.clone())

    return response
  } catch {
    const kept = await cache.match(PAGE)

    if (kept) return kept

    throw new Error('No connection.')
  }
}

// The app's scripts, styles and icons: the kept copy first, the network otherwise.
async function file(request) {
  const cache = await caches.open(SHELL)
  const kept = await cache.match(request)

  if (kept) return kept

  const response = await fetch(request)

  if (response.ok) {
    await cache.put(request, response.clone())
    await trim(cache)
  }

  return response
}

self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Only the app's own files. Requests to the server and to file storage are left alone.
  if (request.method !== 'GET' || url.origin !== self.location.origin) return
  if (url.pathname.startsWith('/api/')) return

  if (request.mode === 'navigate') {
    event.respondWith(page(request))
    return
  }

  if (url.pathname.startsWith('/assets/') || /^\/(icon-|apple-touch-icon|favicon)/.test(url.pathname)) {
    event.respondWith(file(request))
  }
})
