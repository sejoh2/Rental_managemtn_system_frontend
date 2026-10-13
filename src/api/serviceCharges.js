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

// The bills this charge has made that can still be cancelled. -> { bills, tenants, billed, paid }
export async function getServiceChargeBilled(serviceChargeId) {
  const { data } = await api.get(`/api/service-charges/${serviceChargeId}/billed`)

  return data
}

// cancelBills also undoes the bills it already made; what tenants paid goes back to them as credit.
export function removeServiceCharge(serviceChargeId, cancelBills = false) {
  return api.delete(
    `/api/service-charges/${serviceChargeId}${cancelBills ? '?cancel_bills=true' : ''}`
  )
}
