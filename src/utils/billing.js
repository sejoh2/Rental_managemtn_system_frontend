import { formatMonth } from './format'

/*
  Previews of what the backend will bill. The backend does the real
  calculation; these mirror its rules so forms can show the amount first.
*/

function dateParts(dateInput) {
  const [year, month, day] = dateInput.split('-').map(Number)

  return { year, month, day, daysInMonth: new Date(year, month, 0).getDate() }
}

// What a monthly amount comes to for the move-in month.
// -> { amount, days, daysInMonth }
export function moveInEstimate(policy, moveInDate, monthlyAmount) {
  const { day, daysInMonth } = dateParts(moveInDate)

  if (day === 1 || policy === 'full_month') {
    return { amount: monthlyAmount, days: daysInMonth, daysInMonth }
  }

  if (policy === 'free_until_next_month') {
    return { amount: 0, days: 0, daysInMonth }
  }

  const days = daysInMonth - day

  return { amount: Math.round((monthlyAmount * days) / daysInMonth), days, daysInMonth }
}

// What a monthly amount comes to for the move-out month.
// tenant.move_in_date matters only when the tenant moved in during that same month.
export function moveOutEstimate(property, tenant, moveOutDate, monthlyAmount) {
  const { year, month, day, daysInMonth } = dateParts(moveOutDate)

  if (property.move_out_billing !== 'prorated' || day === daysInMonth) {
    return { amount: monthlyAmount, days: daysInMonth, daysInMonth, prorated: false }
  }

  const movedIn = new Date(tenant.move_in_date)
  const sameMonth = movedIn.getFullYear() === year && movedIn.getMonth() + 1 === month
  const firstBilledDay =
    sameMonth && property.move_in_billing === 'prorated' && movedIn.getDate() !== 1
      ? movedIn.getDate()
      : 0
  const days = Math.max(day - firstBilledDay, 0)

  return {
    amount: Math.round((monthlyAmount * days) / daysInMonth),
    days,
    daysInMonth,
    prorated: true,
  }
}

const chargeNames = {
  rent: 'Rent',
  water: 'Water',
  electricity: 'Electricity',
  rent_deposit: 'Rent deposit',
  water_deposit: 'Water deposit',
  electricity_deposit: 'Electricity deposit',
}

// "Rent - Oct 2026", "Rent deposit", "Garbage - Oct 2026", "Gate remote"
export function chargeLabel(charge) {
  // Service charges and repairs carry their own name.
  const name = charge.description || chargeNames[charge.charge_type] || charge.charge_type

  // Deposits and one-off charges are not billed for a month; the backend dates them 1970.
  return new Date(charge.billing_period).getFullYear() <= 1970
    ? name
    : `${name} - ${formatMonth(charge.billing_period)}`
}
