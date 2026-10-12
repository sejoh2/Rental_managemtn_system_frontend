import { api } from './client'

/*
  Figures for the Dashboard home; propertyId narrows them to one property.
  -> { rent: { collected, collected_last_month, change_percent, outstanding, units_in_arrears },
       occupancy, unmatched_payments: { count, latest }, water, rent_by_month, activity }
*/
export async function getDashboardHome(propertyId) {
  const { data } = await api.get('/api/dashboard/home', { property_id: propertyId })

  return data
}

// What is waiting for the owner, for the bell in the top bar.
// -> { unmatched_payments, flagged_readings, failed_sms, open_maintenance, total }
export async function getAttention() {
  const { data } = await api.get('/api/dashboard/attention')

  return data
}

// Tenants by name, phone, ID or house number; payments by M-Pesa code or reference.
// -> { tenants: [...], payments: [...] }
export async function searchEverything(text) {
  const { data } = await api.get('/api/dashboard/search', { q: text })

  return data
}
