import { useState } from 'react'
import { promoteToOwner } from '../../api/admin'
import { Link } from 'react-router-dom'
import { Bell } from 'lucide-react'
import { getAdminNotifications } from '../../api/admin'
import SoundToggle from '../../components/common/SoundToggle'
import { useApi } from '../../hooks/useApi'
import { useNotificationSound } from '../../hooks/useNotificationSound'
import { formatDateTime, formatPhone } from '../../utils/format'

const panelClass =
  'absolute right-0 z-40 mt-2 w-[300px] overflow-hidden rounded-[8px] border border-[var(--line)] bg-[var(--surface)] shadow-[0_10px_24px_rgba(32,28,24,0.12)]'

const rowClass =
  'flex items-center justify-between gap-3 border-b border-[var(--line-soft)] px-3 py-[10px] text-[12px] last:border-b-0 hover:bg-[var(--line-soft)]'

// What each security alarm says, from the last 24 hours of sign-in activity.
const securityText = {
  failed_sign_ins: (item) => `${item.attempts} wrong codes for ${formatPhone(item.phone)}`,
  code_requests: (item) => `${item.attempts} codes requested for ${formatPhone(item.phone)}`,
  admin_sign_in_failed: (item) =>
    `${item.attempts} wrong ${item.attempts === 1 ? 'code' : 'codes'} for your own number`,
}

const planName = (months) => (months === 1 ? 'Monthly' : months === 12 ? '1 year' : `${months} months`)

/*
  A new account waiting to be made an owner. Make owner asks once more
  before it acts: it opens the account and starts the free trial.
*/
function WaitingPerson({ person, onDone }) {
  const [step, setStep] = useState('idle')
  const [error, setError] = useState(null)

  async function makeOwner() {
    if (step !== 'confirm') {
      setStep('confirm')
      return
    }

    setStep('busy')
    setError(null)

    try {
      await promoteToOwner(person.user_id)
      onDone()
    } catch (promoteError) {
      setError(promoteError)
      setStep('idle')
    }
  }

  return (
    <div className="border-b border-[var(--line-soft)] px-3 py-[10px] text-[12px] last:border-b-0">
      <div className="flex items-start justify-between gap-3">
        <span>
          <span className="font-bold text-[var(--accent-ink)]">New account: </span>
          {person.name || 'Name not given yet'} · {formatPhone(person.phone)}
          <span className="block text-[10px] text-[var(--ink-faint)]">
            Registered {formatDateTime(person.registered_at)}
            {person.requested_plan_months ? ` · chose ${planName(person.requested_plan_months)}` : ''}
          </span>
        </span>
        <button
          type="button"
          disabled={step === 'busy'}
          onClick={makeOwner}
          className={`shrink-0 rounded-[6px] px-2 py-[5px] text-[11px] font-bold ${
            step === 'confirm' ? 'bg-[var(--accent)] text-white' : 'border border-[var(--line)] text-[var(--accent-ink)]'
          }`}
        >
          {step === 'busy' ? 'Opening...' : step === 'confirm' ? 'Confirm' : 'Make owner'}
        </button>
      </div>
      {step === 'confirm' ? (
        <p className="mt-1 text-[10px] text-[var(--ink-soft)]">Opens their owner account and starts the free trial. Tap Confirm.</p>
      ) : null}
      {error ? <p className="mt-1 text-[10px] text-[var(--danger)]">{error.message}</p> : null}
    </div>
  )
}

