import { api, download } from './client'

// filters: { property_id?, category?, status?, from_date?, to_date? }
export async function listExpenses(filters) {
  const { data } = await api.get('/api/expenses', filters)

  return data
}

// Saves the matching expenses as a CSV file built by the backend; the export is recorded in the audit log.
export function exportExpenses(filters) {
  return download('/api/expenses/export', { query: filters, filename: 'expenses.csv' })
}

// Income excludes deposits. filters: { property_id?, from_date?, to_date? }
// -> { rent_collected, water_collected, electricity_collected, service_collected,
//      repairs_collected, total_expenses, net_profit }
export async function getExpenseSummary(filters) {
  const { data } = await api.get('/api/expenses/summary', filters)

  return data
}

// What was spent per category against what tenants were charged for it and have paid.
// -> { categories: [{ category, spent, charged, paid, outstanding, owner_cost }], totals }
export async function getExpenseReconciliation(filters) {
  const { data } = await api.get('/api/expenses/reconciliation', filters)

  return data
}

// body: any of { category, amount, expense_date, notes, unit_id }. Owner only; not for an
// expense that came from a maintenance request, or a voided one.
export async function updateExpense(expenseId, body) {
  const { data } = await api.patch(`/api/expenses/${expenseId}`, body)

  return data
}

// body: { category, amount, expense_date, notes?, unit_id? }. No unit_id means the whole property.
export async function createExpense(propertyId, body) {
  const { data } = await api.post(`/api/properties/${propertyId}/expenses`, body)

  return data
}

// A voided expense stays on record but no longer counts towards totals.
export async function voidExpense(expenseId, reason) {
  const { data } = await api.post(`/api/expenses/${expenseId}/void`, { void_reason: reason })

  return data
}
