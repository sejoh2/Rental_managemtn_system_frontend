import { useCallback, useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Download, Smartphone } from 'lucide-react'
import { downloadReceipt, getMyBilling, getPaymentRequest, payBill } from '../../api/billing'
import { useApi } from '../../hooks/useApi'
import { formatDateTime, formatPhone } from '../../utils/format'
import { DataState, EmptyState, FormError } from '../common/DataState'
import { inputClass, labelClass, primaryButtonClass } from '../common/Modal'
import StatusBadge from '../common/StatusBadge'
import { INVOICE_STATUS, METHOD_LABELS, STATE_LABELS, dayLabel, ksh, periodLabel } from './billingLabels'
import PricingCards from './PricingCards'
import { clearChosenPlan, planLabel } from '../../utils/chosenPlan'

const cardClass = 'overflow-hidden rounded-[10px] border border-[var(--line)] bg-[var(--surface)]'
const cardHeaderClass = 'flex flex-wrap items-center justify-between gap-3 border-b border-[var(--line)] px-[18px] py-4'
const headRowClass = 'bg-[var(--bg)] text-left text-[9px] uppercase tracking-[0.05em] text-[var(--ink-faint)]'

/*
  Settings, Billing: where the owner stands with Kodi, paying by
  M-Pesa (the prompt goes to their sign-in phone unless they type
  another), paying ahead, and their bills and receipts.
*/
function BillingTab() {
  const state = useApi('billing', getMyBilling)
  const { reload: reloadBilling } = state
  // The page keeps showing while it reloads, so the "Paid" message stays.
  const reload = useCallback(() => {
    reloadBilling()
    window.dispatchEvent(new Event('kodi-billing-changed'))
  }, [reloadBilling])

  // A change made elsewhere (the admin ended the trial, a payment arrived) shows here at once.
  useEffect(() => {
    window.addEventListener('kodi-billing-changed', reloadBilling)

    return () => window.removeEventListener('kodi-billing-changed', reloadBilling)
  }, [reloadBilling])

  return (
    <DataState state={state} loadingLabel="Loading billing...">
      {(billing) => (
        <div className="grid gap-4">
          <div className="grid gap-4 lg:grid-cols-2">
            {billing.status.state === 'trial' ? <TrialCard status={billing.status} /> : null}
            {['grace', 'read_only'].includes(billing.status.state) ? <GraceCard status={billing.status} invoice={billing.open_invoice} /> : null}
            <StatusCard billing={billing} />
          </div>
          <PaySection billing={billing} onPaid={reload} />
          <History billing={billing} />
        </div>
      )}
    </DataState>
  )
}

// The trial's countdown: days left, the end date, what happens next.
function TrialCard({ status }) {
  const started = String(status.created_at).slice(0, 10)
  const total = Math.max(1, daysBetween(started, status.trial_ends_on) + 1)
  const used = Math.min(total, Math.max(0, total - status.days_left - 1))
  const percent = Math.round((used / total) * 100)
  const soon = status.days_left <= 7

  return (
    <section className={`${cardClass} px-[18px] py-5`}>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--accent-ink)]">Free trial</div>
          <div className={`mt-1 font-display text-[28px] font-semibold leading-none ${soon ? 'text-[var(--warning)]' : ''}`}>
            {status.days_left <= 0 ? 'Last day' : `${status.days_left} day${status.days_left === 1 ? '' : 's'} left`}
          </div>
        </div>
        <div className="text-[11px] text-[var(--ink-soft)] sm:text-right">
          Ends {dayLabel(status.trial_ends_on)}
          <div>First bill {dayLabel(nextDay(status.trial_ends_on))}: {ksh(status.monthly_price)}</div>
        </div>
      </div>
      <div className="mt-4 h-[8px] overflow-hidden rounded-full bg-[var(--line-soft)]" role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100} aria-label="Trial used">
        <div className={`h-full rounded-full ${soon ? 'bg-[var(--warning)]' : 'bg-[var(--accent)]'}`} style={{ width: `${percent}%` }} />
      </div>
      <p className="mt-3 text-[11px] leading-[1.5] text-[var(--ink-faint)]">
        Everything in Kodi is open during the trial. You can pay ahead at any time below; the trial days are not lost.
      </p>
    </section>
  )
}

