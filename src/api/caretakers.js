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

// body: { phone, first_name, last_name, permissions? }. Replaces the property's current caretaker.
// permissions: any of the switches in CARETAKER_PERMISSIONS (utils/labels); the rest take the defaults.
// A caretaker can be assigned to several properties, one call per property.
export async function assignCaretaker(propertyId, body) {
  const { data } = await api.post(`/api/properties/${propertyId}/caretaker`, body)

  return data
}

// body: { first_name?, last_name?, permissions?, status?: 'active' | 'inactive' }
// status 'inactive' removes the caretaker from the property.
export async function updatePropertyCaretaker(propertyId, body) {
  const { data } = await api.patch(`/api/properties/${propertyId}/caretaker`, body)

  return data
}
