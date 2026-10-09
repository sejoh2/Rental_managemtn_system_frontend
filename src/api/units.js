import { api } from './client'

// Each unit carries current_tenant: { tenant_id, full_name, status, balance } | null.
export async function listUnits(propertyId) {
  const { data } = await api.get(`/api/properties/${propertyId}/units`)

  return data
}

export async function createUnit(propertyId, body) {
  const { data } = await api.post(`/api/properties/${propertyId}/units`, body)

  return data
}

export async function updateUnit(unitId, body) {
  const { data } = await api.patch(`/api/units/${unitId}`, body)

  return data
}

export function archiveUnit(unitId) {
  return api.delete(`/api/units/${unitId}`)
}
