import { useState } from 'react'
import { Plus, X } from 'lucide-react'
import {
  calculateDepositReconciliation,
  confirmDepositReconciliation,
  getDepositReconciliation,
  recordDepositRefund,
} from '../../api/tenants'
import { useApi } from '../../hooks/useApi'
import { chargeLabel } from '../../utils/billing'
import { formatDate, formatKES, toDateInput } from '../../utils/format'
import { REFUND_METHODS, optionLabel } from '../../utils/labels'
import { DataState, FormError } from '../common/DataState'
import {
  Field,
  SelectField,
  inputClass,
  primaryButtonClass,
  secondaryButtonClass,
} from '../common/Modal'
import StatusBadge from '../common/StatusBadge'

const groupLabels = {
  rent: ['Rent deposit', 'Covers unpaid rent, service charges, repairs and deductions.'],
  water: ['Water deposit', 'Covers unpaid water bills.'],
  electricity: ['Electricity deposit', 'Covers unpaid electricity bills.'],
}

const cardClass = 'overflow-hidden rounded-[10px] border border-[var(--line)] bg-white'
const cardHeaderClass =
  'flex items-center justify-between gap-3 border-b border-[var(--line)] px-[18px] py-4'

function Row({ label, value, strong, danger }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-[var(--line-soft)] py-[9px] text-[12px] last:border-b-0">
      <span className={strong ? 'font-bold' : 'text-[var(--ink-soft)]'}>{label}</span>
      <span className={`font-mono ${strong ? 'font-bold' : 'font-semibold'} ${danger ? 'text-[#B3261E]' : ''}`}>
        {value}
      </span>
    </div>
  )
}

// One deposit: what is held, what it has to cover, and what is left or short.
function DepositGroup({ group }) {
  const [title, covers] = groupLabels[group.key]

  // A deposit the unit never asked for, with nothing to cover, is not worth showing.
  if (!group.deposit_charged && !group.unpaid) return null

  return (
    <div className="border-b border-[var(--line-soft)] px-[18px] py-4 last:border-b-0">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h4 className="text-[12px] font-bold">{title}</h4>
          <p className="mt-[3px] text-[10px] text-[var(--ink-faint)]">{covers}</p>
        </div>
        {group.shortfall > 0 ? (
          <StatusBadge tone="danger">Short by {formatKES(group.shortfall)}</StatusBadge>
        ) : (
          <StatusBadge tone="success">{formatKES(group.left)} left</StatusBadge>
        )}
      </div>

      <div className="mt-3">
        <Row label="Deposit held" value={formatKES(group.held)} />
        {group.items.map((item, index) => (
          <Row
            key={`${item.charge_id || 'deduction'}-${index}`}
            label={`Unpaid: ${chargeLabel(item)}`}
            value={`- ${formatKES(item.amount)}`}
          />
        ))}
      </div>

      {group.deposit_charged > group.held ? (
        <p className="mt-2 text-[10px] leading-[1.5] text-[#B8790E]">
          Only {formatKES(group.held)} of the {formatKES(group.deposit_charged)} deposit was
          ever paid, so only that amount is held.
        </p>
      ) : null}
    </div>
  )
}

/*
  Reconciles the deposits of a tenant who has moved out.
  Each deposit is shown against its own unpaid bills; "Calculate" merges them
  into one final figure, and confirming makes it final.
*/
function DepositReconciliation({ tenant, onChanged }) {
  const state = useApi(`deposit-reconciliation-${tenant.id}`, () =>
    getDepositReconciliation(tenant.id)
  )

  function handleChanged() {
    state.reload()
    onChanged()
  }

  return (
    <section className={cardClass}>
      <DataState state={state} loadingLabel="Loading deposit reconciliation...">
        {(data) =>
          data.status === 'confirmed' ? (
            <Settled tenant={tenant} settlement={data.settlement} onChanged={handleChanged} />
          ) : (
            <OpenReconciliation tenant={tenant} data={data} onChanged={handleChanged} />
          )
        }
      </DataState>
    </section>
  )
}

