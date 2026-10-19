/*
  The pricing card someone picked on the home page (1, 3, 6 or 12
  months), kept in this browser for 30 days, so that once their owner
  account is open they land on Billing with that card ready to pay.
*/
const KEY = 'kodi_chosen_plan'
const KEEP_MS = 30 * 24 * 3600 * 1000

export function saveChosenPlan(months) {
  const value = Number(months)

  if (![1, 3, 6, 12].includes(value)) return

  try {
    localStorage.setItem(KEY, JSON.stringify({ months: value, at: Date.now() }))
  } catch {
    // Private browsing: the choice is simply not remembered.
  }
}

export function readChosenPlan() {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY))

    return saved && Date.now() - saved.at < KEEP_MS ? saved.months : null
  } catch {
    return null
  }
}

export function clearChosenPlan() {
  try {
    localStorage.removeItem(KEY)
  } catch {
    // Nothing to clear.
  }
}

export function planLabel(months) {
  if (months === 1) return 'Monthly'
  if (months === 12) return '1 year'

  return `${months} months`
}
