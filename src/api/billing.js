import { api, download } from './client'

/*
  Kodi's own billing: what a landlord pays Kodi. Amounts are whole
  shillings and always worked out by the server.
*/

// The owner's Billing tab. -> { status, open_invoice, plans, invoices, payments, discount, pending_payment }
export async function getMyBilling() {
  const { data } = await api.get('/api/subscriptions')

  return data
}

// Sends the M-Pesa prompt for the current bill, or a prepaid plan. -> { stk_id, amount, phone, status }
export async function payBill({ phone, planMonths = null }) {
  const { data } = await api.post('/api/subscriptions/pay', { phone, plan_months: planMonths })

  return data
}

// -> { stk_id, amount, status: sent | confirming | paid | failed | cancelled | expired, result_desc, mpesa_receipt }
export async function getPaymentRequest(stkId) {
  const { data } = await api.get(`/api/subscriptions/payment-requests/${stkId}`)

  return data
}

export function downloadReceipt(paymentId, { admin = false } = {}) {
  return download(admin ? `/api/admin/billing/receipts/${paymentId}` : `/api/subscriptions/receipts/${paymentId}`, {
    filename: `kodi-receipt-${paymentId}.pdf`,
  })
}

// Admin. -> { settings, plans, accounts, mpesa: { configured, environment } }
export async function getAdminBilling() {
  const { data } = await api.get('/api/admin/billing')

  return data
}

export async function getBillingAccount(ownerId) {
  const { data } = await api.get(`/api/admin/billing/owners/${ownerId}`)

  return data
}

export async function updateBillingSettings(changes) {
  const { data } = await api.put('/api/admin/billing/settings', changes)

  return data
}

export async function updatePlan(months, changes) {
  const { data } = await api.put(`/api/admin/billing/plans/${months}`, changes)

  return data
}

export async function extendTrial(ownerId, months, reason) {
  const { data } = await api.post(`/api/admin/billing/owners/${ownerId}/extend-trial`, { months, reason })

  return data
}

export async function giveFreeMonths(ownerId, months, reason) {
  const { data } = await api.post(`/api/admin/billing/owners/${ownerId}/free-months`, { months, reason })

  return data
}

// { kind: percent | amount, value, months (null: until ended), reason }
export async function giveDiscount(ownerId, discount) {
  const { data } = await api.post(`/api/admin/billing/owners/${ownerId}/discounts`, discount)

  return data
}

export async function endDiscount(discountId, reason) {
  const { data } = await api.post(`/api/admin/billing/discounts/${discountId}/end`, { reason })

  return data
}

// remainder: forgive | carry (added to the next bill)
export async function setBillAmount(invoiceId, { amount, remainder, reason }) {
  const { data } = await api.put(`/api/admin/billing/invoices/${invoiceId}/amount`, { amount, remainder, reason })

  return data
}

// { amount, method: cash | bank | mpesa_other | other, reference, paid_on, note }
export async function recordPayment(invoiceId, payment) {
  const { data } = await api.post(`/api/admin/billing/invoices/${invoiceId}/payments`, payment)

  return data
}

export async function requestPaymentFor(ownerId, phone) {
  const { data } = await api.post(`/api/admin/billing/owners/${ownerId}/request-payment`, phone ? { phone } : {})

  return data
}
