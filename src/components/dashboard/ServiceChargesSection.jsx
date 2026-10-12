import { useState } from 'react'
import { Plus } from 'lucide-react'
import {
  createServiceCharge,
  listServiceCharges,
  removeServiceCharge,
  updateServiceCharge,
} from '../../api/serviceCharges'
import { listUnits } from '../../api/units'
import { useApi } from '../../hooks/useApi'
import { moveInEstimate } from '../../utils/billing'
import { formatKES, formatMonth, toDateInput } from '../../utils/format'
import {
  EXPENSE_CATEGORIES,
  MOVE_IN_BILLING,
  SERVICE_CHARGE_ACCOUNTS,
  SERVICE_CHARGE_FREQUENCIES,
  optionLabel,
} from '../../utils/labels'
import { DataState, EmptyState, FormError } from '../common/DataState'
import {
  Field,
  ModalBody,
  ModalFooter,
  ModalShell,
  SelectField,
  inputClass,
  primaryButtonClass,
  secondaryButtonClass,
} from '../common/Modal'
import ConfirmDeleteModal from './ConfirmDeleteModal'

// "KES 300 per unit", or the range when units pay different amounts.
function amountLabel(charge) {
  const amounts = charge.unit_amounts.map((unit) => unit.amount).filter((amount) => amount > 0)

  if (!amounts.length) return formatKES(charge.amount)

  const lowest = Math.min(...amounts)
  const highest = Math.max(...amounts)

  return lowest === highest
    ? `${formatKES(lowest)} per unit`
    : `${formatKES(lowest)} - ${formatKES(highest)} per unit`
}

