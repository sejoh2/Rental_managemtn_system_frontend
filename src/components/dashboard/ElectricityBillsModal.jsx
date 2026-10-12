import { useState } from 'react'
import { listElectricityBills, saveElectricityBills } from '../../api/electricity'
import { useApi } from '../../hooks/useApi'
import { formatKES, formatMonth, toDateInput } from '../../utils/format'
import { DataState, EmptyState, FormError } from '../common/DataState'
import {
  ModalBody,
  ModalFooter,
  ModalShell,
  inputClass,
  labelClass,
  primaryButtonClass,
  secondaryButtonClass,
} from '../common/Modal'

/*
  Monthly electricity for units billed by "amount entered each month":
  the owner types what each unit used and the tenant is billed exactly that.
*/
function ElectricityBillsModal({ open, ...props }) {
  if (!open || !props.property) return null

  return <ElectricityBillsForm {...props} />
}

function ElectricityBillsForm({ property, onClose, onSaved }) {
  const [period, setPeriod] = useState(toDateInput().slice(0, 7))

  return (
    <ModalShell title={`Electricity bills - ${property.name}`} onClose={onClose}>
      <div className="border-b border-[var(--line-soft)] px-[22px] py-[14px]">
        <label className={labelClass}>Month</label>
        <input
          type="month"
          value={period}
          max={toDateInput().slice(0, 7)}
          onChange={(event) => event.target.value && setPeriod(event.target.value)}
          className={`${inputClass} max-w-[220px]`}
        />
      </div>

      {/* Remounts for each month, so typed amounts never carry over to another month. */}
      <MonthBills key={period} property={property} period={period} onClose={onClose} onSaved={onSaved} />
    </ModalShell>
  )
}

function MonthBills({ property, period, onClose, onSaved }) {
  const billsState = useApi(`electricity-${property.id}-${period}`, () =>
    listElectricityBills(property.id, period)
  )
  // unit id -> amount typed. Units not typed in keep what was entered before.
  const [typed, setTyped] = useState({})
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  const changed = Object.entries(typed).filter(([, value]) => value !== '')

  async function handleSubmit(event) {
    event.preventDefault()
    setSaving(true)
    setError(null)

    try {
      await saveElectricityBills(
        property.id,
        period,
        changed.map(([unitId, value]) => ({ unit_id: Number(unitId), amount: Number(value) }))
      )

      onSaved?.()
      onClose()
    } catch (saveError) {
      setError(saveError)
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-hidden">
      <ModalBody>
        <DataState
          state={billsState}
          loadingLabel="Loading units..."
          isEmpty={(data) => !data.bills.length}
          empty={
            <EmptyState
              title="No units to enter"
              message={'No unit in this property has electricity set to "Amount I enter each month". Change that on the unit first.'}
            />
          }
        >
          {(data) => (
            <>
              <p className="mb-[14px] text-[11px] leading-[1.5] text-[var(--ink-faint)]">
                Type what each unit owes for electricity in {formatMonth(`${period}-01`)}. The
                tenant living there is billed exactly that amount. To correct a bill,
                type the new amount; type 0 to remove a bill that has not been paid.
              </p>

              <div className="grid gap-[12px]">
                {data.bills.map((bill) => (
                  <label key={bill.unit_id} className="flex items-center gap-3 text-[12px]">
                    <span className="w-[180px] shrink-0 font-bold">
                      {bill.unit_number}
                      <span className="block text-[10px] font-normal text-[var(--ink-faint)]">
                        {bill.tenant_name || 'Vacant - not billed'}
                        {bill.amount !== null
                          ? ` - billed ${formatKES(bill.amount)}${bill.amount_paid ? `, paid ${formatKES(bill.amount_paid)}` : ''}`
                          : ''}
                      </span>
                    </span>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      disabled={!bill.tenant_id}
                      value={typed[bill.unit_id] ?? ''}
                      onChange={(event) =>
                        setTyped((current) => ({ ...current, [bill.unit_id]: event.target.value }))
                      }
                      placeholder={bill.amount !== null ? `${bill.amount} (entered)` : 'Amount in KES'}
                      className={inputClass}
                    />
                  </label>
                ))}
              </div>
            </>
          )}
        </DataState>

        {error ? (
          <div className="mt-[14px]">
            <FormError error={error} />
          </div>
        ) : null}
      </ModalBody>

      <ModalFooter>
        <button type="button" onClick={onClose} className={secondaryButtonClass}>
          Cancel
        </button>
        <button type="submit" disabled={saving || !changed.length} className={primaryButtonClass}>
          {saving ? 'Saving...' : 'Save bills'}
        </button>
      </ModalFooter>
    </form>
  )
}

export default ElectricityBillsModal
