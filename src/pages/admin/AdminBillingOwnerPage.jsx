import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Download } from 'lucide-react'
import {
  downloadReceipt,
  endDiscount,
  extendTrial,
  getBillingAccount,
  giveDiscount,
  giveFreeMonths,
  recordPayment,
  requestPaymentFor,
  setBillAmount,
} from '../../api/billing'
import { INVOICE_STATUS, METHOD_LABELS, REQUEST_STATUS, STATE_LABELS, dayLabel, ksh, periodLabel } from '../../components/billing/billingLabels'
import { DataState, EmptyState, FormError } from '../../components/common/DataState'
import { Field, ModalBody, ModalFooter, ModalShell, SelectField, primaryButtonClass, secondaryButtonClass } from '../../components/common/Modal'
import StatusBadge from '../../components/common/StatusBadge'
import { useApi } from '../../hooks/useApi'
import { formatDateTime, formatPhone, humanize, toDateInput } from '../../utils/format'

const cardClass = 'overflow-hidden rounded-[10px] border border-[var(--line)] bg-[var(--surface)]'
const cardHeaderClass = 'flex flex-wrap items-center justify-between gap-3 border-b border-[var(--line)] px-[18px] py-4'
const headRowClass = 'bg-[var(--bg)] text-left text-[9px] uppercase tracking-[0.05em] text-[var(--ink-faint)]'
const actionClass = 'rounded-[8px] border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-[11px] font-bold hover:bg-[var(--line-soft)] disabled:opacity-50'
const MONTH_OPTIONS = Array.from({ length: 12 }, (_, i) => [String(i + 1), `${i + 1} month${i ? 's' : ''}`])

