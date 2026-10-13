import { useState } from 'react'
import { X } from 'lucide-react'
import { createUnit, updateUnit } from '../../api/units'
import { formatKES } from '../../utils/format'
import {
  ELECTRICITY_BILLING,
  UNIT_TYPES,
  WATER_BILLING_METHODS,
} from '../../utils/labels'
import { FormError } from '../common/DataState'

const inputClass =
  'h-10 w-full rounded-[8px] border border-[var(--line)] bg-[var(--surface)] px-3 text-[12px] text-[var(--ink)] outline-none placeholder:text-[var(--ink-faint)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)] disabled:bg-[var(--line-soft)] disabled:text-[var(--ink-faint)]'

const labelClass = 'mb-2 block text-[11px] font-bold text-[var(--ink)]'

// The choice in the unit type list that opens a box for typing a new type.
const NEW_TYPE = '__new_type__'

// Adds a unit to `property`, or edits `unit` when one is passed.
function UnitFormModal({ open, ...props }) {
  if (!open || !props.property) return null

  return <UnitForm {...props} />
}

function UnitForm({ property, unit, customTypes = [], onClose, onSaved }) {
  const editing = Boolean(unit)
  const occupied = unit?.status === 'occupied'

  const [form, setForm] = useState({
    unit_number: unit?.unit_number || '',
    block_or_floor: unit?.block_or_floor || '',
    unit_type: unit?.unit_type || 'bedsitter',
    monthly_rent: unit ? String(unit.monthly_rent) : '',
    rent_deposit: unit ? String(unit.rent_deposit) : '',
    water_deposit: unit?.water_deposit ? String(unit.water_deposit) : '',
    // New units start from the property's water rules.
    water_billing_method: unit?.water_billing_method || property.water_billing_method,
    water_rate_per_unit: String(
      unit?.water_rate_per_unit ?? (property.water_rate_per_unit || '')
    ),
    water_fixed_monthly_bill: String(
      unit?.water_fixed_monthly_bill ?? (property.water_fixed_fee || '')
    ),
    water_meter_number: unit?.water_meter_number || '',
    electricity_billing:
      unit?.electricity_billing_method === 'entered'
        ? 'entered'
        : unit?.electricity_monthly_charge
          ? 'fixed_monthly'
          : 'none',
    electricity_monthly_charge: unit?.electricity_monthly_charge
      ? String(unit.electricity_monthly_charge)
      : '',
    electricity_deposit: unit?.electricity_deposit ? String(unit.electricity_deposit) : '',
  })
  // What the owner is typing after choosing "Add a new type".
  const [newType, setNewType] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  // The usual types, then the ones this owner has typed before, then the way to add another.
  const typeOptions = [
    ...UNIT_TYPES,
    ...customTypes.map((type) => [type, type]),
    [NEW_TYPE, 'Add a new type...'],
  ]
  const addingType = form.unit_type === NEW_TYPE

  const metered = form.water_billing_method === 'per_unit_metered'
  const fixed = form.water_billing_method === 'fixed_monthly'

  function setField(field) {
    return (event) => setForm((current) => ({ ...current, [field]: event.target.value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setSaving(true)
    setError(null)

    const body = {
      unit_number: form.unit_number.trim(),
      block_or_floor: form.block_or_floor.trim() || null,
      unit_type: addingType ? newType.trim() : form.unit_type,
      monthly_rent: Number(form.monthly_rent),
      rent_deposit: Number(form.rent_deposit) || 0,
      // Empty means this unit has no water deposit.
      water_deposit: Number(form.water_deposit) || 0,
      water_billing_method: form.water_billing_method,
      water_rate_per_unit: metered ? Number(form.water_rate_per_unit) : null,
      water_meter_number: metered ? form.water_meter_number.trim() : null,
      water_fixed_monthly_bill: fixed ? Number(form.water_fixed_monthly_bill) : null,
      // "Not billed" is a fixed monthly amount of nothing.
      electricity_billing_method:
        form.electricity_billing === 'entered' ? 'entered' : 'fixed_monthly',
      electricity_monthly_charge:
        form.electricity_billing === 'fixed_monthly'
          ? Number(form.electricity_monthly_charge) || null
          : null,
      electricity_deposit: Number(form.electricity_deposit) || null,
      // A unit is occupied only through a tenant; otherwise it is vacant.
      ...(occupied ? {} : { status: 'vacant' }),
    }

    try {
      if (editing) {
        await updateUnit(unit.id, body)
      } else {
        await createUnit(property.id, body)
      }

      onSaved?.()
      onClose()
    } catch (saveError) {
      setError(saveError)
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/45 px-4 py-8">
      <div className="flex max-h-[90vh] w-full max-w-[640px] flex-col overflow-hidden rounded-[14px] bg-[var(--surface)] shadow-[0_24px_80px_rgba(0,0,0,0.28)]">
        <div className="flex items-center justify-between border-b border-[var(--line)] px-[22px] py-[18px]">
          <h2 className="font-display text-[15px] font-semibold text-[var(--ink)]">
            {editing ? `Edit unit - ${unit.unit_number}` : `Add unit / house - ${property.name}`}
          </h2>

          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--line-soft)] text-[var(--ink-soft)] transition hover:bg-[var(--line)] hover:text-[var(--ink)]"
          >
            <X size={15} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-hidden">
          <div className="grid flex-1 gap-[18px] overflow-y-auto px-[22px] py-[22px] sm:grid-cols-2">
            <Field
              label="House number"
              placeholder="e.g. H15"
              value={form.unit_number}
              onChange={setField('unit_number')}
              required
            />
            <Field
              label="Floor"
              placeholder="e.g. Floor 2"
              value={form.block_or_floor}
              onChange={setField('block_or_floor')}
            />

            <SelectField
              label="Unit type"
              value={form.unit_type}
              onChange={setField('unit_type')}
              options={typeOptions}
            />

            {addingType ? (
              <div className="sm:col-span-2">
                <Field
                  label="New unit type"
                  placeholder="e.g. Single room"
                  value={newType}
                  onChange={(event) => setNewType(event.target.value)}
                  required
                  minLength={2}
                  maxLength={50}
                  autoFocus
                />
                <p className="mt-2 text-[10px] text-[var(--ink-faint)]">
                  It is saved with this unit and offered again for the other units of this property.
                </p>
              </div>
            ) : null}

            <Field
              label="Monthly rent (KES)"
              placeholder="e.g. 15000"
              type="number"
              min="1"
              step="any"
              value={form.monthly_rent}
              onChange={setField('monthly_rent')}
              required
            />
            <Field
              label="Rent deposit (KES)"
              placeholder="e.g. 15000"
              type="number"
              min="0"
              step="any"
              value={form.rent_deposit}
              onChange={setField('rent_deposit')}
              required
            />

            <SelectField
              label="Water billing"
              value={form.water_billing_method}
              onChange={setField('water_billing_method')}
              options={WATER_BILLING_METHODS}
            />

            {metered ? (
              <>
                <Field
                  label="Water rate per unit (KES)"
                  placeholder="e.g. 100"
                  type="number"
                  min="1"
                  step="any"
                  value={form.water_rate_per_unit}
                  onChange={setField('water_rate_per_unit')}
                  required
                />
                <Field
                  label="Water meter number"
                  placeholder="e.g. GV-H15-01"
                  value={form.water_meter_number}
                  onChange={setField('water_meter_number')}
                  required
                />
              </>
            ) : null}

            {fixed ? (
              <Field
                label="Fixed water bill (KES / month)"
                placeholder="e.g. 500"
                type="number"
                min="1"
                step="any"
                value={form.water_fixed_monthly_bill}
                onChange={setField('water_fixed_monthly_bill')}
                required
              />
            ) : null}

            <Field
              label="Water deposit (KES, optional)"
              placeholder="e.g. 2000"
              type="number"
              min="0"
              step="any"
              value={form.water_deposit}
              onChange={setField('water_deposit')}
            />

            <SelectField
              label="Electricity billing"
              value={form.electricity_billing}
              onChange={setField('electricity_billing')}
              options={ELECTRICITY_BILLING}
            />

            {form.electricity_billing === 'fixed_monthly' ? (
              <Field
                label="Electricity (KES / month)"
                placeholder="e.g. 2000"
                type="number"
                min="1"
                step="any"
                value={form.electricity_monthly_charge}
                onChange={setField('electricity_monthly_charge')}
                required
              />
            ) : null}

            <Field
              label="Electricity deposit (KES, optional)"
              placeholder="e.g. 2000"
              type="number"
              min="0"
              step="any"
              value={form.electricity_deposit}
              onChange={setField('electricity_deposit')}
            />

            <p className="-mt-2 text-[10px] leading-[1.5] text-[var(--ink-faint)] sm:col-span-2">
              {form.electricity_billing === 'fixed_monthly'
                ? "The fixed amount is added to the tenant's bill on the 1st of every month, together with rent."
                : form.electricity_billing === 'entered'
                  ? 'You type what this unit owes each month with "Enter electricity bills" on the Units page, and the tenant is billed exactly that.'
                  : 'Electricity is not billed for this unit.'}{' '}
              Each deposit you set is charged once, in full, when a tenant
              moves in; a deposit left empty is not charged.
            </p>

            <div className="sm:col-span-2">
              <label className={labelClass}>Status</label>

              <div className="flex h-10 items-center rounded-[8px] border border-[var(--line)] bg-[var(--line-soft)] px-3 text-[12px] text-[var(--ink-faint)]">
                {occupied
                  ? `Occupied${unit.current_tenant ? ` - ${unit.current_tenant.full_name}` : ''}`
                  : 'Vacant'}
              </div>

              <p className="mt-2 text-[10px] text-[var(--ink-faint)]">
                {occupied
                  ? 'The status changes when the tenant moves out.'
                  : 'A unit becomes "Occupied" automatically once a tenant is added to it. To stop using a unit, mark it "Not in use" on the units page.'}
              </p>
            </div>

            {occupied && Number(form.monthly_rent) !== unit.monthly_rent ? (
              <p className="text-[11px] leading-[1.5] text-[var(--warning)] sm:col-span-2">
                {unit.current_tenant?.full_name || 'The current tenant'} will be
                charged the new rent from now on. Rent that has already been
                billed stays at {formatKES(unit.monthly_rent)}.
              </p>
            ) : null}

            {error ? (
              <div className="sm:col-span-2">
                <FormError error={error} />
              </div>
            ) : null}
          </div>

          <div className="flex justify-end gap-[10px] border-t border-[var(--line)] px-[22px] py-[16px]">
            <button
              type="button"
              onClick={onClose}
              className="rounded-[8px] border border-[var(--line)] bg-[var(--surface)] px-5 py-[10px] text-[12px] font-bold text-[var(--ink)]"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              className="rounded-[8px] border border-[var(--accent)] bg-[var(--accent)] px-5 py-[10px] text-[12px] font-bold text-white disabled:opacity-50"
            >
              {saving ? 'Saving...' : editing ? 'Save changes' : 'Add unit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function Field({ label, ...inputProps }) {
  return (
    <div>
      <label className={labelClass}>{label}</label>
      <input type="text" {...inputProps} className={inputClass} />
    </div>
  )
}

function SelectField({ label, options, value, onChange }) {
  return (
    <div>
      <label className={labelClass}>{label}</label>
      <select value={value} onChange={onChange} className={inputClass}>
        {options.map(([optionValue, optionLabel]) => (
          <option key={optionValue} value={optionValue}>
            {optionLabel}
          </option>
        ))}
      </select>
    </div>
  )
}

export default UnitFormModal
