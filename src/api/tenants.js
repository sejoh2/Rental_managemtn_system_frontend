import { ApiError, api, download } from './client'

// All tenants across the owner's properties, each with balance and credit_balance.
export async function listTenants(filters) {
  const { data } = await api.get('/api/tenants', filters)

  return data
}

export async function getTenant(tenantId) {
  const { data } = await api.get(`/api/tenants/${tenantId}`)

  return data
}

// body: { unit_id, full_name, phone, email?, national_id?, move_in_date }
export async function createTenant(propertyId, body) {
  const { data } = await api.post(`/api/properties/${propertyId}/tenants`, body)

  return data
}

export async function updateTenant(tenantId, body) {
  const { data } = await api.patch(`/api/tenants/${tenantId}`, body)

  return data
}

// Puts back a tenant moved out by mistake; their bills return to what they were before.
// Refused once the deposits are reconciled (reopen that first) or the unit has a new tenant.
export async function undoMoveOut(tenantId, reason) {
  const { data } = await api.post(`/api/tenants/${tenantId}/undo-move-out`, { reason })

  return data
}

// body: { move_out_date, move_out_reason? }. Deposits are reconciled afterwards, below.
export async function moveOutTenant(tenantId, body) {
  const { data } = await api.post(`/api/tenants/${tenantId}/move-out`, body)

  return data
}

/*
  Deposit reconciliation for a tenant who has moved out.
  -> { status: 'open', groups, credit_held } until confirmed,
     { status: 'confirmed', settlement } afterwards.
  Each group is one deposit: { key, deposit_charged, held, items, unpaid, covered, left, shortfall }.
*/
export async function getDepositReconciliation(tenantId) {
  const { data } = await api.get(`/api/tenants/${tenantId}/deposit-reconciliation`)

  return data
}

// deductions: [{ description, amount }]. Nothing is saved.
// -> the groups plus { deposits_held, credit_held, unpaid_total, refund_due, tenant_owes }
export async function calculateDepositReconciliation(tenantId, deductions) {
  const { data } = await api.post(`/api/tenants/${tenantId}/deposit-reconciliation/calculate`, {
    deductions,
  })

  return data
}

// Undoes a confirmed reconciliation so it can be corrected and confirmed again.
// Refused once the refund is recorded as paid, or the tenant has paid since.
export async function reopenDepositReconciliation(tenantId, reason) {
  const { data } = await api.post(`/api/tenants/${tenantId}/deposit-reconciliation/reopen`, {
    reason,
  })

  return data
}

// Final: uses the deposits for the unpaid bills and deductions and fixes the refund or debt.
export async function confirmDepositReconciliation(tenantId, deductions) {
  const { data } = await api.post(`/api/tenants/${tenantId}/deposit-reconciliation/confirm`, {
    deductions,
  })

  return data
}

// body: { paid_on, method, reference? }
export async function recordDepositRefund(tenantId, body) {
  const { data } = await api.post(`/api/tenants/${tenantId}/deposit-reconciliation/refund`, body)

  return data
}

// -> { tenant, period, charges, payments, outstanding_balance, credit_balance }
export async function getTenantStatement(tenantId, period = 'this_year') {
  const { data } = await api.get(`/api/reports/tenants/${tenantId}/statement`, { period })

  return data
}

export async function listTenantPayments(tenantId) {
  const { data } = await api.get(`/api/tenants/${tenantId}/payments`)

  return data
}

// body: { amount, payment_method, account_for, received_at?, reference?, notes? }
export async function recordManualPayment(tenantId, body) {
  const { data } = await api.post(`/api/tenants/${tenantId}/payments/manual`, body)

  return data
}

// Resolves with null when the tenant has no agreement yet.
export async function getTenantAgreement(tenantId) {
  try {
    const { data } = await api.get(`/api/tenants/${tenantId}/agreement`)

    return data
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null

    throw error
  }
}

export async function generateTenantAgreement(tenantId) {
  const { data } = await api.post(`/api/tenants/${tenantId}/agreement/generate`)

  return data
}

export function downloadTenantAgreement(tenantId) {
  return download(`/api/tenants/${tenantId}/agreement/download`, {
    filename: 'tenancy-agreement.pdf',
  })
}
