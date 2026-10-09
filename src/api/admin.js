import { api } from './client'

// Admin only. Every account in the system.
export async function listUsers() {
  const { data } = await api.get('/api/users')

  return data
}

export async function promoteToOwner(userId) {
  const { data } = await api.post(`/api/users/${userId}/promote-owner`)

  return data
}

export async function deactivateUser(userId) {
  const { data } = await api.post(`/api/users/${userId}/deactivate`)

  return data
}

export async function activateUser(userId) {
  const { data } = await api.post(`/api/users/${userId}/activate`)

  return data
}

// filters: { owner_id?, user_id?, action?, from_date?, to_date?, limit, offset }
// -> { total, logs: [{ id, action, entity_type, entity_id, metadata, ip_address, actor, account, created_at }] }
export async function listAuditLogs(filters) {
  const { total, data } = await api.get('/api/admin/audit-logs', filters)

  return { total, logs: data }
}

// The action names present in the log, for the filter.
export async function listAuditActions() {
  const { data } = await api.get('/api/admin/audit-logs/actions')

  return data
}
