import { useState } from 'react'
import { updateWaterRules } from '../../api/water'
import { ordinal } from '../../utils/format'
import { WATER_BILLING_METHODS } from '../../utils/labels'
import { FormError } from '../common/DataState'
import {
  Field,
  ModalBody,
  ModalFooter,
  ModalShell,
  SelectField,
  primaryButtonClass,
  secondaryButtonClass,
} from '../common/Modal'

const methodLabels = {
  per_unit_metered: 'Per-unit metered - bill by consumption',
  fixed_monthly: 'Flat monthly water charge',
  included_in_rent: 'Included in rent',
}

const readingDueOptions = [3, 5, 7].map((days) => [
  String(days),
  `Within ${days} days of billing day`,
])

// The day a water bill falls due: the rent due day, a fixed day, or the month's last day.
function billingDayOptions(current) {
  const options = [
    ['same_as_rent', 'Same day as rent is due'],
    ['1', '1st of every month'],
    ['5', '5th of every month'],
    ['last_day_of_month', 'Last day of every month'],
  ]

  // Keep a value saved earlier that is not one of the presets.
  if (current && !options.some(([value]) => value === current)) {
    const day = Number(String(current).match(/\d{1,2}/)?.[0])

    options.push([current, day ? `${ordinal(day)} of every month` : current])
  }

  return options
}

// Edits one property's water billing rules.
function WaterRulesModal({ open, ...props }) {
  if (!open || !props.property) return null

  return <WaterRulesForm {...props} />
}

function WaterRulesForm({ property, onClose, onSaved }) {
  const [form, setForm] = useState({
    water_billing_method: property.water_billing_method,
    water_rate_per_unit: String(property.water_rate_per_unit || ''),
    water_fixed_fee: String(property.water_fixed_fee || ''),
    water_billing_day: property.water_billing_day,
    water_reading_due_days: String(property.water_reading_due_days),
    // No longer offered on screen: nothing acted on it. The stored value is sent back unchanged.
    water_missed_reading_action: property.water_missed_reading_action,
    apply_to_occupied_units: false,
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  const metered = form.water_billing_method === 'per_unit_metered'
  const fixed = form.water_billing_method === 'fixed_monthly'

  function setField(field) {
    return (event) => setForm((current) => ({ ...current, [field]: event.target.value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setSaving(true)
    setError(null)

    try {
      await updateWaterRules(property.id, {
        water_billing_method: form.water_billing_method,
        ...(metered ? { water_rate_per_unit: Number(form.water_rate_per_unit) } : {}),
        ...(fixed ? { water_fixed_fee: Number(form.water_fixed_fee) } : {}),
        water_billing_day: form.water_billing_day,
        water_reading_due_days: Number(form.water_reading_due_days),
        water_missed_reading_action: form.water_missed_reading_action,
        apply_to_occupied_units: form.apply_to_occupied_units,
      })

      onSaved?.()
      onClose()
    } catch (saveError) {
      setError(saveError)
      setSaving(false)
    }
  }

  return (
    <ModalShell title={`Water billing rules - ${property.name}`} onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-hidden">
        <ModalBody>
          <p className="mb-[18px] text-[11px] leading-[1.5] text-[var(--ink-faint)]">
            Set how water is billed for this property. Once a meter reading
            is submitted, Kodi uses these rules to calculate the bill
            automatically.
          </p>

          <div className="grid gap-[18px]">
            <SelectField
              label="Billing method"
              value={form.water_billing_method}
              onChange={setField('water_billing_method')}
              options={WATER_BILLING_METHODS.map(([value]) => [value, methodLabels[value]])}
            />

            <div className="grid gap-[14px] sm:grid-cols-2">
              {metered ? (
                <Field
                  label="Rate per unit (KES)"
                  placeholder="e.g. 100"
                  type="number"
                  min="1"
                  step="any"
                  value={form.water_rate_per_unit}
                  onChange={setField('water_rate_per_unit')}
                  required
                />
              ) : null}

              {fixed ? (
                <Field
                  label="Monthly water charge (KES)"
                  placeholder="e.g. 500"
                  type="number"
                  min="1"
                  step="any"
                  value={form.water_fixed_fee}
                  onChange={setField('water_fixed_fee')}
                  required
                />
              ) : null}

              <SelectField
                label="Bill due day"
                value={form.water_billing_day}
                onChange={setField('water_billing_day')}
                options={billingDayOptions(property.water_billing_day)}
              />
            </div>

            {metered ? (
              <>
                <div className="max-w-[292px]">
                  <SelectField
                    label="Reading due"
                    value={form.water_reading_due_days}
                    onChange={setField('water_reading_due_days')}
                    options={
                      readingDueOptions.some(([value]) => value === form.water_reading_due_days)
                        ? readingDueOptions
                        : [
                            ...readingDueOptions,
                            [
                              form.water_reading_due_days,
                              `Within ${form.water_reading_due_days} days of billing day`,
                            ],
                          ]
                    }
                  />
                </div>

              </>
            ) : null}

            <label className="flex items-start gap-3 text-[12px] font-medium">
              <input
                type="checkbox"
                checked={form.apply_to_occupied_units}
                onChange={(event) =>
                  setForm((current) => ({ ...current, apply_to_occupied_units: event.target.checked }))
                }
                className="mt-[2px] h-[13px] w-[13px]"
              />
              <span>
                Also apply to units that already have a tenant
                <span className="mt-[2px] block text-[10px] font-normal text-[var(--ink-faint)]">
                  Without this, the new method and rate reach vacant
                  units only, and sitting tenants keep their current
                  water billing.
                </span>
              </span>
            </label>

            {metered ? (
              <div className="rounded-[8px] border border-[var(--line)] bg-[var(--surface)] px-4 py-4">
                <h3 className="text-[14px] font-bold text-[var(--ink)]">Flag suspicious readings</h3>
                <p className="mt-1 text-[11px] leading-[1.5] text-[var(--ink-faint)]">
                  Kodi already flags any reading lower than the previous one so
                  you can catch entry errors before a tenant is billed.
                </p>
              </div>
            ) : null}
          </div>

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
            {saving ? 'Saving...' : 'Save rules'}
          </button>
        </ModalFooter>
      </form>
    </ModalShell>
  )
}

export default WaterRulesModal
