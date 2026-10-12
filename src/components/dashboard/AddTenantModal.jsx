import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createTenant } from '../../api/tenants'
import { listUnits } from '../../api/units'
import { useProperties } from '../../context/PropertiesContext'
import { useApi } from '../../hooks/useApi'
import { moveInEstimate } from '../../utils/billing'
import { formatKES, toDateInput } from '../../utils/format'
import { MOVE_IN_BILLING, optionLabel } from '../../utils/labels'
import { FormError } from '../common/DataState'
import {
  Field,
  ModalBody,
  ModalFooter,
  ModalShell,
  inputClass,
  labelClass,
  primaryButtonClass,
  secondaryButtonClass,
} from '../common/Modal'

function AddTenantModal({ open, onClose }) {
  if (!open) return null

  return <AddTenantForm onClose={onClose} />
}

function AddTenantForm({ onClose }) {
  const navigate = useNavigate()
  const propertiesState = useProperties()
  const properties = propertiesState.data || []

  const [form, setForm] = useState({
    full_name: '',
    phone: '',
    national_id: '',
    email: '',
    property_id: '',
    unit_id: '',
    move_in_date: toDateInput(),
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  const property =
    properties.find((item) => String(item.id) === form.property_id) || properties[0]

  const unitsState = useApi(property ? `units-${property.id}` : null, () => listUnits(property.id))
  // A tenant can only move into a vacant or reserved unit.
  const availableUnits = (unitsState.data || []).filter((unit) =>
    ['vacant', 'reserved'].includes(unit.status)
  )
  const unit = availableUnits.find((item) => String(item.id) === form.unit_id) || availableUnits[0]

  function setField(field) {
    return (event) => setForm((current) => ({ ...current, [field]: event.target.value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()

    if (!unit) {
      setError({ message: 'Choose a vacant unit for this tenant.' })
      return
    }

    setSaving(true)
    setError(null)

    try {
      const tenant = await createTenant(property.id, {
        unit_id: unit.id,
        full_name: form.full_name.trim(),
        phone: form.phone.replace(/\s/g, ''),
        national_id: form.national_id.trim() || null,
        email: form.email.trim() || null,
        move_in_date: form.move_in_date,
      })

      // Unit counts and occupancy shown elsewhere are now out of date.
      propertiesState.reload()
      onClose()
      navigate(`/tenants/${tenant.id}`)
    } catch (saveError) {
      setError(saveError)
      setSaving(false)
    }
  }

  return (
    <ModalShell title="Add tenant" onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-hidden">
        <ModalBody>
          <div className="mb-[18px]">
            <Field
              label="Full name"
              placeholder="e.g. John Otieno"
              value={form.full_name}
              onChange={setField('full_name')}
              required
              minLength={2}
            />
          </div>

          <div className="mb-[18px] grid gap-[14px] sm:grid-cols-2">
            <Field
              label="Phone number"
              placeholder="e.g. 0722 000 019"
              inputMode="tel"
              value={form.phone}
              onChange={setField('phone')}
              required
              hint="The M-Pesa number they pay from. Payments from it are matched automatically."
            />
            <Field
              label="ID number"
              placeholder="Optional"
              value={form.national_id}
              onChange={setField('national_id')}
            />

            <Field
              label="Email"
              type="email"
              placeholder="Optional"
              value={form.email}
              onChange={setField('email')}
            />
            <Field
              label="Move-in date"
              type="date"
              value={form.move_in_date}
              onChange={setField('move_in_date')}
              required
            />

            <div>
              <label className={labelClass}>Property</label>
              <select
                value={property?.id || ''}
                onChange={(event) =>
                  setForm((current) => ({ ...current, property_id: event.target.value, unit_id: '' }))
                }
                className={inputClass}
              >
                {properties.map((item) => (
                  <option key={item.id} value={item.id}>{item.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className={labelClass}>House / unit</label>
              <select
                value={unit?.id || ''}
                onChange={setField('unit_id')}
                disabled={!availableUnits.length}
                className={inputClass}
              >
                {availableUnits.length ? null : (
                  <option value="">
                    {unitsState.loading ? 'Loading units...' : 'No vacant units in this property'}
                  </option>
                )}
                {availableUnits.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.unit_number} - {item.status}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {unit && form.move_in_date ? (
            <MoveInSummary property={property} unit={unit} moveInDate={form.move_in_date} />
          ) : null}

          <p className="mt-[14px] text-[11px] text-[var(--ink-faint)]">
            A tenancy agreement will be auto-generated from your default
            template.
          </p>

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

          <button type="submit" disabled={saving || !unit} className={primaryButtonClass}>
            {saving ? 'Adding tenant...' : 'Add tenant'}
          </button>
        </ModalFooter>
      </form>
    </ModalShell>
  )
}

// What the tenant will owe on day one. Rent and deposits come from the unit, not from this form.
function MoveInSummary({ property, unit, moveInDate }) {
  const rent = moveInEstimate(property.move_in_billing, moveInDate, unit.monthly_rent)
  const estimate = (amount) => moveInEstimate(property.move_in_billing, moveInDate, amount).amount
  const fixedWater =
    unit.water_billing_method === 'fixed_monthly' ? unit.water_fixed_monthly_bill || 0 : 0

  const rows = [
    ['Rent deposit', unit.rent_deposit],
    ['Water deposit', unit.water_deposit],
    ['Electricity deposit', unit.electricity_deposit || 0],
    [
      rent.days === rent.daysInMonth
        ? 'First month rent (full month)'
        : `First month rent (${rent.days} of ${rent.daysInMonth} days)`,
      rent.amount,
    ],
    ['First month electricity', estimate(unit.electricity_monthly_charge || 0)],
    ['First month water', estimate(fixedWater)],
  ].filter(([, amount]) => amount > 0)

  const total = rows.reduce((sum, [, amount]) => sum + amount, 0)

  return (
    <div className="rounded-[8px] border border-[var(--line)] border-l-2 border-l-[var(--accent-soft-line)] bg-[var(--surface)] px-4 py-4">
      <h3 className="text-[13px] font-bold text-[var(--ink)]">
        Due at move-in for {unit.unit_number}
      </h3>
      <p className="mt-1 text-[11px] leading-[1.5] text-[var(--ink-faint)]">
        Monthly rent is {formatKES(unit.monthly_rent)}. This property bills a
        mid-month move-in as: {optionLabel(MOVE_IN_BILLING, property.move_in_billing).toLowerCase()}.
      </p>

      <div className="mt-3">
        {rows.map(([label, amount]) => (
          <div
            key={label}
            className="flex items-center justify-between border-b border-[var(--line-soft)] py-[7px] text-[12px]"
          >
            <span className="text-[var(--ink-soft)]">{label}</span>
            <span className="font-mono font-semibold">{formatKES(amount)}</span>
          </div>
        ))}

        <div className="flex items-center justify-between pt-[9px] text-[12px]">
          <span className="font-bold">Total</span>
          <span className="font-mono font-bold">{formatKES(total)}</span>
        </div>
      </div>
    </div>
  )
}

export default AddTenantModal