function OpenReconciliation({ tenant, data, onChanged }) {
  const [deductions, setDeductions] = useState([])
  // The final figure for the deductions as they are now; cleared when they change.
  const [result, setResult] = useState(null)
  const [working, setWorking] = useState(null)
  const [error, setError] = useState(null)

  const cleanDeductions = deductions
    .filter((item) => item.description.trim() && Number(item.amount) > 0)
    .map((item) => ({ description: item.description.trim(), amount: Number(item.amount) }))
  const incomplete = deductions.length !== cleanDeductions.length

  function changeDeductions(next) {
    setDeductions(next)
    setResult(null)
  }

  function patchDeduction(index, patch) {
    changeDeductions(
      deductions.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item))
    )
  }

  async function run(action, name) {
    setWorking(name)
    setError(null)

    try {
      await action()
    } catch (runError) {
      setError(runError)
    } finally {
      setWorking(null)
    }
  }

  const calculate = () =>
    run(async () => setResult(await calculateDepositReconciliation(tenant.id, cleanDeductions)), 'calculate')

  const confirm = () =>
    run(async () => {
      await confirmDepositReconciliation(tenant.id, cleanDeductions)
      onChanged()
    }, 'confirm')

  const groups = (result || data).groups

  return (
    <>
      <div className={cardHeaderClass}>
        <div>
          <h3 className="text-[12px] font-bold">Deposit reconciliation</h3>
          <p className="mt-[3px] text-[10px] text-[var(--ink-faint)]">
            Each deposit first covers its own unpaid bills. Calculate merges
            them into one final figure.
          </p>
        </div>
        <StatusBadge tone="warning">Not reconciled</StatusBadge>
      </div>

      {groups.map((group) => (
        <DepositGroup key={group.key} group={group} />
      ))}

      {data.credit_held > 0 ? (
        <div className="border-b border-[var(--line-soft)] px-[18px] py-3">
          <Row label="Credit held from overpayments" value={formatKES(data.credit_held)} />
        </div>
      ) : null}

      <div className="border-b border-[var(--line-soft)] px-[18px] py-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h4 className="text-[12px] font-bold">Deductions</h4>
            <p className="mt-[3px] text-[10px] text-[var(--ink-faint)]">
              Anything else you keep from the rent deposit, such as repainting or damage.
            </p>
          </div>
          <button
            type="button"
            onClick={() => changeDeductions([...deductions, { description: '', amount: '' }])}
            className="inline-flex shrink-0 items-center gap-2 rounded-[8px] border border-[var(--line)] bg-white px-3 py-2 text-[11px] font-bold"
          >
            <Plus size={13} />
            Add deduction
          </button>
        </div>

        {deductions.map((item, index) => (
          <div key={index} className="mt-3 flex items-center gap-2">
            <input
              type="text"
              value={item.description}
              onChange={(event) => patchDeduction(index, { description: event.target.value })}
              placeholder="e.g. Repainting"
              maxLength={200}
              className={inputClass}
            />
            <input
              type="number"
              min="1"
              step="any"
              value={item.amount}
              onChange={(event) => patchDeduction(index, { amount: event.target.value })}
              placeholder="KES"
              className={`${inputClass} max-w-[130px]`}
            />
            <button
              type="button"
              onClick={() => changeDeductions(deductions.filter((_, itemIndex) => itemIndex !== index))}
              aria-label="Remove deduction"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--line-soft)] text-[var(--ink-soft)]"
            >
              <X size={14} />
            </button>
          </div>
        ))}

        {incomplete ? (
          <p className="mt-2 text-[10px] text-[#B8790E]">
            Give every deduction a description and an amount, or remove it.
          </p>
        ) : null}
      </div>

      <div className="px-[18px] py-4">
        {result ? (
          <div className="mb-4 rounded-[8px] border border-[var(--line)] border-l-2 border-l-[var(--accent-soft-line)] bg-white px-4 py-3">
            <Row label="Deposits held" value={formatKES(result.deposits_held)} />
            {result.credit_held > 0 ? (
              <Row label="Credit held" value={formatKES(result.credit_held)} />
            ) : null}
            <Row label="Unpaid bills and deductions" value={`- ${formatKES(result.unpaid_total)}`} />
            {result.tenant_owes > 0 ? (
              <Row label={`${tenant.full_name} still owes you`} value={formatKES(result.tenant_owes)} strong danger />
            ) : (
              <Row label={`Refund due to ${tenant.full_name}`} value={formatKES(result.refund_due)} strong />
            )}
          </div>
        ) : null}

        {error ? (
          <div className="mb-4">
            <FormError error={error} />
          </div>
        ) : null}

        <div className="flex flex-wrap items-center justify-end gap-[10px]">
          {result ? (
            <p className="mr-auto max-w-[360px] text-[10px] leading-[1.5] text-[var(--ink-faint)]">
              Confirming is final: the deposits are used for the unpaid bills
              and deductions, and the figure above is fixed.
            </p>
          ) : null}

          <button
            type="button"
            onClick={calculate}
            disabled={Boolean(working) || incomplete}
            className={result ? secondaryButtonClass : primaryButtonClass}
          >
            {working === 'calculate' ? 'Calculating...' : result ? 'Calculate again' : 'Calculate final figure'}
          </button>

          {result ? (
            <button type="button" onClick={confirm} disabled={Boolean(working)} className={primaryButtonClass}>
              {working === 'confirm' ? 'Confirming...' : 'Confirm reconciliation'}
            </button>
          ) : null}
        </div>
      </div>
    </>
  )
}

