import { api } from './client'

// One row per caretaker-property assignment.
export async function listCaretakers() {
  const { data } = await api.get('/api/caretakers')

  return data
}

// -> { caretaker, assignments, activity_last_30_days: { water_readings, maintenance_reports, expenses_recorded } }
export async function getCaretaker(caretakerId) {
  const { data } = await api.get(`/api/caretakers/${caretakerId}`)

  return data
}

// The caretaker's own details, whichever properties they have.
// body: { first_name?, last_name?, phone?, status?: 'active' | 'suspended' }
// 'suspended' stops them signing in but keeps their properties.
export async function updateCaretaker(caretakerId, body) {
  const { data } = await api.patch(`/api/caretakers/${caretakerId}`, body)

  return data
}

// body: { phone, first_name, last_name, permission_level }. Replaces the property's current caretaker.
// A caretaker can be assigned to several properties, one call per property.
export async function assignCaretaker(propertyId, body) {
  const { data } = await api.post(`/api/properties/${propertyId}/caretaker`, body)

  return data
}

// Whether the property's caretaker may record payments handed to them (cash, cheque, bank).
// Off for every new assignment. -> { assignment_id, property_id, caretaker_id, can_record_payments }
export async function setCaretakerPaymentPermission(propertyId, allowed) {
  const { data } = await api.put(`/api/properties/${propertyId}/caretaker/payment-permission`, {
    allowed,
  })

  return data
}

// body: { first_name?, last_name?, permission_level?, status?: 'active' | 'inactive' }
// status 'inactive' removes the caretaker from the property.
export async function updatePropertyCaretaker(propertyId, body) {
  const { data } = await api.patch(`/api/properties/${propertyId}/caretaker`, body)

  return data
}
