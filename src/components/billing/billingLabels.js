import { formatNumber } from '../../utils/format'

// Kodi's own bills. Amounts are whole shillings.
export const ksh = (amount) => `KSh ${formatNumber(amount)}`

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

// "2026-12-01" -> "1 December 2026" (text dates, so no time zone moves them).
export function dayLabel(day) {
  if (!day) return '-'

  const [year, month, date] = String(day).slice(0, 10).split('-').map(Number)

  return `${date} ${MONTHS[month - 1]} ${year}`
}

export function periodLabel(start, end) {
  const [a, b] = [start, end].map((day) => {
    const [year, month] = String(day).split('-').map(Number)

    return `${MONTHS[month - 1]} ${year}`
  })

  return a === b ? a : `${a} to ${b}`
}

// "23 days left", "1 day left", "ends today"
export function daysLeftText(days) {
  if (days <= 0) return 'ends today'

  return `${days} day${days === 1 ? '' : 's'} left`
}

// The grace period: "7 days left to pay", "last day to pay"
export function graceLeftText(days) {
  if (days <= 1) return 'last day to pay'

  return `${days} days left to pay`
}

export const STATE_LABELS = {
  trial: ['Free trial', 'info'],
  active: ['Paid', 'success'],
  grace: ['Grace period', 'warning'],
  read_only: ['Read-only', 'danger'],
}

export const INVOICE_STATUS = {
  open: ['Unpaid', 'warning'],
  paid: ['Paid', 'success'],
  void: ['Not charged', 'neutral'],
}

export const METHOD_LABELS = {
  mpesa_stk: 'M-Pesa',
  cash: 'Cash',
  bank: 'Bank transfer',
  mpesa_other: 'M-Pesa (other)',
  other: 'Other',
}

export const REQUEST_STATUS = {
  sending: 'Sending',
  sent: 'Waiting for PIN',
  confirming: 'Confirming',
  paid: 'Paid',
  failed: 'Failed',
  cancelled: 'Cancelled',
  expired: 'No answer',
}
