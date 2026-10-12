import { api } from './client'

// -> { profile, defaults: { default_rent_due_day }, notifications }
export async function getSettings() {
  const { data } = await api.get('/api/settings')

  return data
}

// body: { full_name?, email? }. The phone number is the sign-in and cannot be changed here.
export async function updateProfile(body) {
  const { data } = await api.patch('/api/settings/profile', body)

  return data
}

// body: { default_rent_due_day }
export async function updateDefaults(body) {
  const { data } = await api.patch('/api/settings/defaults', body)

  return data
}

// body: any of the notification switches. Only alert_suspicious_water and
// remind_water_readings act today; the others are saved for later.
export async function updateNotifications(body) {
  const { data } = await api.patch('/api/settings/notifications', body)

  return data
}

// What the owner and their caretakers did, newest first.
export async function listActivity(limit = 12) {
  const { data } = await api.get('/api/settings/audit-logs', { limit })

  return data
}
