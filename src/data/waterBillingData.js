export const waterBillingStats = [
  { label: 'Billed this month', value: 'KES 84,300', note: '843 units consumed', tone: 'muted' },
  { label: 'Collected', value: 'KES 61,200', note: '72.6%', tone: 'success' },
  { label: 'Readings pending', value: '18', note: 'from caretakers', tone: 'danger' },
  { label: 'Flagged readings', value: '2', note: 'lower than previous', tone: 'danger' },
]

export const waterReadings = [
  { tenant: 'Faith Njeri - H12', previous: '120', current: '145', units: '25', bill: 'KES 2,500', status: 'Billed', tone: 'success' },
  { tenant: 'John Otieno - H44', previous: '88', current: '102', units: '14', bill: 'KES 1,400', status: 'Unpaid', tone: 'warning' },
  { tenant: 'Samuel Kiplagat - A2', previous: '310', current: '301', units: '-', bill: '-', status: 'Flagged: lower reading', tone: 'danger' },
]