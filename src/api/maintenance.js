import { api } from './client'

// filters: { property_id?, unit_id?, status?, priority? }
export async function listMaintenance(filters) {
  const { data } = await api.get('/api/maintenance', filters)

  return data
}

// body: { unit_id?, title, description?, category, priority }. No unit means a common-area issue.
export async function reportMaintenance(propertyId, body) {
  const { data } = await api.post(`/api/properties/${propertyId}/maintenance`, body)

  return data
}

/*
  body: any of status, priority, assigned_vendor_name, estimated_cost, actual_cost,
  charge_to_tenant, resolution_notes, cancellation_reason.
  Resolving with an actual cost records it as an expense; with charge_to_tenant it is
  also charged to the tenant living in the unit.
*/
export async function updateMaintenance(requestId, body) {
  const { data } = await api.patch(`/api/maintenance/${requestId}`, body)

  return data
}
