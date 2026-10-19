import { Link } from 'react-router-dom'
import { Clock } from 'lucide-react'
import { dayLabel, daysLeftText, graceLeftText } from './billingLabels'
import { useMyBilling } from './useMyBilling'

const tones = {
  info: 'border-[var(--info-soft)] bg-[var(--info-soft)] text-[var(--info)]',
  warning: 'border-[var(--warning-soft)] bg-[var(--warning-soft)] text-[var(--warning)]',
  danger: 'border-[var(--danger-soft)] bg-[var(--danger-soft)] text-[var(--danger)]',
}

/*
  The top bar, on every owner page: the days left in the free
  trial, or that a bill is due or the account is read-only. Opens
  Settings, Billing.
*/
function TrialCountdown() {
  const billing = useMyBilling()

  if (!billing) return null

  const { status } = billing
  let tone
  let text
  let short

  if (status.state === 'trial') {
    tone = status.days_left <= 7 ? 'warning' : 'info'
    text = `Free trial · ${daysLeftText(status.days_left)}`
    short = status.days_left <= 0 ? 'Trial ends today' : `${status.days_left}d trial`
  } else if (status.state === 'grace') {
    tone = 'warning'
    text = `Grace period · ${graceLeftText(status.grace_days_left)}`
    short = status.grace_days_left <= 1 ? 'Pay today' : `Pay in ${status.grace_days_left}d`
  } else if (status.state === 'read_only') {
    tone = 'danger'
    text = 'Read-only · pay to continue'
    short = 'Read-only'
  } else {
    return null
  }

  return (
    <Link
      to="/settings?tab=billing"
      title={
        status.state === 'trial'
          ? `Your free trial ends on ${dayLabel(status.trial_ends_on)}`
          : status.state === 'grace'
            ? `Pay by ${dayLabel(status.grace_ends_on)}; after that the account is read-only until paid`
            : text
      }
      className={`inline-flex shrink-0 items-center gap-[6px] rounded-full border px-3 py-[6px] text-[11px] font-bold ${tones[tone]}`}
    >
      <Clock size={13} />
      <span className="hidden sm:inline">{text}</span>
      <span className="sm:hidden">{short}</span>
    </Link>
  )
}

export default TrialCountdown
