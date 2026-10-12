import { api } from './client'

// Units billed by entered amount, for one month ('YYYY-MM'; the current month by default).
// -> { period, bills: [{ unit_id, unit_number, tenant_id, tenant_name, amount, amount_paid, status }] }
export async function listElectricityBills(propertyId, period) {
  const { data } = await api.get(`/api/properties/${propertyId}/electricity-bills`, { period })

  return data
}

// bills: [{ unit_id, amount }]. An amount replaces what was entered before; 0 removes an unpaid bill.
export async function saveElectricityBills(propertyId, period, bills) {
  const { data } = await api.put(`/api/properties/${propertyId}/electricity-bills`, {
    period,
    bills,
  })

  return data
}
