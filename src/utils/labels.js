import { formatKES, ordinal } from './format'

// [backend value, label] pairs for selects.
export const PROPERTY_TYPES = [
  ['apartment_block', 'Apartment block'],
  ['bedsitters', 'Bedsitters'],
  ['mixed_use', 'Mixed use'],
  ['single_rooms', 'Single rooms'],
]

// Saved in the browser, not in the backend.
export const THEME_MODES = [
  ['light', 'Light'],
  ['dark', 'Dark'],
  ['system', 'Follow device'],
]

// An owner's own sender ID is used only once the admin has approved it. status -> [label, tone]
export const SENDER_STATUS = {
  pending: ['Waiting for approval', 'warning'],
  approved: ['Approved', 'success'],
  rejected: ['Not approved', 'danger'],
}

// Default is saved as no sender ID at all.
export const SMS_SENDER_OPTIONS = [
  ['default', "Default (Africa's Talking)"],
  ['custom', 'My own sender ID'],
]

export const REPAIR_PAYER_LABELS = {
  owner: 'Owner (my cost)',
  tenant: 'Tenant',
}

export const REPAIR_CHARGE_TIMINGS = [
  ['now', 'Now: from their credit or next payment'],
  ['move_out', 'At move-out: deducted from their deposit'],
]

// expense.recovery.status -> [label, StatusBadge tone]
export const EXPENSE_RECOVERY = {
  owner_cost: ['Owner cost', 'neutral'],
  recovered: ['Recovered', 'success'],
  pending: ['Pending from tenant', 'warning'],
  at_move_out: ['To deduct at move-out', 'info'],
}

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

// How a unit's electricity is billed. 'none' is saved as a fixed monthly amount of nothing.
export const ELECTRICITY_BILLING = [
  ['none', 'Not billed'],
  ['fixed_monthly', 'Fixed amount every month'],
  ['entered', 'Amount I enter each month'],
]

export const MAINTENANCE_STATUSES = [
  ['reported', 'Reported'],
  ['in_progress', 'In progress'],
  ['resolved', 'Resolved'],
  ['cancelled', 'Cancelled'],
]

export const MAINTENANCE_CATEGORIES = [
  ['plumbing', 'Plumbing'],
  ['electrical', 'Electrical'],
  ['water', 'Water'],
  ['structural', 'Structural'],
  ['security', 'Security'],
  ['cleaning', 'Cleaning'],
  ['appliance', 'Appliance'],
  ['other', 'Other'],
]

export const MAINTENANCE_PRIORITIES = [
  ['low', 'Low'],
  ['normal', 'Normal'],
  ['high', 'High'],
  ['urgent', 'Urgent'],
]

export const REFUND_METHODS = [
  ['mpesa', 'M-Pesa'],
  ['cash', 'Cash'],
  ['bank', 'Bank transfer'],
  ['other', 'Other'],
]

// Periods end today, except last month, which is the whole month.
export const REPORT_PERIODS = [
  ['this_month', 'This month'],
  ['last_month', 'Last month'],
  ['last_3_months', 'Last 3 months'],
  ['last_6_months', 'Last 6 months'],
  ['this_year', 'This year'],
]

export const REPORT_TYPES = [
  ['full_monthly_summary', 'Full summary (income, rent, water, occupancy, arrears)'],
  ['rent_collection', 'Rent collection only'],
  ['water_billing', 'Water billing only'],
  ['occupancy_arrears', 'Occupancy and arrears only'],
  ['sms_usage', 'SMS usage only'],
]

export const SERVICE_CHARGE_FREQUENCIES = [
  ['monthly', 'Every month, with rent'],
  ['once', 'One-off - billed once per tenant'],
]

// When a new monthly charge first reaches the tenants already living in the property.
export const SERVICE_CHARGE_FIRST_BILLING = [
  ['now', 'Now, for the rest of this month'],
  ['next_billing', 'From the next monthly billing, on the 1st'],
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
