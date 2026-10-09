import { formatKES, formatNumber } from './format'

export function isCurrentTenant(tenant) {
  return tenant.status === 'active' || tenant.status === 'notice_given'
}

// The badge shown for a tenant in lists and on the profile. -> { label, tone }
export function tenantStatus(tenant) {
  if (!isCurrentTenant(tenant)) return { label: 'Moved out', tone: 'neutral' }
  if (tenant.status === 'notice_given') return { label: 'Notice given', tone: 'warning' }
  if (tenant.balance > 0) return { label: 'In arrears', tone: 'danger' }
  if (tenant.credit_balance > 0) return { label: 'Advance credit', tone: 'info' }

  return { label: 'Paid up', tone: 'success' }
}

// "- 3,000" when owing, "+ 2,000" when in credit, "KES 0" otherwise. -> { text, tone }
export function tenantBalance(tenant) {
  if (tenant.balance > 0) return { text: `- ${formatNumber(tenant.balance)}`, tone: 'danger' }
  if (tenant.credit_balance > 0) {
    return { text: `+ ${formatNumber(tenant.credit_balance)}`, tone: 'success' }
  }

  return { text: formatKES(0), tone: 'success' }
}
