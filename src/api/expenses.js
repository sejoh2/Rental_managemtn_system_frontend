import { api } from './client'

// filters: { property_id?, category?, status?, from_date?, to_date? }
export async function listExpenses(filters) {
  const { data } = await api.get('/api/expenses', filters)

  return data
}

// Income excludes deposits. filters: { property_id?, from_date?, to_date? }
// -> { rent_collected, water_collected, electricity_collected, total_expenses, net_profit }
export async function getExpenseSummary(filters) {
  const { data } = await api.get('/api/expenses/summary', filters)

  return data
}

// body: { category, amount, expense_date, notes? }
export async function createExpense(propertyId, body) {
  const { data } = await api.post(`/api/properties/${propertyId}/expenses`, body)

  return data
}

// A voided expense stays on record but no longer counts towards totals.
export async function voidExpense(expenseId, reason) {
  const { data } = await api.post(`/api/expenses/${expenseId}/void`, { void_reason: reason })

  return data
}
