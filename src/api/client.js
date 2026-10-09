export const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8080').replace(/\/+$/, '')

const ACCESS_TOKEN_KEY = 'kodi_access_token'
const REFRESH_TOKEN_KEY = 'kodi_refresh_token'

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

export function getAccessToken() {
  return localStorage.getItem(ACCESS_TOKEN_KEY)
}

export function getRefreshToken() {
  return localStorage.getItem(REFRESH_TOKEN_KEY)
}

export function hasSession() {
  return Boolean(getRefreshToken())
}

export function setTokens({ access_token, refresh_token }) {
  localStorage.setItem(ACCESS_TOKEN_KEY, access_token)
  localStorage.setItem(REFRESH_TOKEN_KEY, refresh_token)
}

export function clearTokens() {
  localStorage.removeItem(ACCESS_TOKEN_KEY)
  localStorage.removeItem(REFRESH_TOKEN_KEY)
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

async function send(path, { method = 'GET', body, query, auth = true } = {}) {
  const headers = {}

  if (body !== undefined) headers['Content-Type'] = 'application/json'
  if (auth && getAccessToken()) headers.Authorization = `Bearer ${getAccessToken()}`

  try {
    return await fetch(buildUrl(path, query), {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
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

  if (!response.ok) throw await toApiError(response)

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
