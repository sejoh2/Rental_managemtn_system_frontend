import { API_URL, getAccessToken } from '../api/client'

/*
  Kodi's own analytics: pages seen, buttons and links clicked, the steps to
  an account, and errors, sent to Kodi's own backend (nothing to any other
  company). Shown to the admin on Admin > Analytics.

  A visitor is a random number kept in this browser (local storage, not a
  cookie). Nothing typed is ever read; numbers of 5 digits or more in a
  button's words are replaced by the server. The admin's own pages are not
  counted. Explained on the Privacy page.
*/

const VISITOR_KEY = 'kodi_visitor'
const SESSION_KEY = 'kodi_visit'
// A visit ends after 30 minutes without anything happening.
const VISIT_IDLE_MS = 30 * 60 * 1000
const SEND_EVERY_MS = 5000
const BATCH_MAX = 30

const queue = []
let timer = null
let currentPath = null
let pageStartedAt = 0

function randomId() {
  try {
    return crypto.randomUUID()
  } catch {
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`
  }
}

function visitorId() {
  try {
    let id = localStorage.getItem(VISITOR_KEY)

    if (!id) {
      id = randomId()
      localStorage.setItem(VISITOR_KEY, id)
    }

    return id
  } catch {
    // Storage blocked (a private window): a number for this page load only.
    visitorId.fallback ||= randomId()
    return visitorId.fallback
  }
}

// "google", "whatsapp", "facebook"..., from the address that sent them here.
function sourceOf() {
  try {
    const utm = new URLSearchParams(window.location.search).get('utm_source')

    if (utm) return utm.toLowerCase().slice(0, 40)

    if (!document.referrer) return 'direct'

    const host = new URL(document.referrer).hostname.replace(/^www\./, '')

    if (host === window.location.hostname) return 'direct'

    const known = [
      ['google', /google\./],
      ['bing', /bing\.com/],
      ['whatsapp', /(whatsapp|wa\.me|l\.wl\.co)/],
      ['facebook', /(facebook\.com|fb\.com|fb\.me)/],
      ['instagram', /instagram\.com/],
      ['tiktok', /tiktok\.com/],
      ['x', /(twitter\.com|t\.co|x\.com)/],
      ['linkedin', /linkedin\.com/],
      ['youtube', /youtube\.com/],
    ]

    return known.find(([, pattern]) => pattern.test(host))?.[0] || host.slice(0, 40)
  } catch {
    return 'direct'
  }
}

// The visit: a new one after 30 idle minutes, with where it came from.
function visit() {
  const now = Date.now()

  try {
    const saved = JSON.parse(sessionStorage.getItem(SESSION_KEY) || 'null')

    if (saved && now - saved.lastAt < VISIT_IDLE_MS) {
      saved.lastAt = now
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(saved))
      return saved
    }

    const fresh = { id: randomId(), source: sourceOf(), lastAt: now }

    sessionStorage.setItem(SESSION_KEY, JSON.stringify(fresh))
    return fresh
  } catch {
    visit.fallback ||= { id: randomId(), source: sourceOf() }
    return visit.fallback
  }
}

function device() {
  const width = window.innerWidth

  return width < 640 ? 'mobile' : width < 1024 ? 'tablet' : 'desktop'
}

function counted() {
  return !window.location.pathname.startsWith('/admin')
}

function send({ leaving = false } = {}) {
  clearTimeout(timer)
  timer = null

  while (queue.length) {
    const events = queue.splice(0, BATCH_MAX)
    const token = getAccessToken()

    fetch(`${API_URL}/api/analytics/events`, {
      method: 'POST',
      // Still delivered when the page is closing.
      keepalive: leaving,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        visitor_id: visitorId(),
        session_id: events[0].visit,
        // The visit goes once, above, not with every event.
        events: events.map((entry) => entry.event),
      }),
    }).catch(() => {
      // Analytics never gets in anyone's way.
    })
  }
}

function track(kind, fields = {}) {
  if (!counted()) return

  const current = visit()

  queue.push({
    visit: current.id,
    event: {
      kind,
      path: window.location.pathname,
      at: new Date().toISOString(),
      device: device(),
      source: current.source,
      ...fields,
    },
  })

  if (queue.length >= BATCH_MAX) send()
  else if (!timer) timer = setTimeout(send, SEND_EVERY_MS)
}

// A step to an account: 'pricing_seen', 'get_account', 'code_requested', 'signed_in'.
export function trackStep(name) {
  track('step', { name })
}

function leavePage() {
  if (currentPath && pageStartedAt) {
    track('leave', { path: currentPath, duration_ms: Math.round(Date.now() - pageStartedAt) })
  }
}

let pricingWatch = null

// A new page in the app (called on every route change).
export function trackPage(path) {
  if (path === currentPath) return

  leavePage()
  currentPath = path
  pageStartedAt = Date.now()
  track('page')

  // The home page: did they scroll down to the prices?
  pricingWatch?.disconnect()
  pricingWatch = null

  if (path === '/' && 'IntersectionObserver' in window) {
    setTimeout(() => {
      const pricing = document.getElementById('pricing')

      if (!pricing) return

      pricingWatch = new IntersectionObserver((entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          trackStep('pricing_seen')
          pricingWatch?.disconnect()
          pricingWatch = null
        }
      }, { threshold: 0.25 })
      pricingWatch.observe(pricing)
    }, 500)
  }
}

// The words of what was clicked: its data-track, label, or first line of text.
function clickName(element) {
  const words =
    element.getAttribute('data-track') ||
    element.getAttribute('aria-label') ||
    element.getAttribute('title') ||
    (element.innerText || element.textContent || '').split('\n')[0]

  return words.replace(/\s+/g, ' ').trim().slice(0, 80) || element.tagName.toLowerCase()
}

let started = false

// Once, when the app starts.
export function startAnalytics() {
  if (started || typeof window === 'undefined') return

  started = true

  document.addEventListener(
    'click',
    (event) => {
      const element = event.target?.closest?.('[data-track], button, a, [role="button"], [role="tab"], summary')

      // Typing fields are never read.
      if (!element || element.closest('input, textarea, select, [contenteditable="true"]')) return

      const name = clickName(element)

      track('click', { name })

      // On the home page, any link to sign-in is "Get an account".
      if (window.location.pathname === '/' && element.getAttribute('href') === '/login') trackStep('get_account')
    },
    { capture: true }
  )

  window.addEventListener('error', (event) => {
    track('error', { name: String(event.message || 'Error').slice(0, 120) })
  })

  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason

    track('error', { name: String(reason?.message || reason || 'Error').slice(0, 120) })
  })

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      leavePage()
      pageStartedAt = 0
      send({ leaving: true })
    } else if (currentPath) {
      pageStartedAt = Date.now()
    }
  })
}
