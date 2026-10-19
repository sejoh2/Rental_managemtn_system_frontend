import { api, download } from './client'

// Admin only. Every account in the system.
export async function listUsers() {
  const { data } = await api.get('/api/users')

  return data
}

// -> { totals, owners: [{ user_id, name, phone, status, properties, units, tenants, ... }] }
export async function getAdminOverview() {
  const { data } = await api.get('/api/admin/overview')

  return data
}

// Records in the audit log that the admin opened this owner's account. -> { user_id, name, phone, status }
export async function openOwnerAccount(ownerId) {
  const { data } = await api.post(`/api/admin/owners/${ownerId}/open`)

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

// One entry in full, with other entries about the same record. -> { log, related }
export async function getAuditLog(logId) {
  const { data } = await api.get(`/api/admin/audit-logs/${logId}`)

  return data
}

// The action names present in the log, for the filter.
export async function listAuditActions() {
  const { data } = await api.get('/api/admin/audit-logs/actions')

  return data
}

// body: { full_name, phone }. The person signs in with that number; nothing is sent to them.
export async function createOwner(body) {
  const { data } = await api.post('/api/users', body)

  return data
}

// body: { full_name?, phone? }. Changing the phone signs the person out. Not allowed for the admin.
export async function updateUser(userId, body) {
  const { data } = await api.patch(`/api/users/${userId}`, body)

  return data
}

// Refused while the owner still has properties.
export async function demoteOwner(userId) {
  const { data } = await api.post(`/api/users/${userId}/demote-owner`)

  return data
}

// -> { owner, totals, properties, caretakers, recent_activity }
export async function getOwnerDetail(ownerId) {
  const { data } = await api.get(`/api/admin/owners/${ownerId}`)

  return data
}

// -> { pending_sender_ids, waiting_for_access, waiting_people: [{ user_id, name, phone, registered_at, requested_plan_months }],
//      security: [{ kind, phone, attempts, last_at }], long_unpaid, payment_problems, total }
export async function getAdminNotifications() {
  const { data } = await api.get('/api/admin/notifications')

  return data
}

// Safe facts about the server setup; never a key or a secret.
export async function getSystemStatus() {
  const { data } = await api.get('/api/admin/system')

  return data
}

// This month's SMS sent through the platform's own sender, per owner.
export async function getSmsUsage() {
  const { data } = await api.get('/api/admin/sms-usage')

  return data
}

// -> [{ id, owner_name, owner_phone, sender_id, status, note, property_names, requested_at, reviewed_at }]
export async function listSenderIds() {
  const { data } = await api.get('/api/admin/sender-ids')

  return data
}

// decision: 'approved' | 'rejected'
export async function reviewSenderId(requestId, decision, note) {
  const { data } = await api.post(`/api/admin/sender-ids/${requestId}/review`, {
    decision,
    note: note || null,
  })

  return data
}

// Same filters as listAuditLogs; downloads up to 5,000 rows as CSV.
export function exportAuditLog(filters) {
  return download('/api/admin/audit-logs/export', { query: filters, filename: 'kodi-audit-log.csv' })
}
