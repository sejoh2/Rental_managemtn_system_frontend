import { api } from './client'

// One request. Opening it clears its "done by the caretaker" note on the owner's bell.
export async function getMaintenance(requestId) {
  const { data } = await api.get(`/api/maintenance/${requestId}`)

  return data
}

// Clears every "done by the caretaker" note on the owner's bell. -> { cleared }
export async function markRepairNoticesSeen() {
  const { data } = await api.post('/api/maintenance/notices/seen')

  return data
}

// filters: { property_id?, unit_id?, status?, priority? }
export async function listMaintenance(filters) {
  const { data } = await api.get('/api/maintenance', filters)

  return data
}

// body: { unit_id?, title, description?, category, priority, charge_to_tenant?, charge_timing? }.
// No unit means a common-area issue. charge_timing: 'now' | 'move_out'.
export async function reportMaintenance(propertyId, body) {
  const { data } = await api.post(`/api/properties/${propertyId}/maintenance`, body)

  return data
}

/*
  body: any of status, priority, assigned_vendor_name, estimated_cost, actual_cost,
  charge_to_tenant, resolution_notes, cancellation_reason.
  Resolving with an actual cost records it as an expense; with charge_to_tenant it is
  also charged to the tenant living in the unit. The tenant is not told automatically.
*/
export async function updateMaintenance(requestId, body) {
  const { data } = await api.patch(`/api/maintenance/${requestId}`, body)

  return data
}

// Sends the tenant an SMS about a repair charged to them. Sent only when asked; can be repeated.
// -> the request, with charge_sms_sent_at set.
export async function sendRepairChargeSms(requestId) {
  const { data } = await api.post(`/api/maintenance/${requestId}/charge-sms`)

  return data
}
