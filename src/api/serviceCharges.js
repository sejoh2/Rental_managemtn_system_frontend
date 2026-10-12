import { api } from './client'

// Each charge carries unit_amounts: [{ unit_id, unit_number, amount, custom }].
export async function listServiceCharges(propertyId) {
  const { data } = await api.get(`/api/properties/${propertyId}/service-charges`)

  return data
}

// -> the charge plus billing: { tenants_billed, total_billed } for tenants billed straight away.
export async function createServiceCharge(propertyId, body) {
  const { data } = await api.post(`/api/properties/${propertyId}/service-charges`, body)

  return data
}

export async function updateServiceCharge(serviceChargeId, body) {
  const { data } = await api.patch(`/api/service-charges/${serviceChargeId}`, body)

  return data
}

export function removeServiceCharge(serviceChargeId) {
  return api.delete(`/api/service-charges/${serviceChargeId}`)
}
