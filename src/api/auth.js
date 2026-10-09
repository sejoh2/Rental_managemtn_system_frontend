import { api, getRefreshToken, request } from './client'

// -> { message, expires_in_seconds, resend_in_seconds }
export function requestOtp(phone) {
  return request('/api/auth/request-otp', { method: 'POST', body: { phone }, auth: false })
}

// -> { user, access_token, refresh_token }
export function verifyOtp(phone, code) {
  return request('/api/auth/verify-otp', { method: 'POST', body: { phone, code }, auth: false })
}

export async function fetchCurrentUser() {
  const { user } = await api.get('/api/auth/me')

  return user
}

export function logout() {
  return request('/api/auth/logout', {
    method: 'POST',
    body: { refresh_token: getRefreshToken() },
    auth: false,
  })
}
