import { api, download } from './client'

/*
  filters: { property_id?, period? } - period is one of REPORT_PERIODS (utils/labels).
  -> { property_name, period: { start_date, end_date }, occupancy, arrears, collection,
       water, expenses, sms }
  Income in `collection` uses the same definition as the Expenses page.
*/
export async function getReport(filters) {
  const { data } = await api.get('/api/reports/dashboard', filters)

  return data
}

// filters: { type, property_id?, period, format: 'pdf' | 'csv' }.
// The file is built by the backend and the export is recorded in the audit log.
export function exportReport(filters) {
  return download('/api/reports/export', {
    query: filters,
    filename: `report.${filters.format}`,
  })
}

// The download is recorded in the audit log.
export function downloadTenantStatement(tenantId, period) {
  return download(`/api/reports/tenants/${tenantId}/statement/download`, {
    query: { period },
    filename: 'tenant-statement.pdf',
  })
}
