const numberFormat = new Intl.NumberFormat('en-KE', { maximumFractionDigits: 2 })

export function formatNumber(value) {
  return numberFormat.format(Number(value) || 0)
}

export function formatKES(value) {
  return `KES ${formatNumber(value)}`
}

// 512000 -> "KES 512K", for tight spaces like property cards.
export function formatKESCompact(value) {
  const amount = Number(value) || 0

  if (Math.abs(amount) >= 1_000_000) return `KES ${formatNumber((amount / 1_000_000).toFixed(1))}M`
  if (Math.abs(amount) >= 1_000) return `KES ${formatNumber(Math.round(amount / 1_000))}K`

  return formatKES(amount)
}

export function formatPercent(value) {
  return `${formatNumber(value)}%`
}

function toDate(value) {
  if (!value) return null

  const date = value instanceof Date ? value : new Date(value)

  return Number.isNaN(date.getTime()) ? null : date
}

// "3 Jul 2026"
export function formatDate(value, fallback = '-') {
  const date = toDate(value)

  return date
    ? date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    : fallback
}

// "3 Jul, 2:14 PM"
export function formatDateTime(value, fallback = '-') {
  const date = toDate(value)

  if (!date) return fallback

  const day = date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
  const time = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })

  return `${day}, ${time}`
}

// "Jul 2026"
export function formatMonth(value, fallback = '-') {
  const date = toDate(value)

  return date ? date.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' }) : fallback
}

// Local "YYYY-MM-DD", the format the backend expects for date-only fields.
export function toDateInput(value = new Date()) {
  const date = toDate(value)

  if (!date) return ''

  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${date.getFullYear()}-${month}-${day}`
}

// "+254712345678" -> "0712 345 678"
export function formatPhone(value, fallback = '-') {
  if (!value) return fallback

  const digits = String(value).replace(/\D/g, '')
  const local = digits.startsWith('254') ? `0${digits.slice(3)}` : digits

  return local.length === 10
    ? `${local.slice(0, 4)} ${local.slice(4, 7)} ${local.slice(7)}`
    : String(value)
}

// "John Otieno" -> "JO"
export function initials(name) {
  const parts = String(name || '').trim().split(/\s+/).filter(Boolean)

  if (!parts.length) return '?'

  return (parts[0][0] + (parts.length > 1 ? parts.at(-1)[0] : '')).toUpperCase()
}

// 5 -> "5th", 21 -> "21st"
export function ordinal(value) {
  const number = Number(value)
  const lastTwo = number % 100

  if (lastTwo >= 11 && lastTwo <= 13) return `${number}th`

  return `${number}${{ 1: 'st', 2: 'nd', 3: 'rd' }[number % 10] || 'th'}`
}

// "one_bedroom" -> "One bedroom"
export function humanize(value, fallback = '-') {
  if (!value) return fallback

  const text = String(value).replace(/_/g, ' ')

  return text.charAt(0).toUpperCase() + text.slice(1)
}
