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

// body: { move_out_date, deposit_refund_decision?, move_out_reason? }
export async function moveOutTenant(tenantId, body) {
  const { data } = await api.post(`/api/tenants/${tenantId}/move-out`, body)

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
