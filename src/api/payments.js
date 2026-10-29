import { api, download } from './client'

// Every payment of the owner, newest first, each with applied_to allocations.
export async function listPayments() {
  const { data } = await api.get('/api/payments')

  return data
}

// One payment in full, with applied_to, property_name and recorded_by_name.
export async function getPayment(paymentId) {
  const { data } = await api.get(`/api/payments/${paymentId}`)

  return data
}

// Saves every payment as a CSV file built by the backend; the export is recorded in the audit log.
// filters: { property_id?, status?, from_date?, to_date? }
export function exportPayments(filters) {
  return download('/api/payments/export', { query: filters, filename: 'payments.csv' })
}

// -> { received_today, received_today_count, auto_match_rate, unmatched_count }
export async function getPaymentStats() {
  const { data } = await api.get('/api/payments/stats')

  return data
}

// body: { tenant_id, remember_payment_phone }
export async function matchPayment(paymentId, body) {
  const { data } = await api.post(`/api/payments/${paymentId}/match`, body)

  return data
}

// "Not a tenant payment": an unmatched payment leaves the list and the money received.
export async function dismissPayment(paymentId, reason) {
  const { data } = await api.post(`/api/payments/${paymentId}/dismiss`, { reason })

  return data
}

// Puts a dismissed payment back under unmatched payments.
export async function restorePayment(paymentId) {
  const { data } = await api.post(`/api/payments/${paymentId}/restore`)

  return data
}

/*
  Unmatched M-Pesa payments that may be the money about to be recorded by hand.
  -> { already_recorded: { tenant_name, received_on, amount } | null,
       candidates: [{ id, amount, provider_transaction_id, payer_phone, received_at_local, reasons }] }
*/
export async function getPossibleDuplicates(tenantId, { amount, reference }) {
  const { data } = await api.get(`/api/tenants/${tenantId}/payments/possible-duplicates`, {
    amount: amount || undefined,
    reference: reference || undefined,
  })

  return data
}

// A manual payment becomes "reversed"; an M-Pesa payment goes back to "unmatched".
export async function reversePayment(paymentId, reason) {
  const { data } = await api.post(`/api/payments/${paymentId}/reverse`, { reason })

  return data
}
