/*
  Payment accounts that share: water, electricity and service charges can
  each have an M-Pesa account of their own, or be paid into the rent
  account or another account the property has. Used by the Add property
  and Edit property forms, and the payment pages.
*/

// [kind, slot title, what the bills are called]
export const SHARED_KINDS = [
  ['water', 'Water account', 'Water'],
  ['electricity', 'Electricity account', 'Electricity'],
  ['service', 'Service charges account', 'Service charges and repairs'],
]

// The property setting that holds each kind's chosen account.
export const CHARGE_ACCOUNT_FIELD = {
  water: 'water_charge_account',
  electricity: 'electricity_charge_account',
  service: 'service_charge_account',
}

export const ACCOUNT_NAMES = { rent: 'rent', water: 'water', electricity: 'electricity' }

// Accounts a kind can use instead of its own: rent always, water or electricity when the property has them.
export function shareTargets(kind, hasAccount) {
  return ['rent', 'water', 'electricity'].filter(
    (target) => target !== kind && (target === 'rent' || hasAccount(target))
  )
}

// Where the kind's bills go: its own account, else the chosen one if it exists, else rent.
export function effectiveAccount(kind, chosen, hasAccount) {
  if (hasAccount(kind)) return kind

  return shareTargets(kind, hasAccount).includes(chosen) ? chosen : 'rent'
}

// What other bills an account also collects, e.g. "Also collects electricity and service charges."
export function alsoCollectsText(accountFor, chargeAccounts) {
  if (!chargeAccounts) return null

  const names = { water: 'water', electricity: 'electricity', service: 'service charges' }
  const extra = Object.keys(names).filter(
    (kind) => kind !== accountFor && chargeAccounts[kind] === accountFor
  )

  if (!extra.length) return null

  const list = extra.map((kind) => names[kind])
  const joined = list.length > 1 ? `${list.slice(0, -1).join(', ')} and ${list.at(-1)}` : list[0]

  return `Also collects ${joined}.`
}

export const PAYMENT_ORDERS = [
  ['fixed', 'In this order', 'Deposits, then rent, electricity, water, then service charges and repairs.'],
  ['oldest', 'Oldest bill first', 'The bill that was due first is paid first.'],
]

const BILL_NAMES = {
  rent: 'rent',
  electricity: 'electricity',
  water: 'water',
  service: 'service charges and repairs',
}

function joinList(items) {
  return items.length > 1 ? `${items.slice(0, -1).join(', ')} and ${items.at(-1)}` : items[0] || ''
}

/*
  The bills money into an account pays, in the fixed order, e.g.
  "rent, electricity and water". Money recorded by hand for a kind of bill
  always pays that kind too.
*/
export function billsPaidBy(accountFor, chargeAccounts) {
  const paidInto = { rent: 'rent', ...(chargeAccounts || {}) }

  return joinList(
    Object.keys(BILL_NAMES)
      .filter((kind) => kind === accountFor || paidInto[kind] === accountFor)
      .map((kind) => BILL_NAMES[kind])
  )
}

// The sentence under a payment's account: what it pays, in which order.
export function paymentAccountHint(accountFor, property) {
  if (!property?.charge_accounts) return null

  const order =
    property.payment_order === 'oldest'
      ? 'oldest bill first'
      : 'deposits first, then in the order rent, electricity, water, service charges'

  return `Pays ${billsPaidBy(accountFor, property.charge_accounts)} for this property, with their deposits: ${order}.`
}

// "rent account", "service charges account"
export function accountLabel(account) {
  return account === 'service' ? 'service charges account' : `${ACCOUNT_NAMES[account] || 'rent'} account`
}