/*
  Costs the property passes on to its tenants, such as garbage or security.
  Shown on the Properties page for the selected property.
*/
function ServiceChargesSection({ property }) {
  const chargesState = useApi(`service-charges-${property.id}`, () => listServiceCharges(property.id))
  // null | { charge } - charge is undefined when adding.
  const [editing, setEditing] = useState(null)
  const [removing, setRemoving] = useState(null)
  // Result of the last charge added, so the owner sees what was billed.
  const [lastAdded, setLastAdded] = useState(null)

  async function handleRemove() {
    await removeServiceCharge(removing.id)
    chargesState.reload()
  }

  return (
    <section className="mt-6 overflow-hidden rounded-[10px] border border-[var(--line)] bg-white">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--line)] px-[18px] py-4">
        <div>
          <h3 className="text-[12px] font-bold">{property.name} - service charges</h3>
          <p className="mt-[3px] text-[10px] text-[var(--ink-faint)]">
            Costs you pass on to tenants, such as garbage or security. Paid
            into the{' '}
            {optionLabel(SERVICE_CHARGE_ACCOUNTS, property.service_charge_account, 'rent account').toLowerCase()}
            .
          </p>
        </div>

        <button
          onClick={() => setEditing({})}
          className="inline-flex items-center gap-2 rounded-[8px] border border-[var(--line)] bg-white px-3 py-2 text-[11px] font-bold"
        >
          <Plus size={13} />
          Add service charge
        </button>
      </div>

      {lastAdded?.property_id === property.id ? (
        <p className="border-b border-[var(--line-soft)] px-[18px] py-[10px] text-[11px] leading-[1.5] text-[#2E7D4F]">
          {lastAdded.name} was added.{' '}
          {lastAdded.billing.tenants_billed
            ? `${lastAdded.billing.tenants_billed} ${lastAdded.billing.tenants_billed === 1 ? 'tenant was' : 'tenants were'} billed ${formatKES(lastAdded.billing.total_billed)} in total.`
            : 'No tenant was billed now.'}
        </p>
      ) : null}

      <DataState
        state={chargesState}
        loadingLabel="Loading service charges..."
        isEmpty={(charges) => !charges.length}
        empty={
          <EmptyState
            title="No service charges"
            message="Tenants of this property are only billed rent, water and electricity. Add a charge here if they also pay for things like garbage or security."
          />
        }
      >
        {(charges) => (
          <div className="overflow-x-auto">
            <table className="min-w-[680px] w-full border-collapse">
              <thead>
                <tr className="bg-[var(--bg)] text-left text-[9px] uppercase tracking-[0.05em] text-[var(--ink-faint)]">
                  <th className="px-[18px] py-[10px] font-bold">Charge</th>
                  <th className="px-[18px] py-[10px] font-bold">Billed</th>
                  <th className="px-[18px] py-[10px] font-bold">Amount</th>
                  <th className="px-[18px] py-[10px] font-bold">Expense it covers</th>
                  <th className="px-[18px] py-[10px] font-bold"></th>
                </tr>
              </thead>
              <tbody>
                {charges.map((charge) => (
                  <tr key={charge.id} className="border-b border-[var(--line-soft)] last:border-b-0">
                    <td className="px-[18px] py-[13px] text-[12px] font-bold">{charge.name}</td>
                    <td className="px-[18px] py-[13px] text-[12px]">
                      {charge.frequency === 'monthly' ? 'Every month' : 'One-off'}
                    </td>
                    <td className="font-mono px-[18px] py-[13px] text-[12px]">{amountLabel(charge)}</td>
                    <td className="px-[18px] py-[13px] text-[12px]">
                      {optionLabel(EXPENSE_CATEGORIES, charge.category)}
                    </td>
                    <td className="px-[18px] py-[13px] text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => setEditing({ charge })}
                          className="rounded-[8px] border border-[var(--line)] bg-white px-3 py-2 text-[11px] font-bold text-[var(--ink)]"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => setRemoving(charge)}
                          className="rounded-[8px] border border-red-500 bg-white px-3 py-2 text-[11px] font-bold text-red-600"
                        >
                          Remove
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </DataState>

      {editing ? (
        <ServiceChargeForm
          property={property}
          charge={editing.charge}
          onClose={() => setEditing(null)}
          onSaved={(saved) => {
            setLastAdded(saved.billing ? saved : null)
            chargesState.reload()
          }}
        />
      ) : null}

      <ConfirmDeleteModal
        open={Boolean(removing)}
        title="Remove service charge"
        message={`${removing?.name || 'This charge'} will no longer be billed to tenants of ${property.name}. What they were already billed stays on their accounts.`}
        confirmLabel="Remove charge"
        onClose={() => setRemoving(null)}
        onConfirm={handleRemove}
      />
    </section>
  )
}

// Adds a charge, or edits one when `charge` is passed.
function ServiceChargeForm({ property, charge, onClose, onSaved }) {
  // Only needed when adding: the units, and who lives in them now.
  const unitsState = useApi(charge ? null : `units-${property.id}`, () => listUnits(property.id))

  const [form, setForm] = useState({
    name: charge?.name || '',
    category: charge?.category || 'garbage',
    frequency: charge?.frequency || 'monthly',
    amount: charge ? String(charge.amount) : '',
  })
  // unit id -> amount typed for that unit. Blank means the unit pays the amount above.
  const [unitAmounts, setUnitAmounts] = useState(
    Object.fromEntries(
      (charge?.unit_amounts || [])
        .filter((unit) => unit.custom)
        .map((unit) => [unit.unit_id, String(unit.amount)])
    )
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  const units = charge
    ? charge.unit_amounts.map((unit) => ({ id: unit.unit_id, unit_number: unit.unit_number }))
    : (unitsState.data || []).filter((unit) => unit.status !== 'inactive')

  function setField(field) {
    return (event) => setForm((current) => ({ ...current, [field]: event.target.value }))
  }

  function unitAmount(unit) {
    const typed = unitAmounts[unit.id]

    return Number(typed === undefined || typed === '' ? form.amount : typed) || 0
  }

  // What tenants living there now are billed when the charge is added.
  const today = toDateInput()
  const billedNow = (unitsState.data || [])
    .filter((unit) => unit.current_tenant && unitAmount(unit) > 0)
    .map((unit) =>
      form.frequency === 'once'
        ? unitAmount(unit)
        : moveInEstimate(property.move_in_billing, today, unitAmount(unit)).amount
    )
  const billedNowTotal = billedNow.reduce((total, amount) => total + amount, 0)

  async function handleSubmit(event) {
    event.preventDefault()
    setSaving(true)
    setError(null)

    const body = {
      name: form.name.trim(),
      category: form.category,
      amount: Number(form.amount) || 0,
      unit_amounts: units
        .filter((unit) => unitAmounts[unit.id] !== undefined && unitAmounts[unit.id] !== '')
        .map((unit) => ({ unit_id: unit.id, amount: Number(unitAmounts[unit.id]) })),
    }

    try {
      const saved = charge
        ? await updateServiceCharge(charge.id, body)
        : await createServiceCharge(property.id, { ...body, frequency: form.frequency })

      onSaved(saved)
      onClose()
    } catch (saveError) {
      setError(saveError)
      setSaving(false)
    }
  }

  return (
    <ModalShell
      title={charge ? `Edit service charge - ${charge.name}` : `Add service charge - ${property.name}`}
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-hidden">
        <ModalBody>
          <div className="grid gap-[14px] sm:grid-cols-2">
            <Field
              label="Name"
              placeholder="e.g. Garbage collection"
              value={form.name}
              onChange={setField('name')}
              required
              minLength={2}
              maxLength={100}
            />
            <SelectField
              label="Expense it covers"
              value={form.category}
              onChange={setField('category')}
              options={EXPENSE_CATEGORIES}
            />

            <SelectField
              label="How often"
              value={form.frequency}
              onChange={setField('frequency')}
              options={SERVICE_CHARGE_FREQUENCIES}
              disabled={Boolean(charge)}
            />
            <Field
              label={form.frequency === 'monthly' ? 'Amount per unit (KES / month)' : 'Amount per unit (KES)'}
              placeholder="e.g. 300"
              type="number"
              min="0"
              step="any"
              value={form.amount}
              onChange={setField('amount')}
              required
            />
          </div>

          <p className="mt-2 text-[10px] leading-[1.5] text-[var(--ink-faint)]">
            The name is what tenants see on their bill. The expense it covers
            lets Expenses compare what you spend with what tenants are charged.
            {charge
              ? ' How often it is billed cannot be changed; remove the charge and add a new one instead.'
              : ''}
          </p>

          <div className="mb-[10px] mt-[22px] flex items-center gap-3">
            <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--accent)]">
              Amount per unit
            </div>
            <div className="h-px flex-1 bg-[var(--line)]" />
          </div>

          <p className="mb-3 text-[11px] leading-[1.5] text-[var(--ink-faint)]">
            Every unit pays the amount above. Type a different amount next to
            a unit that pays more or less, or 0 for a unit that does not pay
            this charge.
          </p>

          {charge || unitsState.data ? (
            units.length ? (
              <div className="grid gap-[10px] sm:grid-cols-2">
                {units.map((unit) => (
                  <label key={unit.id} className="flex items-center gap-3 text-[12px]">
                    <span className="w-[110px] shrink-0 font-bold">
                      {unit.unit_number}
                      {unit.current_tenant ? (
                        <span className="block text-[10px] font-normal text-[var(--ink-faint)]">
                          {unit.current_tenant.full_name}
                        </span>
                      ) : null}
                    </span>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={unitAmounts[unit.id] ?? ''}
                      onChange={(event) =>
                        setUnitAmounts((current) => ({ ...current, [unit.id]: event.target.value }))
                      }
                      placeholder={form.amount ? `${form.amount} (same as above)` : 'Same as above'}
                      className={inputClass}
                    />
                  </label>
                ))}
              </div>
            ) : (
              <p className="text-[11px] text-[var(--ink-faint)]">
                This property has no units yet. Units added later pay the amount above.
              </p>
            )
          ) : (
            <DataState state={unitsState} loadingLabel="Loading units...">
              {() => null}
            </DataState>
          )}

          {charge ? (
            <p className="mt-[18px] text-[11px] leading-[1.5] text-[var(--ink-faint)]">
              New amounts apply to bills created from now on. What tenants
              were already billed is not changed.
            </p>
          ) : (
            <div className="mt-[18px] rounded-[8px] border border-[var(--line)] border-l-2 border-l-[var(--accent-soft-line)] bg-white px-4 py-3 text-[11px] leading-[1.6] text-[var(--ink-soft)]">
              {form.frequency === 'monthly' ? (
                <>
                  <strong>When you add this charge:</strong>{' '}
                  {billedNow.length
                    ? `${billedNow.length} ${billedNow.length === 1 ? 'tenant' : 'tenants'} living here now will be billed ${formatKES(billedNowTotal)} in total for the rest of ${formatMonth(today)}.`
                    : `No tenant is billed for ${formatMonth(today)}.`}{' '}
                  This follows the property&apos;s mid-month move-in rule
                  ({optionLabel(MOVE_IN_BILLING, property.move_in_billing).toLowerCase()}).
                  From the 1st of next month each tenant is billed the full
                  amount with rent.
                </>
              ) : (
                <>
                  <strong>When you add this charge:</strong>{' '}
                  {billedNow.length
                    ? `${billedNow.length} ${billedNow.length === 1 ? 'tenant' : 'tenants'} living here now will be billed ${formatKES(billedNowTotal)} in total, once.`
                    : 'No tenant is billed now.'}{' '}
                  Every new tenant is billed once when they move in.
                </>
              )}
            </div>
          )}

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
          <button type="submit" disabled={saving} className={primaryButtonClass}>
            {saving ? 'Saving...' : charge ? 'Save changes' : 'Add service charge'}
          </button>
        </ModalFooter>
      </form>
    </ModalShell>
  )
}

export default ServiceChargesSection
