import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, Info, Lock } from 'lucide-react'
import { getMyBilling } from '../../api/billing'
import { dayLabel, ksh } from './billingLabels'

/*
  The owner's Kodi bill, at the top of every page: the last week of
  the trial, a bill in its grace days, or a read-only account.
  Refreshed every 5 minutes, after a payment, and whenever the
  server refuses a change because the account is read-only.
*/
function BillingBanner() {
  const [billing, setBilling] = useState(null)

  useEffect(() => {
    let cancelled = false
    const load = () =>
      getMyBilling().then(
        (data) => !cancelled && setBilling(data),
        () => {}
      )

    load()

    const timer = setInterval(load, 5 * 60 * 1000)

    window.addEventListener('kodi-billing-changed', load)

    return () => {
      cancelled = true
      clearInterval(timer)
      window.removeEventListener('kodi-billing-changed', load)
    }
  }, [])

  if (!billing) return null

  const { status, open_invoice: invoice } = billing
  const pay = (
    <Link to="/settings?tab=billing" className="ml-auto shrink-0 rounded-[6px] bg-[var(--accent)] px-3 py-[6px] text-[11px] font-bold text-white">
      Pay now
    </Link>
  )

  if (status.state === 'read_only') {
    return (
      <div role="alert" className="mb-5 flex flex-wrap items-center gap-3 rounded-[10px] border border-[var(--danger-line,var(--line))] bg-[var(--danger-soft)] px-4 py-3 text-[12px] text-[var(--danger)]">
        <Lock size={16} className="shrink-0" />
        <span>
          <b>Your account is read-only</b> because the Kodi bill{invoice ? ` of ${ksh(invoice.amount_due)}` : ''} is not paid. You can
          see and download everything, and tenants&apos; M-Pesa payments are still recorded, but nothing can be added, changed or sent.
          Paying unlocks it at once.
        </span>
        {pay}
      </div>
    )
  }

  if (status.state === 'grace') {
    return (
      <div className="mb-5 flex flex-wrap items-center gap-3 rounded-[10px] bg-[var(--warning-soft)] px-4 py-3 text-[12px] text-[var(--warning)]">
        <AlertTriangle size={16} className="shrink-0" />
        <span>
          <b>Payment due{invoice ? `: ${ksh(invoice.amount_due)}` : ''}.</b> Pay by {dayLabel(status.grace_ends_on)} to keep using Kodi
          fully; after that the account becomes read-only until it is paid.
        </span>
        {pay}
      </div>
    )
  }

  if (status.state === 'trial' && status.days_left <= 7) {
    return (
      <div className="mb-5 flex flex-wrap items-center gap-3 rounded-[10px] bg-[var(--info-soft)] px-4 py-3 text-[12px] text-[var(--info)]">
        <Info size={16} className="shrink-0" />
        <span>
          Your free trial ends on <b>{dayLabel(status.trial_ends_on)}</b>
          {status.days_left ? ` (in ${status.days_left} day${status.days_left === 1 ? '' : 's'})` : ' (today)'}. Kodi is then{' '}
          {ksh(status.monthly_price)} a month.
        </span>
        <Link to="/settings?tab=billing" className="ml-auto shrink-0 text-[11px] font-bold underline">
          See billing
        </Link>
      </div>
    )
  }

  return null
}

export default BillingBanner
