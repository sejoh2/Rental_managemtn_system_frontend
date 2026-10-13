import { api } from './client'

// billingPeriod is any date in the month, as 'YYYY-MM-DD'.

// Each reading carries bill_status ('open' | 'partial' | 'paid' | 'void' | null).
// filters: { billing_period?, status? }
export async function listWaterReadings(propertyId, filters) {
  const { data } = await api.get(`/api/properties/${propertyId}/water-readings`, filters)

  return data
}

// -> { total_billed, total_collected, outstanding, open_bills, flagged_readings, pending_readings }
export async function getWaterStats(propertyId, billingPeriod) {
  const { data } = await api.get(`/api/properties/${propertyId}/water-billing/stats`, {
    billing_period: billingPeriod,
  })

  return data
}

// The unit's last recorded reading before this month's, which the next one starts from.
// -> { previous_reading: number | null }   null when the unit has never been read.
export async function getPreviousWaterReading(propertyId, unitId, billingPeriod) {
  const { data } = await api.get(
    `/api/properties/${propertyId}/units/${unitId}/water-readings/previous`,
    { billing_period: billingPeriod }
  )

  return data
}

// previous_reading may raise the starting point above the last recorded reading, never lower it.
// body: { billing_period, current_reading, previous_reading?, notes?, final_reading? }
// Each tenant is read once a month. final_reading adds one more for a tenant who was
// already read and is moving out; it is billed separately for the units used since.
// A reading lower than the previous one comes back flagged and unbilled.
export async function submitWaterReading(propertyId, unitId, body) {
  const { data } = await api.post(
    `/api/properties/${propertyId}/units/${unitId}/water-readings`,
    body
  )

  return data
}

// Cancels a submitted reading and its bill (reading.can_edit). What was paid returns as credit.
// A new reading can then be recorded for the same tenant and month.
// -> { id, status: 'rejected', returned_as_credit }
export async function cancelWaterReading(readingId, reason) {
  const { data } = await api.post(`/api/water-readings/${readingId}/cancel`, { reason })

  return data
}

// Corrects a submitted reading and its bill (reading.can_edit), from any month. The current
// reading cannot pass where the unit's next reading starts.
// body: { previous_reading?, current_reading?, notes? } -> the reading, with returned_as_credit
export async function editWaterReading(readingId, body) {
  const { data } = await api.patch(`/api/water-readings/${readingId}`, body)

  return data
}

// body: { action: 'approve', corrected_current_reading, notes? } | { action: 'reject', notes? }
export async function reviewWaterReading(readingId, body) {
  const { data } = await api.patch(`/api/water-readings/${readingId}/review`, body)

  return data
}

export async function updateWaterRules(propertyId, body) {
  const { data } = await api.put(`/api/properties/${propertyId}/water-billing-rules`, body)

  return data
}
