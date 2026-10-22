import { api } from './client'

/*
  Admin > Analytics, for the last `days` days (7, 30 or 90; clicks are kept 90 days).
  -> { totals, daily, funnel, exits, sources, devices, pages, clicks, features, errors, monthly }
*/
export async function getAnalytics(days) {
  const { data } = await api.get('/api/analytics/summary', { days })

  return data
}
