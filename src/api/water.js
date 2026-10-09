import { api } from './client'

// filters: { billing_period?, status? }
export async function listWaterReadings(propertyId, filters) {
  const { data } = await api.get(`/api/properties/${propertyId}/water-readings`, filters)

  return data
}
