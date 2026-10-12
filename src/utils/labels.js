import { formatKES, ordinal } from './format'

// [backend value, label] pairs for selects.
export const PROPERTY_TYPES = [
  ['apartment_block', 'Apartment block'],
  ['bedsitters', 'Bedsitters'],
  ['mixed_use', 'Mixed use'],
  ['single_rooms', 'Single rooms'],
]

export const WATER_BILLING_METHODS = [
  ['per_unit_metered', 'Per-unit metered'],
  ['fixed_monthly', 'Fixed payment every month'],
  ['included_in_rent', 'Included in rent'],
]

// Day of the month rent is due. Capped at 28 so the day exists in every month.
export const RENT_DUE_DAYS = Array.from({ length: 28 }, (_, index) => [
  String(index + 1),
  `${ordinal(index + 1)} of every month`,
])

export function rentDueDayLabel(day) {
  return `${ordinal(day)} of every month`
}

// How the first month is billed when a tenant moves in part-way through it.
export const MOVE_IN_BILLING = [
  ['prorated', 'Pro-rated - bill only the days left in the month'],
  ['full_month', 'Full month'],
  ['free_until_next_month', 'Free until the 1st of next month'],
]

// How the last month is billed when a tenant moves out part-way through it.
export const MOVE_OUT_BILLING = [
  ['prorated', 'Pro-rated - bill only the days up to move-out'],
  ['full_month', 'Full month'],
]

export const UNIT_TYPES = [
  ['bedsitter', 'Bedsitter'],
  ['studio', 'Studio'],
  ['one_bedroom', 'One bedroom'],
  ['two_bedroom', 'Two bedroom'],
  ['three_bedroom', 'Three bedroom'],
  ['shop', 'Shop'],
  ['office', 'Office'],
  ['other', 'Other'],
]

export const UNIT_STATUSES = [
  ['vacant', 'Vacant'],
  ['occupied', 'Occupied'],
  ['reserved', 'Reserved'],
  ['maintenance', 'Under maintenance'],
]

export const EXPENSE_CATEGORIES = [
  ['repairs_maintenance', 'Repairs & maintenance'],
  ['security', 'Security'],
  ['garbage', 'Garbage'],
  ['cleaning', 'Cleaning'],
  ['utilities', 'Utilities'],
  ['other', 'Other'],
]

export const SERVICE_CHARGE_FREQUENCIES = [
  ['monthly', 'Every month, with rent'],
  ['once', 'One-off - billed once per tenant'],
]

// Where tenants pay service charges and repairs, by the property's service_charge_account.
export const SERVICE_CHARGE_ACCOUNTS = [
  ['rent', 'Rent account'],
  ['water', 'Water account'],
  ['electricity', 'Electricity account'],
  ['service', 'Their own account'],
]

export const PERMISSION_LEVELS = [
  ['level_1', 'Level 1 - View tenants, submit readings & reports'],
  ['level_2', 'Level 2 - Also add / edit tenants'],
]

export function optionLabel(options, value, fallback = '-') {
  return options.find(([optionValue]) => optionValue === value)?.[1] || fallback
}

// "Per-unit metered - KES 100/unit"
export function waterBillingLabel(property) {
  if (property.water_billing_method === 'per_unit_metered') {
    return `Per-unit metered - ${formatKES(property.water_rate_per_unit)}/unit`
  }

  if (property.water_billing_method === 'fixed_monthly') {
    return `Fixed monthly - ${formatKES(property.water_fixed_fee)}`
  }

  return 'Included in rent'
}

// "M-Pesa Paybill" / "M-Pesa Till"
export function paymentAccountTypeLabel(account) {
  return account.account_type === 'till' ? 'M-Pesa Till' : 'M-Pesa Paybill'
}