// The grace period's countdown, or that the account is read-only.
function GraceCard({ status, invoice }) {
  const readOnly = status.state === 'read_only'
  const used = Math.min(status.grace_days, Math.max(0, status.grace_days - status.grace_days_left))
  const percent = readOnly ? 100 : Math.round((used / Math.max(1, status.grace_days)) * 100)

  return (
    <section className={`${cardClass} px-[18px] py-5`}>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className={`text-[10px] font-bold uppercase tracking-[0.08em] ${readOnly ? 'text-[var(--danger)]' : 'text-[var(--warning)]'}`}>
            {readOnly ? 'Read-only' : 'Grace period'}
          </div>
          <div className={`mt-1 font-display text-[28px] font-semibold leading-none ${readOnly ? 'text-[var(--danger)]' : 'text-[var(--warning)]'}`}>
            {readOnly ? 'Pay to continue' : status.grace_days_left <= 1 ? 'Last day to pay' : `${status.grace_days_left} days left to pay`}
          </div>
        </div>
        <div className="text-[11px] text-[var(--ink-soft)] sm:text-right">
          {invoice ? `Bill: ${ksh(invoice.amount_due)} for ${periodLabel(invoice.period_start, invoice.period_end)}` : null}
          <div>{readOnly ? `Read-only since ${dayLabel(nextDay(status.grace_ends_on))}` : `Pay by ${dayLabel(status.grace_ends_on)}`}</div>
        </div>
      </div>
      <div className="mt-4 h-[8px] overflow-hidden rounded-full bg-[var(--line-soft)]" role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100} aria-label="Grace period used">
        <div className={`h-full rounded-full ${readOnly ? 'bg-[var(--danger)]' : 'bg-[var(--warning)]'}`} style={{ width: `${percent}%` }} />
      </div>
      <p className="mt-3 text-[11px] leading-[1.5] text-[var(--ink-faint)]">
        {readOnly
          ? "Your account is read-only: you can see and download everything and tenants' M-Pesa payments are still recorded, but nothing can be added, changed or sent until the bill is paid. Paying unlocks it at once."
          : `Your ${status.trial_ends_on === status.covered_until ? 'free trial' : 'paid month'} ended on ${dayLabel(status.covered_until)}. Everything still works during the grace period; if the bill is not paid by ${dayLabel(status.grace_ends_on)}, the account becomes read-only until it is paid.`}
      </p>
    </section>
  )
}

// Text days ("2026-11-30"), counted without time zones.
function daysBetween(from, to) {
  const toDay = (day) => Date.UTC(...String(day).split('-').map((part, index) => Number(part) - (index === 1 ? 1 : 0))) / 86400000

  return toDay(to) - toDay(from)
}

function nextDay(day) {
  const [year, month, date] = String(day).split('-').map(Number)
  const next = new Date(Date.UTC(year, month - 1, date + 1))

  return next.toISOString().slice(0, 10)
}

function StatusCard({ billing }) {
  const { status, open_invoice: invoice, discount } = billing
  const [label, tone] = STATE_LABELS[status.state] || [status.state, 'neutral']
  const rows = [
    status.state === 'trial'
      ? ['Free trial until', dayLabel(status.trial_ends_on)]
      : [status.state === 'active' ? 'Paid until' : 'Covered until', dayLabel(status.covered_until)],
    ['Monthly price', ksh(status.monthly_price)],
  ]

  if (invoice) rows.push([`Bill for ${periodLabel(invoice.period_start, invoice.period_end)}`, ksh(invoice.amount_due)])
  if (['grace', 'read_only'].includes(status.state)) rows.push(['Pay by', dayLabel(status.grace_ends_on)])
  if (discount) {
    rows.push([
      'Your discount',
      `${discount.kind === 'percent' ? `${discount.value}%` : ksh(discount.value)} off each month${
        discount.months_total ? ` (${discount.months_total - discount.months_used} more month${discount.months_total - discount.months_used === 1 ? '' : 's'})` : ''
      }`,
    ])
  }

  return (
    <section className={cardClass}>
      <div className={cardHeaderClass}>
        <span className="font-display text-[14px] font-semibold">Your Kodi plan</span>
        <StatusBadge tone={tone}>{label}</StatusBadge>
      </div>
      <dl className="grid gap-3 px-[18px] py-4 text-[12px] sm:grid-cols-2">
        {rows.map(([name, value]) => (
          <div key={name}>
            <dt className="text-[10px] font-bold uppercase tracking-[0.05em] text-[var(--ink-faint)]">{name}</dt>
            <dd className="mt-1 font-semibold">{value}</dd>
          </div>
        ))}
      </dl>
      {status.state === 'read_only' ? (
        <p className="border-t border-[var(--line)] px-[18px] py-3 text-[11px] leading-[1.6] text-[var(--danger)]">
          The account is read-only until the bill is paid: you can see and download everything, and tenants&apos; M-Pesa payments are
          still recorded, but nothing can be added, changed or sent (including SMS).
        </p>
      ) : null}
    </section>
  )
}

const FINISHED = ['paid', 'failed', 'cancelled', 'expired']

