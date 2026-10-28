import { useState } from 'react'
import { listTenants, recordManualPayment } from '../../api/tenants'
import { useProperties } from '../../context/PropertiesContext'
import { useApi } from '../../hooks/useApi'
import { paymentAccountHint } from '../../utils/accountSharing'
import { toDateInput } from '../../utils/format'
import { PAYMENT_ACCOUNTS, PAYMENT_ACCOUNT_HINTS, PAYMENT_METHODS } from '../../utils/payments'
import { isCurrentTenant } from '../../utils/tenantStatus'
import { FormError } from '../common/DataState'
import {
  Field,
  ModalBody,
  ModalFooter,
  ModalShell,
  SelectField,
  inputClass,
  labelClass,
  primaryButtonClass,
  secondaryButtonClass,
} from '../common/Modal'

/*
  Records cash or any payment that did not arrive through M-Pesa matching.
  Pass `tenant` to record for that tenant; without it the owner picks one.
*/
function RecordPaymentModal({ tenant, onClose, onDone }) {
  // Only loaded when the tenant has to be chosen.
  const tenantsState = useApi(tenant ? null : 'tenants', () => listTenants())
  const tenants = (tenantsState.data || []).filter(isCurrentTenant)

  const [form, setForm] = useState({
    tenant_id: '',
    amount: '',
    received_on: toDateInput(),
    payment_method: 'cash',
    account_for: 'rent',
    reference: '',
    notes: '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  const payer = tenant || tenants.find((item) => String(item.id) === form.tenant_id)
  // The payer's property: which bills each account pays there.
  const property = useProperties()?.data?.find((item) => item.id === payer?.property_id)

  function setField(field) {
    return (event) => setForm((current) => ({ ...current, [field]: event.target.value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setSaving(true)
    setError(null)

    try {
      await recordManualPayment(payer.id, {
        amount: Number(form.amount),
        payment_method: form.payment_method,
        account_for: form.account_for,
        // Today's payments keep the current time; earlier dates are recorded at midday.
        received_at:
          form.received_on === toDateInput()
            ? new Date().toISOString()
            : new Date(`${form.received_on}T12:00:00`).toISOString(),
        reference: form.reference.trim() || null,
        notes: form.notes.trim() || null,
      })

      onDone()
      onClose()
    } catch (saveError) {
      setError(saveError)
      setSaving(false)
    }
  }

  return (
    <ModalShell title="Record manual payment" onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-hidden">
        <ModalBody>
          <p className="mb-[18px] text-[11px] leading-[1.5] text-[var(--ink-faint)]">
            For cash, or any payment that didn't come through M-Pesa
            auto-matching.{' '}
            {payer
              ? `This is applied straight to ${payer.full_name}'s balance for House ${payer.unit_number}, deposits first.`
              : 'It is applied straight to the tenant’s balance, deposits first.'}
          </p>

          {tenant ? null : (
            <div className="mb-[14px]">
              <label className={labelClass}>Tenant</label>
              <select
                value={form.tenant_id}
                onChange={setField('tenant_id')}
                required
                className={inputClass}
              >
                <option value="">
                  {tenantsState.loading ? 'Loading tenants...' : 'Choose a tenant'}
                </option>
                {tenants.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.full_name} - {item.property_name} · {item.unit_number}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="grid gap-[14px] sm:grid-cols-2">
            <Field
              label="Amount (KES)"
              placeholder="e.g. 5000"
              type="number"
              min="1"
              step="any"
              value={form.amount}
              onChange={setField('amount')}
              required
            />
            <Field
              label="Date received"
              type="date"
              max={toDateInput()}
              value={form.received_on}
              onChange={setField('received_on')}
              required
            />

            <SelectField
              label="Payment method"
              value={form.payment_method}
              onChange={setField('payment_method')}
              options={PAYMENT_METHODS}
            />
            <SelectField
              label="Apply to"
              value={form.account_for}
              onChange={setField('account_for')}
              options={PAYMENT_ACCOUNTS}
            />
          </div>

          <p className="mt-2 text-[10px] leading-[1.5] text-[var(--ink-faint)]">
            {paymentAccountHint(form.account_for, property) || PAYMENT_ACCOUNT_HINTS[form.account_for]} Anything left over is
            kept as credit for the next bill.
          </p>

          <div className="mt-[18px] grid gap-[14px]">
            <Field
              label="Reference (optional)"
              placeholder="e.g. receipt or transaction number"
              value={form.reference}
              onChange={setField('reference')}
            />
            <Field
              label="Notes (optional)"
              placeholder="e.g. Paid in person at the office"
              value={form.notes}
              onChange={setField('notes')}
            />
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
          <button type="submit" disabled={saving || !payer} className={primaryButtonClass}>
            {saving ? 'Recording...' : 'Record payment'}
          </button>
        </ModalFooter>
      </form>
    </ModalShell>
  )
}

export default RecordPaymentModal
