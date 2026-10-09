import { api } from './client'

// One row per caretaker-property assignment.
export async function listCaretakers() {
  const { data } = await api.get('/api/caretakers')

  return data
}

// body: { phone, first_name, last_name, permission_level }. Replaces the property's current caretaker.
export async function assignCaretaker(propertyId, body) {
  const { data } = await api.post(`/api/properties/${propertyId}/caretaker`, body)

  return data
}

// body: { first_name?, last_name?, permission_level?, status?: 'active' | 'inactive' }
// status 'inactive' removes the caretaker from the property.
export async function updatePropertyCaretaker(propertyId, body) {
  const { data } = await api.patch(`/api/properties/${propertyId}/caretaker`, body)

  return data
}