/*
  Choosing how long to pay for: the M-Pesa number (the sign-in phone,
  which can be changed), then a card per length. The monthly card pays
  the bill that is due, or the next month ahead when nothing is due.
*/
function PaySection({ billing, onPaid }) {
  const { open_invoice: invoice, plans, status, next_month: next, current_plan_months: current } = billing
  // The account's sign-in phone (also when the admin is inside it); it can be changed.
  const [phone, setPhone] = useState(() => formatPhone(billing.sign_in_phone, ''))
  const [busy, setBusy] = useState(null)
  const [error, setError] = useState(null)
  const [request, setRequest] = useState(null)

  // While the prompt is on the phone: asks every 3 seconds, for up to 3 minutes (the live signal also tells the page).
  useEffect(() => {
    if (!request || FINISHED.includes(request.status)) return undefined

    const started = Date.now()
    const timer = setInterval(async () => {
      try {
        const current = await getPaymentRequest(request.stk_id)

        setRequest((previous) => ({ ...previous, ...current }))

        if (current.status === 'paid') onPaid()
      } catch {
        // Asked again on the next tick.
      }

      if (Date.now() - started > 3 * 60 * 1000) clearInterval(timer)
    }, 3000)

    return () => clearInterval(timer)
  }, [request, onPaid])

  async function pay(planMonths = null) {
    setBusy(planMonths || 'monthly')
    setError(null)

    try {
      setRequest(await payBill({ phone, planMonths }))
    } catch (payError) {
      setError(payError)
    } finally {
      setBusy(null)
    }
  }

  // The card picked on the home page (or a link to Billing with ?plan=): marked and brought into view.
  const [searchParams] = useSearchParams()
  const picked = Number(searchParams.get('plan')) || null
  const chosen = picked && plans.some((plan) => plan.months === picked) ? picked : null
  const sectionRef = useRef(null)

  useEffect(() => {
    if (!picked) return

    clearChosenPlan()

    if (chosen) sectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [picked, chosen])

  const waiting = request && !FINISHED.includes(request.status)
  const disabled = Boolean(busy) || waiting || !phone.trim()
  // What the monthly card actually charges this landlord (their own discount, carried amounts).
  const monthlyAmount = invoice ? invoice.amount_due : next?.amount || 0

  function action(card, { dark }) {
    const buttonClass = dark
      ? 'w-full rounded-[8px] bg-[var(--accent)] px-4 py-[11px] text-[12px] font-bold text-white transition hover:bg-[var(--accent-hover)] disabled:opacity-50'
      : `${primaryButtonClass} w-full`

    if (card.months === 1) {
      const differs = monthlyAmount && monthlyAmount !== card.price

      return (
        <>
          <button type="button" disabled={disabled || !monthlyAmount} onClick={() => pay()} className={buttonClass}>
            {busy === 'monthly'
              ? 'Sending...'
              : invoice
                ? `Pay this bill: ${ksh(invoice.amount_due)}`
                : next
                  ? `Pay ${periodLabel(next.period_start, next.period_end)}: ${ksh(next.amount)}`
                  : 'Nothing to pay'}
          </button>
          {differs ? (
            <p className={`mt-2 text-center text-[10px] ${dark ? 'text-[var(--brand-panel-soft)]' : 'text-[var(--ink-faint)]'}`}>
              {monthlyAmount < card.price ? 'Your own discount is applied.' : 'Includes an amount carried from an earlier bill.'}
            </p>
          ) : null}
        </>
      )
    }

    return (
      <button type="button" disabled={disabled} onClick={() => pay(card.months)} className={buttonClass}>
        {busy === card.months ? 'Sending...' : `Pay ${card.name}: ${ksh(card.price)}`}
      </button>
    )
  }

  return (
    <section ref={sectionRef} className={`${cardClass} grid scroll-mt-[110px] gap-4 px-[18px] py-5`}>
      {chosen && !request ? (
        <div className="rounded-[8px] border border-[var(--accent-muted)] bg-[var(--accent-soft)] px-3 py-3 text-[12px] text-[var(--accent-ink)]">
          You chose <b>{planLabel(chosen)}</b> on the home page. Check your M-Pesa number, then tap its Pay button: the prompt comes to your phone.
        </div>
      ) : null}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h3 className="font-display text-[15px] font-semibold">Choose how long to pay for</h3>
          <p className="mt-1 max-w-[560px] text-[11px] leading-[1.5] text-[var(--ink-soft)]">
            {invoice
              ? `Your bill for ${periodLabel(invoice.period_start, invoice.period_end)} is ${ksh(invoice.amount_due)}${
                  ['grace', 'read_only'].includes(status.state) ? `, due by ${dayLabel(status.grace_ends_on)}` : ''
                }. Pay it with Monthly, or pay several months ahead and save.`
              : `Nothing is due now${
                  status.state === 'trial' ? `: your free trial runs to ${dayLabel(status.trial_ends_on)}` : `: you are paid until ${dayLabel(status.covered_until)}`
                }. Whatever you choose starts after what is already covered, so no days are lost.`}
          </p>
        </div>
        <div className="w-full max-w-[260px]">
          <label className={labelClass}>
            <Smartphone size={12} className="mr-1 inline" />
            M-Pesa phone number
          </label>
          <input value={phone} onChange={(event) => setPhone(event.target.value)} inputMode="tel" maxLength={20} className={inputClass} />
        </div>
      </div>

      {request ? <RequestState request={request} /> : null}
      {error ? <FormError error={error} /> : null}

      <PricingCards cards={plans} current={current} selected={chosen} action={action} compact />

      <p className="text-[10px] text-[var(--ink-faint)]">An M-Pesa prompt comes to the phone above: enter your PIN to pay Kodi&apos;s till.</p>
    </section>
  )
}

function RequestState({ request }) {
  if (request.status === 'paid') {
    return (
      <div className="rounded-[8px] bg-[var(--success-soft)] px-3 py-[10px] text-[11px] font-bold text-[var(--success)]">
        Paid, thank you{request.mpesa_receipt ? ` (M-Pesa ${request.mpesa_receipt})` : ''}. Your receipt is below.
      </div>
    )
  }

  if (['failed', 'cancelled', 'expired'].includes(request.status)) {
    return (
      <div className="rounded-[8px] bg-[var(--danger-soft)] px-3 py-[10px] text-[11px] font-bold text-[var(--danger)]">
        {request.status === 'cancelled' ? 'The payment was cancelled on the phone.' : request.result_desc || 'The payment did not go through.'} You can try
        again.
      </div>
    )
  }

  return (
    <div className="rounded-[8px] bg-[var(--info-soft)] px-3 py-[10px] text-[11px] font-bold text-[var(--info)]">
      Check {request.phone || 'your phone'}: enter your M-Pesa PIN to pay {ksh(request.amount)}. This page updates by itself.
    </div>
  )
}

function History({ billing }) {
  const { invoices, payments } = billing

  return (
    <>
      <section className={cardClass}>
        <div className={cardHeaderClass}>
          <span className="font-display text-[14px] font-semibold">Payments and receipts</span>
        </div>
        {payments.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-[12px]">
              <thead className={headRowClass}>
                <tr>
                  <th className="px-[18px] py-2">Date</th>
                  <th className="px-3 py-2">Amount</th>
                  <th className="px-3 py-2">Paid by</th>
                  <th className="px-3 py-2">Receipt</th>
                  <th className="px-[18px] py-2" />
                </tr>
              </thead>
              <tbody>
                {payments.map((payment) => (
                  <tr key={payment.payment_id} className="border-t border-[var(--line)]">
                    <td className="px-[18px] py-3">{dayLabel(payment.paid_on)}</td>
                    <td className="px-3 py-3 font-semibold">{ksh(payment.amount)}</td>
                    <td className="px-3 py-3">{METHOD_LABELS[payment.method] || payment.method}</td>
                    <td className="px-3 py-3">{payment.mpesa_receipt || '-'}</td>
                    <td className="px-[18px] py-3 text-right">
                      <button
                        type="button"
                        onClick={() => downloadReceipt(payment.payment_id)}
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-[var(--accent-ink)] hover:underline"
                      >
                        <Download size={13} />
                        Receipt
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState title="No payments yet" message="Receipts for your payments to Kodi appear here." />
        )}
      </section>

      <section className={cardClass}>
        <div className={cardHeaderClass}>
          <span className="font-display text-[14px] font-semibold">Bills</span>
        </div>
        {invoices.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-[12px]">
              <thead className={headRowClass}>
                <tr>
                  <th className="px-[18px] py-2">For</th>
                  <th className="px-3 py-2">Amount</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-[18px] py-2">Made</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((invoice) => {
                  const [label, tone] = INVOICE_STATUS[invoice.status] || [invoice.status, 'neutral']

                  return (
                    <tr key={invoice.invoice_id} className="border-t border-[var(--line)]">
                      <td className="px-[18px] py-3">
                        {periodLabel(invoice.period_start, invoice.period_end)}
                        {invoice.kind === 'prepaid' ? <span className="ml-1 text-[10px] text-[var(--ink-faint)]">(paid ahead)</span> : null}
                      </td>
                      <td className="px-3 py-3 font-semibold">{ksh(invoice.amount_due)}</td>
                      <td className="px-3 py-3">
                        <StatusBadge tone={tone}>{label}</StatusBadge>
                      </td>
                      <td className="px-[18px] py-3 text-[var(--ink-faint)]">{formatDateTime(invoice.created_at)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState title="No bills yet" message="Your first bill comes on the 1st after your free trial." />
        )}
      </section>
    </>
  )
}

export default BillingTab
