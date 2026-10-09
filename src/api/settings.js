import { api } from './client'

// -> { profile, defaults: { default_rent_due_day }, notifications }
export async function getSettings() {
  const { data } = await api.get('/api/settings')

  return data
}