// One landlord's Kodi billing, and the admin's changes to it.
function AdminBillingOwnerPage() {
  const { ownerId } = useParams()
  const [version, setVersion] = useState(0)
  const state = useApi(`billing-owner-${ownerId}-${version}`, () => getBillingAccount(ownerId))
  const reload = () => setVersion((current) => current + 1)
  const [action, setAction] = useState(null)

  return (
    <>
      <Link to="/admin/billing" className="mb-4 inline-flex items-center gap-1 text-[11px] font-bold text-[var(--accent-ink)] hover:underline">
        <ArrowLeft size={13} />
        Billing
      </Link>

      <DataState state={state} loadingLabel="Loading...">
        {(data) => {
          const { owner, status, open_invoice: invoice } = data
          const discount = data.discounts.find((item) => !item.ended_at)
          const [label, tone] = STATE_LABELS[status.state] || [status.state, 'neutral']

          return (
            <div className="grid gap-4">
              <section className={cardClass}>
                <div className={cardHeaderClass}>
                  <div>
                    <div className="font-display text-[16px] font-semibold">{`${owner.first_name} ${owner.last_name}`.trim()}</div>
                    <div className="text-[11px] text-[var(--ink-faint)]">{formatPhone(owner.phone)}</div>
                  </div>
                  <StatusBadge tone={tone}>{label}</StatusBadge>
                </div>
                <dl className="grid gap-3 px-[18px] py-4 text-[12px] sm:grid-cols-4">
                  {[
                    ['Trial until', dayLabel(status.trial_ends_on)],
                    ['Covered until', dayLabel(status.covered_until)],
                    ['Grace ends', dayLabel(status.grace_ends_on)],
                    ['Owing now', invoice ? ksh(invoice.amount_due) : '-'],
                    ['Carried to next bill', status.carry_amount ? ksh(status.carry_amount) : '-'],
                    [
                      'Discount',
                      discount
                        ? `${discount.kind === 'percent' ? `${discount.value}%` : ksh(discount.value)} off${discount.months_total ? `, ${discount.months_total - discount.months_used} of ${discount.months_total} months left` : ', until ended'}`
                        : '-',
                    ],
                  ].map(([name, value]) => (
                    <div key={name}>
                      <dt className="text-[10px] font-bold uppercase tracking-[0.05em] text-[var(--ink-faint)]">{name}</dt>
                      <dd className="mt-1 font-semibold">{value}</dd>
                    </div>
                  ))}
                </dl>
                <div className="flex flex-wrap gap-2 border-t border-[var(--line)] px-[18px] py-3">
                  {status.state === 'trial' ? (
                    <button type="button" onClick={() => setAction('trial')} className={actionClass}>Extend trial</button>
                  ) : null}
                  <button type="button" onClick={() => setAction('free')} className={actionClass}>Give free months</button>
                  {discount ? (
                    <button type="button" onClick={() => setAction('end-discount')} className={actionClass}>End discount</button>
                  ) : (
                    <button type="button" onClick={() => setAction('discount')} className={actionClass}>Give a discount</button>
                  )}
                  <button type="button" disabled={!invoice} onClick={() => setAction('amount')} className={actionClass}>Change this bill</button>
                  <button type="button" disabled={!invoice} onClick={() => setAction('payment')} className={actionClass}>Record a payment</button>
                  <button type="button" disabled={!invoice} onClick={() => setAction('prompt')} className={actionClass}>Send M-Pesa prompt</button>
                </div>
              </section>

              <Bills invoices={data.invoices} />
              <Payments payments={data.payments} />
              <Requests requests={data.payment_requests} />
              <HistoryList history={data.history} />

              {action === 'trial' ? (
                <MonthsModal title="Extend the free trial" hint={`The trial ends ${dayLabel(status.trial_ends_on)}; it is extended to the end of a later month.`} onClose={() => setAction(null)} onDone={reload} run={(months, reason) => extendTrial(owner.owner_id, months, reason)} />
              ) : null}
              {action === 'free' ? (
                <MonthsModal title="Give free months" hint="Whole months, from the end of what is already covered (from this month if the account is read-only). Any bill they cover is closed." onClose={() => setAction(null)} onDone={reload} run={(months, reason) => giveFreeMonths(owner.owner_id, months, reason)} />
              ) : null}
              {action === 'discount' ? <DiscountModal ownerId={owner.owner_id} monthlyPrice={status.monthly_price} onClose={() => setAction(null)} onDone={reload} /> : null}
              {action === 'end-discount' ? <ReasonModal title="End the discount" button="End discount" onClose={() => setAction(null)} onDone={reload} run={(reason) => endDiscount(discount.discount_id, reason)} /> : null}
              {action === 'amount' ? <AmountModal invoice={invoice} onClose={() => setAction(null)} onDone={reload} /> : null}
              {action === 'payment' ? <PaymentModal invoice={invoice} onClose={() => setAction(null)} onDone={reload} /> : null}
              {action === 'prompt' ? <PromptModal owner={owner} invoice={invoice} onClose={() => setAction(null)} onDone={reload} /> : null}
            </div>
          )
        }}
      </DataState>
    </>
  )
}

