export const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8080').replace(/\/+$/, '')

const ACCESS_TOKEN_KEY = 'kodi_access_token'
const REFRESH_TOKEN_KEY = 'kodi_refresh_token'

// The owner account a system admin has opened: { user_id, name }. Kept for this browser tab only.
const ACTING_OWNER_KEY = 'kodi_acting_owner'

export function getActingOwner() {
  try {
    return JSON.parse(sessionStorage.getItem(ACTING_OWNER_KEY))
  } catch {
    return null
  }
}

export function setActingOwner(owner) {
  if (owner) sessionStorage.setItem(ACTING_OWNER_KEY, JSON.stringify(owner))
  else sessionStorage.removeItem(ACTING_OWNER_KEY)
}

export class ApiError extends Error {
  constructor(message, { status = 0, details = [], payload = null } = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.details = details
    // Full error body, for endpoint-specific extras such as attempts_remaining.
    this.payload = payload
  }
}

/*
  Where the session is kept. An owner's session stays in the browser, so
  they are still signed in when they come back. The system admin's session
  is kept only in the tab it was opened in: closing the tab, or the browser,
  signs the admin out, and a new tab asks them to sign in again.
*/
function sessionStore() {
  return sessionStorage.getItem(REFRESH_TOKEN_KEY) ? sessionStorage : localStorage
}

export function getAccessToken() {
  return sessionStore().getItem(ACCESS_TOKEN_KEY)
}

export function getRefreshToken() {
  return sessionStore().getItem(REFRESH_TOKEN_KEY)
}

export function hasSession() {
  return Boolean(getRefreshToken())
}

function forgetTokens() {
  for (const store of [localStorage, sessionStorage]) {
    store.removeItem(ACCESS_TOKEN_KEY)
    store.removeItem(REFRESH_TOKEN_KEY)
  }
}

// tabOnly: true for the admin, false for everyone else. Left out when a session is
// only being renewed, which keeps it where it already is.
export function setTokens({ access_token, refresh_token }, { tabOnly } = {}) {
  const store = tabOnly === undefined ? sessionStore() : tabOnly ? sessionStorage : localStorage

  forgetTokens()
  store.setItem(ACCESS_TOKEN_KEY, access_token)
  store.setItem(REFRESH_TOKEN_KEY, refresh_token)
}

// Moves a restored session to the right place once it is known whose it is.
export function keepSessionInTabOnly(tabOnly) {
  const access_token = getAccessToken()
  const refresh_token = getRefreshToken()

  if (access_token && refresh_token) setTokens({ access_token, refresh_token }, { tabOnly })
}

export function clearTokens() {
  forgetTokens()
  setActingOwner(null)
}

let sessionExpiredHandler = null

// Called once when the session can no longer be refreshed, so the app can return to sign-in.
export function onSessionExpired(handler) {
  sessionExpiredHandler = handler
}

function buildUrl(path, query) {
  const url = new URL(`${API_URL}${path}`)

  Object.entries(query || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, value)
    }
  })

  return url
}

// file: a File or Blob sent as it is, instead of a JSON body.
async function send(path, { method = 'GET', body, file, query, auth = true } = {}) {
  const headers = {}

  if (file) headers['Content-Type'] = file.type || 'application/octet-stream'
  else if (body !== undefined) headers['Content-Type'] = 'application/json'
  if (auth && getAccessToken()) headers.Authorization = `Bearer ${getAccessToken()}`
  // An admin inside an owner's account: the backend runs the request as that owner.
  // It ignores this on the admin's own pages and for anyone who is not an admin.
  if (auth && getActingOwner()) headers['X-Acting-Owner-Id'] = String(getActingOwner().user_id)

  try {
    return await fetch(buildUrl(path, query), {
      method,
      headers,
      body: file || (body === undefined ? undefined : JSON.stringify(body)),
    })
  } catch {
    throw new ApiError(`Cannot reach the server at ${API_URL}. Check that the backend is running.`)
  }
}

async function toApiError(response) {
  let payload = null

  try {
    payload = await response.json()
  } catch {
    // Non-JSON error body; fall back to the status text below.
  }

  const details = Array.isArray(payload?.details) ? payload.details : []
  const detailText = details
    .map((detail) => (detail.field ? `${detail.field}: ${detail.message}` : detail.message))
    .join(' ')

  const message = [payload?.error || `Request failed (${response.status}).`, detailText]
    .filter(Boolean)
    .join(' ')

  return new ApiError(message, { status: response.status, details, payload })
}

let refreshPromise = null

// The backend rotates refresh tokens, so concurrent 401s must share one refresh call.
function refreshSession() {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      const refresh_token = getRefreshToken()

      if (!refresh_token) return false

      const response = await send('/api/auth/refresh-token', {
        method: 'POST',
        body: { refresh_token },
        auth: false,
      })

      if (!response.ok) return false

      setTokens(await response.json())
      return true
    })().finally(() => {
      refreshPromise = null
    })
  }

  return refreshPromise
}

async function sendWithRefresh(path, options = {}) {
  let response = await send(path, options)

  if (response.status === 401 && options.auth !== false) {
    const refreshed = await refreshSession().catch(() => false)

    if (!refreshed) {
      clearTokens()
      sessionExpiredHandler?.()
      throw new ApiError('Your session has expired. Please sign in again.', { status: 401 })
    }

    response = await send(path, options)
  }

  if (!response.ok) {
    const error = await toApiError(response)

    // The Kodi bill is unpaid: the billing banner refreshes and explains.
    if (error.payload?.code === 'account_read_only') window.dispatchEvent(new Event('kodi-billing-changed'))

    throw error
  }

  return response
}

// Resolves with the parsed JSON body, e.g. { success, message, data }.
export async function request(path, options) {
  const response = await sendWithRefresh(path, options)

  return response.json()
}

export const api = {
  get: (path, query) => request(path, { query }),
  post: (path, body = {}) => request(path, { method: 'POST', body }),
  put: (path, body = {}) => request(path, { method: 'PUT', body }),
  patch: (path, body = {}) => request(path, { method: 'PATCH', body }),
  delete: (path) => request(path, { method: 'DELETE' }),
}

function filenameFromHeader(header) {
  const match = /filename="?([^";]+)"?/i.exec(header || '')

  return match ? match[1] : null
}

// Sends a file as the request body; what it belongs to goes in the query.
export function upload(path, file, query) {
  return request(path, { method: 'POST', file, query })
}

// Fetches a PDF/CSV with the auth header and hands it to the browser as a file download.
export async function download(path, { query, filename = 'download' } = {}) {
  const response = await sendWithRefresh(path, { query })
  const blob = await response.blob()
  const objectUrl = URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href = objectUrl
  link.download = filenameFromHeader(response.headers.get('Content-Disposition')) || filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(objectUrl)
}