// What is waiting for the admin: sender IDs to approve, new accounts to open, billing and sign-in alarms.
function AdminBell() {
  const state = useApi('admin-notifications', getAdminNotifications)
  const [open, setOpen] = useState(false)
  const data = state.data
  // Updates the moment the server reports a change (live connection), and plays a
  // sound when the count goes up, if allowed.
  const { soundAllowed, setSoundAllowed } = useNotificationSound(
    data ? data.total : null,
    state.reload,
    'admin'
  )

  function toggle() {
    // Looked up again each time the list is opened.
    if (!open) state.reload()

    setOpen(!open)
  }

  return (
    <div className="relative">
      <button
        onClick={toggle}
        aria-label="Needs attention"
        className="relative flex h-9 w-9 items-center justify-center rounded-[8px] border border-[var(--line)] bg-[var(--surface)] text-[var(--ink-soft)]"
      >
        <Bell size={17} />
        {data?.total ? (
          <span className="absolute right-[7px] top-[7px] h-[7px] w-[7px] rounded-full bg-[var(--accent)]" />
        ) : null}
      </button>

      {open ? (
        <>
          {/* Clicking anywhere else closes the list. */}
          <button
            type="button"
            aria-label="Close"
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-30 cursor-default"
          />

          <div className={panelClass}>
            <div className="border-b border-[var(--line)] px-3 py-3 text-[12px] font-bold">
              Needs your attention
            </div>

            {!data ? (
              <div className="px-3 py-4 text-[11px] text-[var(--ink-faint)]">
                {state.error ? state.error.message : 'Checking...'}
              </div>
            ) : data.total ? (
              <>
                {data.pending_sender_ids ? (
                  <Link to="/admin/sms" onClick={() => setOpen(false)} className={rowClass}>
                    <span>
                      {data.pending_sender_ids} sender{' '}
                      {data.pending_sender_ids === 1 ? 'ID' : 'IDs'} waiting for approval
                    </span>
                    <span className="text-[11px] font-bold text-[var(--accent-ink)]">Review</span>
                  </Link>
                ) : null}

                {(data.waiting_people || []).map((person) => (
                  <WaitingPerson key={person.user_id} person={person} onDone={state.reload} />
                ))}
                {data.waiting_for_access > (data.waiting_people || []).length ? (
                  <Link to="/admin/users" onClick={() => setOpen(false)} className={rowClass}>
                    <span>{data.waiting_for_access - data.waiting_people.length} more new accounts waiting</span>
                    <span className="text-[11px] font-bold text-[var(--accent-ink)]">Users</span>
                  </Link>
                ) : null}

                {(data.long_unpaid || []).map((item) => (
                  <Link key={`unpaid-${item.owner_id}`} to={`/admin/billing/${item.owner_id}`} onClick={() => setOpen(false)} className={rowClass}>
                    <span>
                      <span className="font-bold text-[var(--danger)]">Billing: </span>
                      {item.name} has not paid for {item.days_overdue} days
                    </span>
                    <span className="text-[11px] font-bold text-[var(--accent-ink)]">Open</span>
                  </Link>
                ))}

                {data.payment_problems ? (
                  <Link to="/admin/audit-log?action=SUBSCRIPTION_PAYMENT_RESULT_MISMATCH" onClick={() => setOpen(false)} className={rowClass}>
                    <span>
                      <span className="font-bold text-[var(--danger)]">Billing: </span>
                      {data.payment_problems} M-Pesa {data.payment_problems === 1 ? 'payment needs' : 'payments need'} checking (in the past 30 days)
                    </span>
                    <span className="text-[11px] font-bold text-[var(--accent-ink)]">Log</span>
                  </Link>
                ) : null}

                {data.security.map((item) => (
                  <Link
                    key={`${item.kind}-${item.phone}`}
                    to="/admin/audit-log?action=LOGIN_FAILED"
                    onClick={() => setOpen(false)}
                    className={rowClass}
                  >
                    <span>
                      <span className="font-bold text-[var(--danger)]">Security: </span>
                      {securityText[item.kind](item)}
                      <span className="block text-[10px] text-[var(--ink-faint)]">
                        Last at {formatDateTime(item.last_at)}, in the past 24 hours
                      </span>
                    </span>
                    <span className="text-[11px] font-bold text-[var(--accent-ink)]">Log</span>
                  </Link>
                ))}
              </>
            ) : (
              <div className="px-3 py-4 text-[11px] text-[var(--ink-faint)]">
                Nothing needs your attention.
              </div>
            )}

            <SoundToggle allowed={soundAllowed} onChange={setSoundAllowed} />
          </div>
        </>
      ) : null}
    </div>
  )
}

export default AdminBell
