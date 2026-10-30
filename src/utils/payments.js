import { chargeLabel } from './billing'
import { humanize } from './format'

export const PAYMENT_METHODS = [
  ['cash', 'Cash'],
  ['mpesa', 'M-Pesa'],
  ['bank', 'Bank transfer'],
  ['other', 'Other'],
]

// The owner picks what the money is for; the backend settles the oldest matching charges first.
export const PAYMENT_ACCOUNTS = [
  ['rent', 'Rent'],
  ['water', 'Water'],
  ['electricity', 'Electricity'],
  ['service', 'Service charges'],
]

export const PAYMENT_ACCOUNT_HINTS = {
  rent: 'Settles the rent deposit first, then rent. It also covers the water and electricity deposits and bills, but only if this property has no separate account for them, and service charges if the property has them paid into the rent account.',
  water: 'Settles the water deposit and water bills, and service charges if the property has them paid into the water account.',
  electricity: 'Settles the electricity deposit and electricity bills, and service charges if the property has them paid into the electricity account.',
  service: 'Settles service charges, such as garbage or security, and repairs charged to the tenant.',
}

// "M-Pesa · auto-matched", "Cash · recorded manually"
export function paymentMethodLabel(payment) {
  const method =
    PAYMENT_METHODS.find(([value]) => value === payment.payment_method)?.[1] ||
    humanize(payment.payment_method)
  const how =
    payment.match_type === 'automatic'
      ? 'auto-matched'
      : payment.payment_source === 'manual'
        ? 'recorded manually'
        : payment.match_type === 'manual'
          ? 'matched manually'
          : ''

  return how ? `${method} · ${how}` : method
}

// "Rent deposit, Rent - Oct 2026"
export function appliedToLabel(payment) {
  if (payment.applied_to?.length) {
    return payment.applied_to.map((item) => chargeLabel(item)).join(', ')
  }

  return payment.status === 'matched' ? 'Held as credit' : '-'
}

// -> { label, tone } for a StatusBadge
export function paymentStatus(payment) {
  if (payment.status === 'matched') return { label: 'Matched', tone: 'success' }
  if (payment.status === 'unmatched') return { label: 'Unmatched', tone: 'warning' }
  if (payment.status === 'reversed') return { label: 'Reversed', tone: 'neutral' }
  if (payment.status === 'dismissed') return { label: 'Not a tenant payment', tone: 'neutral' }

  return { label: humanize(payment.status), tone: 'danger' }
}

// The day a time falls on in Kenya, as YYYY-MM-DD.
const kenyaDay = new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Nairobi' })

/*
  The payment figures for a list of payments, counted the way the backend's
  /api/payments/stats counts them; used when one property is chosen.
  Reversed payments, and those marked not a tenant payment, are not money received.
*/
export function paymentStatsFor(payments) {
  const today = kenyaDay.format(new Date())
  const received = payments.filter((payment) => payment.status === 'matched' || payment.status === 'unmatched')
  const receivedToday = received.filter(
    (payment) => kenyaDay.format(new Date(payment.received_at)) === today
  )
  const automatic = received.filter(
    (payment) => payment.status === 'matched' && payment.match_type === 'automatic'
  ).length

  return {
    // In cents, so the sum is exact.
    received_today: receivedToday.reduce((total, payment) => total + Math.round(payment.amount * 100), 0) / 100,
    received_today_count: receivedToday.length,
    auto_match_rate: received.length ? Math.round((automatic / received.length) * 100) : 0,
    unmatched_count: payments.filter((payment) => payment.status === 'unmatched').length,
  }
}
