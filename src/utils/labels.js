import { formatKES } from './format'

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