function Table({ title, empty, columns, rows }) {
  return (
    <section className={cardClass}>
      <div className={cardHeaderClass}>
        <span className="font-display text-[14px] font-semibold">{title}</span>
      </div>
      {rows.length ? (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-[12px]">
            <thead className={headRowClass}>
              <tr>
                {columns.map((column, index) => (
                  <th key={column || index} className="px-[18px] py-2">{column}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((cells, index) => (
                <tr key={index} className="border-t border-[var(--line)]">
                  {cells.map((cell, cellIndex) => (
                    <td key={cellIndex} className="px-[18px] py-3 align-top">{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState title={empty} />
      )}
    </section>
  )
}

function Bills({ invoices }) {
  return (
    <Table
      title="Bills"
      empty="No bills yet"
      columns={['For', 'Amount', 'Details', 'Status']}
      rows={invoices.map((invoice) => {
        const [label, tone] = INVOICE_STATUS[invoice.status] || [invoice.status, 'neutral']
        const notes = [
          invoice.discount_amount ? `${ksh(invoice.discount_amount)} off` : null,
          invoice.carried_amount ? `${ksh(invoice.carried_amount)} carried in` : null,
          invoice.custom_amount_reason ? `Changed: ${invoice.custom_amount_reason}` : null,
          invoice.void_reason,
        ].filter(Boolean)

        return [
          <>{periodLabel(invoice.period_start, invoice.period_end)}{invoice.kind === 'prepaid' ? <span className="ml-1 text-[10px] text-[var(--ink-faint)]">(paid ahead)</span> : null}</>,
          <b>{ksh(invoice.amount_due)}</b>,
          <span className="text-[11px] text-[var(--ink-soft)]">{notes.join('; ') || '-'}</span>,
          <StatusBadge tone={tone}>{label}</StatusBadge>,
        ]
      })}
    />
  )
}

function Payments({ payments }) {
  return (
    <Table
      title="Payments"
      empty="No payments yet"
      columns={['Date', 'Amount', 'Paid by', 'Receipt or reference', '']}
      rows={payments.map((payment) => [
        dayLabel(payment.paid_on),
        <b>{ksh(payment.amount)}</b>,
        <>{METHOD_LABELS[payment.method] || payment.method}{payment.note ? <div className="text-[10px] text-[var(--ink-faint)]">{payment.note}</div> : null}</>,
        payment.mpesa_receipt || payment.reference || '-',
        <button type="button" onClick={() => downloadReceipt(payment.payment_id, { admin: true })} className="inline-flex items-center gap-1 text-[11px] font-bold text-[var(--accent-ink)] hover:underline">
          <Download size={13} />
          Receipt
        </button>,
      ])}
    />
  )
}

function Requests({ requests }) {
  return (
    <Table
      title="M-Pesa prompts"
      empty="No M-Pesa prompts yet"
      columns={['Sent', 'Phone', 'Amount', 'Result']}
      rows={requests.map((request) => [
        <>{formatDateTime(request.created_at)}{request.automatic ? <div className="text-[10px] text-[var(--ink-faint)]">automatic</div> : null}</>,
        formatPhone(request.phone),
        ksh(request.amount),
        <>{REQUEST_STATUS[request.status] || request.status}{request.mpesa_receipt ? ` (${request.mpesa_receipt})` : ''}{request.result_desc && request.status !== 'paid' ? <div className="text-[10px] text-[var(--ink-faint)]">{request.result_desc}</div> : null}</>,
      ])}
    />
  )
}

function HistoryList({ history }) {
  return (
    <Table
      title="Changes and events"
      empty="Nothing recorded yet"
      columns={['When', 'What', 'Details']}
      rows={history.map((entry) => [
        formatDateTime(entry.created_at),
        humanize(entry.action.replace(/^SUBSCRIPTION_/, '').toLowerCase()),
        <span className="break-all text-[10.5px] text-[var(--ink-soft)]">
          {Object.entries(entry.metadata || {})
            .filter(([, value]) => value !== null && typeof value !== 'object')
            .map(([key, value]) => `${humanize(key)}: ${value}`)
            .join('; ')}
        </span>,
      ])}
    />
  )
}

function useSave(onDone, onClose) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  async function save(work) {
    setBusy(true)
    setError(null)

    try {
      await work()
      onDone()
      onClose()
    } catch (saveError) {
      setError(saveError)
    } finally {
      setBusy(false)
    }
  }

  return { busy, error, save }
}

function Footer({ onClose, busy, disabled, onSave, label = 'Save' }) {
  return (
    <ModalFooter>
      <button type="button" onClick={onClose} className={secondaryButtonClass}>Cancel</button>
      <button type="button" disabled={busy || disabled} onClick={onSave} className={primaryButtonClass}>
        {busy ? 'Saving...' : label}
      </button>
    </ModalFooter>
  )
}

const reasonField = (reason, setReason) => (
  <Field label="Reason (recorded)" value={reason} onChange={(event) => setReason(event.target.value)} maxLength={500} />
)

function MonthsModal({ title, hint, run, onClose, onDone }) {
  const [months, setMonths] = useState('1')
  const [reason, setReason] = useState('')
  const { busy, error, save } = useSave(onDone, onClose)

  return (
    <ModalShell title={title} onClose={onClose}>
      <ModalBody>
        <div className="grid gap-4">
          <SelectField label="How long" options={MONTH_OPTIONS} value={months} onChange={(event) => setMonths(event.target.value)} />
          <p className="text-[11px] text-[var(--ink-faint)]">{hint}</p>
          {reasonField(reason, setReason)}
          {error ? <FormError error={error} /> : null}
        </div>
      </ModalBody>
      <Footer onClose={onClose} busy={busy} disabled={reason.trim().length < 3} onSave={() => save(() => run(Number(months), reason))} />
    </ModalShell>
  )
}

function ReasonModal({ title, button, run, onClose, onDone }) {
  const [reason, setReason] = useState('')
  const { busy, error, save } = useSave(onDone, onClose)

  return (
    <ModalShell title={title} onClose={onClose}>
      <ModalBody>
        <div className="grid gap-4">
          {reasonField(reason, setReason)}
          {error ? <FormError error={error} /> : null}
        </div>
      </ModalBody>
      <Footer onClose={onClose} busy={busy} disabled={reason.trim().length < 3} label={button} onSave={() => save(() => run(reason))} />
    </ModalShell>
  )
}

function DiscountModal({ ownerId, monthlyPrice, onClose, onDone }) {
  const [kind, setKind] = useState('percent')
  const [value, setValue] = useState('')
  const [months, setMonths] = useState('3')
  const [reason, setReason] = useState('')
  const { busy, error, save } = useSave(onDone, onClose)
  const off = Number(value) || 0
  const each = kind === 'percent' ? Math.round((monthlyPrice * Math.min(off, 100)) / 100) : Math.min(off, monthlyPrice)

  return (
    <ModalShell title="Give a discount" onClose={onClose}>
      <ModalBody>
        <div className="grid gap-4">
          <SelectField label="Kind" options={[['percent', 'Percentage off'], ['amount', 'Amount off (KSh)']]} value={kind} onChange={(event) => setKind(event.target.value)} />
          <Field label={kind === 'percent' ? 'Percent off' : 'KSh off each month'} value={value} onChange={(event) => setValue(event.target.value.replace(/\D/g, ''))} inputMode="numeric" />
          <SelectField label="For" options={[...MONTH_OPTIONS, ['always', 'Until I end it']]} value={months} onChange={(event) => setMonths(event.target.value)} />
          {off ? <p className="text-[11px] text-[var(--ink-soft)]">Each monthly bill: {ksh(monthlyPrice - each)} instead of {ksh(monthlyPrice)}, from the next bill. Paying ahead uses the plan price instead.</p> : null}
          {reasonField(reason, setReason)}
          {error ? <FormError error={error} /> : null}
        </div>
      </ModalBody>
      <Footer
        onClose={onClose}
        busy={busy}
        disabled={!off || reason.trim().length < 3}
        label="Give discount"
        onSave={() => save(() => giveDiscount(ownerId, { kind, value: off, months: months === 'always' ? null : Number(months), reason }))}
      />
    </ModalShell>
  )
}

function AmountModal({ invoice, onClose, onDone }) {
  const [amount, setAmount] = useState('')
  const [remainder, setRemainder] = useState('forgive')
  const [reason, setReason] = useState('')
  const { busy, error, save } = useSave(onDone, onClose)
  const value = Number(amount) || 0
  const rest = invoice.amount_due - value

  return (
    <ModalShell title={`Change the bill for ${periodLabel(invoice.period_start, invoice.period_end)}`} onClose={onClose}>
      <ModalBody>
        <div className="grid gap-4">
          <p className="text-[12px]">The bill is {ksh(invoice.amount_due)}. Enter what this landlord will pay for it.</p>
          <Field label="New amount (KSh)" value={amount} onChange={(event) => setAmount(event.target.value.replace(/\D/g, ''))} inputMode="numeric" />
          <SelectField
            label="The rest"
            options={[['forgive', 'Forgive it'], ['carry', 'Add it to the next bill']]}
            value={remainder}
            onChange={(event) => setRemainder(event.target.value)}
          />
          {value > 0 && rest > 0 ? (
            <p className="text-[11px] text-[var(--ink-soft)]">
              {ksh(rest)} {remainder === 'carry' ? 'is added to the next bill.' : 'is forgiven.'}
            </p>
          ) : null}
          {reasonField(reason, setReason)}
          {error ? <FormError error={error} /> : null}
        </div>
      </ModalBody>
      <Footer
        onClose={onClose}
        busy={busy}
        disabled={!value || rest <= 0 || reason.trim().length < 3}
        onSave={() => save(() => setBillAmount(invoice.invoice_id, { amount: value, remainder, reason }))}
      />
    </ModalShell>
  )
}

function PaymentModal({ invoice, onClose, onDone }) {
  const [method, setMethod] = useState('cash')
  const [reference, setReference] = useState('')
  const [paidOn, setPaidOn] = useState(toDateInput())
  const [note, setNote] = useState('')
  const { busy, error, save } = useSave(onDone, onClose)

  return (
    <ModalShell title="Record a payment" onClose={onClose}>
      <ModalBody>
        <div className="grid gap-4">
          <p className="text-[12px]">
            Records {ksh(invoice.amount_due)} for {periodLabel(invoice.period_start, invoice.period_end)}, paid outside the M-Pesa prompt. To accept less, change
            the bill first. The landlord gets an SMS receipt.
          </p>
          <SelectField
            label="Paid by"
            options={[['cash', 'Cash'], ['bank', 'Bank transfer'], ['mpesa_other', 'M-Pesa (another way)'], ['other', 'Other']]}
            value={method}
            onChange={(event) => setMethod(event.target.value)}
          />
          <Field label="Reference (optional)" value={reference} onChange={(event) => setReference(event.target.value)} maxLength={100} />
          <Field label="Paid on" type="date" value={paidOn} max={toDateInput()} onChange={(event) => setPaidOn(event.target.value)} />
          <Field label="Note (recorded)" value={note} onChange={(event) => setNote(event.target.value)} maxLength={500} />
          {error ? <FormError error={error} /> : null}
        </div>
      </ModalBody>
      <Footer
        onClose={onClose}
        busy={busy}
        disabled={!paidOn || note.trim().length < 3}
        label={`Record ${ksh(invoice.amount_due)}`}
        onSave={() => save(() => recordPayment(invoice.invoice_id, { amount: invoice.amount_due, method, reference: reference || undefined, paid_on: paidOn, note }))}
      />
    </ModalShell>
  )
}

function PromptModal({ owner, invoice, onClose, onDone }) {
  const [phone, setPhone] = useState(formatPhone(owner.phone, ''))
  const { busy, error, save } = useSave(onDone, onClose)

  return (
    <ModalShell title="Send the M-Pesa prompt" onClose={onClose}>
      <ModalBody>
        <div className="grid gap-4">
          <p className="text-[12px]">A prompt for {ksh(invoice.amount_due)} goes to this phone; the landlord enters their PIN to pay.</p>
          <Field label="Phone" value={phone} onChange={(event) => setPhone(event.target.value)} inputMode="tel" maxLength={20} />
          {error ? <FormError error={error} /> : null}
        </div>
      </ModalBody>
      <Footer onClose={onClose} busy={busy} disabled={!phone.trim()} label="Send prompt" onSave={() => save(() => requestPaymentFor(owner.owner_id, phone))} />
    </ModalShell>
  )
}

export default AdminBillingOwnerPage
