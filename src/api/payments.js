import { api } from './client'

// Every payment of the owner, newest first, each with applied_to allocations.
export async function listPayments() {
  const { data } = await api.get('/api/payments')

  return data
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

// A manual payment becomes "reversed"; an M-Pesa payment goes back to "unmatched".
export async function reversePayment(paymentId, reason) {
  const { data } = await api.post(`/api/payments/${paymentId}/reverse`, { reason })

  return data
}