function Settled({ tenant, settlement, onChanged }) {
  const [form, setForm] = useState({ paid_on: toDateInput(), method: 'mpesa', reference: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  const refundPending = settlement.refund_due > 0 && !settlement.refund_paid_on

  function setField(field) {
    return (event) => setForm((current) => ({ ...current, [field]: event.target.value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setSaving(true)
    setError(null)

    try {
      await recordDepositRefund(tenant.id, {
        paid_on: form.paid_on,
        method: form.method,
        reference: form.reference.trim() || null,
      })

      onChanged()
    } catch (saveError) {
      setError(saveError)
      setSaving(false)
    }
  }

  return (
    <>
      <div className={cardHeaderClass}>
        <div>
          <h3 className="text-[12px] font-bold">Deposit reconciliation</h3>
          <p className="mt-[3px] text-[10px] text-[var(--ink-faint)]">
            Confirmed {formatDate(settlement.confirmed_at)}
          </p>
        </div>
        {settlement.tenant_owes > 0 ? (
          <StatusBadge tone="danger">Tenant owes {formatKES(settlement.tenant_owes)}</StatusBadge>
        ) : refundPending ? (
          <StatusBadge tone="warning">Refund of {formatKES(settlement.refund_due)} to pay</StatusBadge>
        ) : settlement.refund_due > 0 ? (
          <StatusBadge tone="success">Refund paid</StatusBadge>
        ) : (
          <StatusBadge tone="success">Settled</StatusBadge>
        )}
      </div>

      <div className="px-[18px] py-4">
        <Row label="Deposits held" value={formatKES(settlement.deposits_held)} />
        {settlement.credit_held > 0 ? (
          <Row label="Credit held from overpayments" value={formatKES(settlement.credit_held)} />
        ) : null}
        <Row
          label={`Used for unpaid bills${settlement.deductions_total > 0 ? ` and ${formatKES(settlement.deductions_total)} of deductions` : ''}`}
          value={`- ${formatKES(settlement.applied_to_bills)}`}
        />
        {settlement.tenant_owes > 0 ? (
          <Row label={`${tenant.full_name} still owes you`} value={formatKES(settlement.tenant_owes)} strong danger />
        ) : (
          <Row label={`Refund due to ${tenant.full_name}`} value={formatKES(settlement.refund_due)} strong />
        )}

        {settlement.tenant_owes > 0 ? (
          <p className="mt-3 text-[11px] leading-[1.5] text-[var(--ink-faint)]">
            The deposits did not cover everything. What is still owed stays on
            this tenant&apos;s account; record a payment when they pay it.
          </p>
        ) : null}

        {settlement.refund_paid_on ? (
          <p className="mt-3 text-[11px] leading-[1.5] text-[#2E7D4F]">
            Refund of {formatKES(settlement.refund_due)} paid on{' '}
            {formatDate(settlement.refund_paid_on)} by{' '}
            {optionLabel(REFUND_METHODS, settlement.refund_method).toLowerCase()}
            {settlement.refund_reference ? ` (${settlement.refund_reference})` : ''}.
          </p>
        ) : null}

        {refundPending ? (
          <form onSubmit={handleSubmit} className="mt-4 border-t border-[var(--line-soft)] pt-4">
            <h4 className="mb-3 text-[12px] font-bold">Record the refund once you have paid it</h4>

            <div className="grid gap-[14px] sm:grid-cols-3">
              <Field
                label="Date paid"
                type="date"
                max={toDateInput()}
                value={form.paid_on}
                onChange={setField('paid_on')}
                required
              />
              <SelectField
                label="Paid by"
                value={form.method}
                onChange={setField('method')}
                options={REFUND_METHODS}
              />
              <Field
                label="Reference (optional)"
                placeholder="e.g. M-Pesa code"
                value={form.reference}
                onChange={setField('reference')}
              />
            </div>

            {error ? (
              <div className="mt-[14px]">
                <FormError error={error} />
              </div>
            ) : null}

            <div className="mt-4 flex justify-end">
              <button type="submit" disabled={saving} className={primaryButtonClass}>
                {saving ? 'Saving...' : `Record refund of ${formatKES(settlement.refund_due)}`}
              </button>
            </div>
          </form>
        ) : null}
      </div>
    </>
  )
}

export default DepositReconciliation
