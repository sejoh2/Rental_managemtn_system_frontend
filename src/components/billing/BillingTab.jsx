import { useCallback, useEffect, useState } from 'react'
import { Download, Smartphone } from 'lucide-react'
import { downloadReceipt, getMyBilling, getPaymentRequest, payBill } from '../../api/billing'
import { useApi } from '../../hooks/useApi'
import { formatDateTime, formatPhone } from '../../utils/format'
import { DataState, EmptyState, FormError } from '../common/DataState'
import { inputClass, labelClass, primaryButtonClass, secondaryButtonClass } from '../common/Modal'
import StatusBadge from '../common/StatusBadge'
import { INVOICE_STATUS, METHOD_LABELS, STATE_LABELS, dayLabel, ksh, periodLabel } from './billingLabels'

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

  return (
    <DataState state={state} loadingLabel="Loading billing...">
      {(billing) => (
        <div className="grid gap-4 xl:grid-cols-[1fr_340px]">
          <div className="grid content-start gap-4">
            {billing.status.state === 'trial' ? <TrialCard status={billing.status} /> : null}
            <StatusCard billing={billing} />
            <History billing={billing} />
          </div>
          <div className="grid content-start gap-4">
            <PayCard billing={billing} onPaid={reload} />
          </div>
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
        Everything in Kodi is open during the trial. You can pay ahead at any time; the trial days are not lost.
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

function PayCard({ billing, onPaid }) {
  const { open_invoice: invoice, plans } = billing
  // The account's sign-in phone (also when the admin is inside it); it can be changed.
  const [phone, setPhone] = useState(() => formatPhone(billing.sign_in_phone, ''))
  const [busy, setBusy] = useState(null)
  const [error, setError] = useState(null)
  const [request, setRequest] = useState(null)

  // While the prompt is on the phone: asks every 3 seconds, for up to 3 minutes.
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
    setBusy(planMonths || 'bill')
    setError(null)

    try {
      setRequest(await payBill({ phone, planMonths }))
    } catch (payError) {
      setError(payError)
    } finally {
      setBusy(null)
    }
  }

  const waiting = request && !FINISHED.includes(request.status)

  return (
    <section className={`${cardClass} grid gap-3 px-[18px] py-4 text-[12px]`}>
      <div className="flex items-center gap-2 font-bold">
        <Smartphone size={15} />
        Pay by M-Pesa
      </div>
      <div>
        <label className={labelClass}>M-Pesa phone number</label>
        <input value={phone} onChange={(event) => setPhone(event.target.value)} inputMode="tel" maxLength={20} className={inputClass} />
        <p className="mt-2 text-[10px] text-[var(--ink-faint)]">A prompt comes to this phone: enter your M-Pesa PIN to pay Kodi&apos;s till.</p>
      </div>

      {invoice ? (
        <button type="button" disabled={Boolean(busy) || waiting || !phone.trim()} onClick={() => pay()} className={primaryButtonClass}>
          {busy === 'bill' ? 'Sending...' : `Pay ${ksh(invoice.amount_due)}`}
        </button>
      ) : (
        <p className="text-[11px] text-[var(--ink-soft)]">Nothing to pay right now. Your next bill comes on the 1st after your cover ends.</p>
      )}

      {plans.length ? (
        <div className="grid gap-2 border-t border-[var(--line)] pt-3">
          <div className="text-[11px] font-bold">Pay ahead and save</div>
          {plans.map((plan) => (
            <button
              key={plan.months}
              type="button"
              disabled={Boolean(busy) || waiting || !phone.trim()}
              onClick={() => pay(plan.months)}
              className={`${secondaryButtonClass} flex items-center justify-between gap-2 text-left`}
            >
              <span>
                {plan.months} months: {ksh(plan.price)}
                <span className="block text-[10px] font-normal text-[var(--success)]">You save {ksh(plan.saving)}</span>
              </span>
              <span className="text-[11px]">{busy === plan.months ? 'Sending...' : 'Pay'}</span>
            </button>
          ))}
        </div>
      ) : null}

      {request ? <RequestState request={request} /> : null}
      {error ? <FormError error={error} /> : null}
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
