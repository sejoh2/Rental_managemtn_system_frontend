import { useState } from 'react'
import { X } from 'lucide-react'
import { assignCaretaker, listCaretakers, updatePropertyCaretaker } from '../../api/caretakers'
import {
  removePaymentAccount,
  replacePaymentAccount,
  updateProperty,
} from '../../api/properties'
import { useApi } from '../../hooks/useApi'
import { humanize } from '../../utils/format'
import {
  MOVE_IN_BILLING,
  MOVE_OUT_BILLING,
  PROPERTY_TYPES,
  RENT_DUE_DAYS,
  SERVICE_CHARGE_ACCOUNTS,
  ELECTRICITY_BILLING,
  paymentAccountTypeLabel,
} from '../../utils/labels'
import {
  caretakerDetails,
  emptyAccount,
  emptyCaretaker,
  uniqueCaretakers,
} from '../../utils/propertyForm'
import { FormError } from '../common/DataState'
import CaretakerField from './CaretakerField'
import { samePermissions } from '../../utils/labels'
import PaymentAccountCard from './PaymentAccountCard'
import SmsSenderField from './SmsSenderField'

const accountSlots = [
  ['rent', 'Rent account'],
  ['water', 'Water account'],
  ['electricity', 'Electricity account'],
  ['service', 'Service charges account'],
]

function EditPropertyModal({ open, property, ...props }) {
  if (!open || !property) return null

  return <EditPropertyForm property={property} {...props} />
}

function EditPropertyForm({ property, onClose, onSaved }) {
  const caretakers = useApi('caretakers', listCaretakers)
  const currentCaretaker = property.caretaker

  const [form, setForm] = useState({
    name: property.name,
    location: property.location,
    property_type: property.property_type,
    expected_units: String(property.expected_units),
    rent_due_day: String(property.rent_due_day),
    move_in_billing: property.move_in_billing,
    move_out_billing: property.move_out_billing,
    sms_sender_id: property.sms_sender_id || '',
    service_charge_account: property.service_charge_account || 'rent',
    // How electricity is billed; units that follow the property change with it.
    electricity_billing_method: property.electricity_billing_method || 'none',
    electricity_monthly_charge: property.electricity_monthly_charge ? String(property.electricity_monthly_charge) : '',
    electricity_apply_occupied: false,
  })
  const [caretaker, setCaretaker] = useState(
    currentCaretaker
      ? {
          ...emptyCaretaker,
          mode: 'existing',
          caretakerId: String(currentCaretaker.caretaker_id),
          permissions: currentCaretaker.permissions || emptyCaretaker.permissions,
        }
      : emptyCaretaker
  )
  // A new account form is shown only for the accounts the owner chose to change.
  const [changing, setChanging] = useState({
    rent: false,
    water: false,
    electricity: false,
    service: false,
  })
  const [accounts, setAccounts] = useState({
    rent: emptyAccount,
    water: emptyAccount,
    electricity: emptyAccount,
    service: emptyAccount,
  })
  // Optional accounts the owner marked for removal; applied on save.
  const [removing, setRemoving] = useState({ water: false, electricity: false, service: false })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  const existingCaretakers = uniqueCaretakers(caretakers.data)

  // Has, or is getting in this save, an account of its own.
  const keeps = (accountFor) => changing[accountFor] || (property[`${accountFor}_account`] && !removing[accountFor])

  /*
    Service charges and repairs are paid into one account: their own account
    when the property has one, otherwise rent, water or electricity.
  */
  const serviceChargeAccounts = SERVICE_CHARGE_ACCOUNTS.filter(
    ([accountFor]) => accountFor === 'rent' || (accountFor !== 'service' && keeps(accountFor))
  )
  const serviceChargeAccount = keeps('service')
    ? 'service'
    : serviceChargeAccounts.some(([accountFor]) => accountFor === form.service_charge_account)
      ? form.service_charge_account
      : 'rent'

  const electricityChanged =
    form.electricity_billing_method !== (property.electricity_billing_method || 'none') ||
    (form.electricity_billing_method === 'fixed_monthly' &&
      Number(form.electricity_monthly_charge) !== Number(property.electricity_monthly_charge || 0))

  function setField(field) {
    return (event) => setForm((current) => ({ ...current, [field]: event.target.value }))
  }

  function patchAccount(accountFor, patch) {
    setAccounts((current) => ({
      ...current,
      [accountFor]: { ...current[accountFor], ...patch },
    }))
  }

  function startChanging(accountFor) {
    const currentAccount = property[`${accountFor}_account`]

    patchAccount(accountFor, {
      ...emptyAccount,
      accountType: currentAccount?.account_type || 'paybill',
      environment: currentAccount?.environment || 'sandbox',
    })
    setChanging((current) => ({ ...current, [accountFor]: true }))
  }

  async function saveCaretaker() {
    if (caretaker.mode === 'none') {
      if (currentCaretaker) {
        await updatePropertyCaretaker(property.id, { status: 'inactive' })
      }

      return
    }

    const sameCaretaker =
      caretaker.mode === 'existing' &&
      caretaker.caretakerId === String(currentCaretaker?.caretaker_id)

    if (sameCaretaker) {
      if (!samePermissions(caretaker.permissions, currentCaretaker.permissions)) {
        await updatePropertyCaretaker(property.id, { permissions: caretaker.permissions })
      }

      return
    }

    const details = caretakerDetails(caretaker, existingCaretakers)

    if (details) await assignCaretaker(property.id, details)
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError(null)

    const accountsToChange = accountSlots
      .map(([accountFor]) => accountFor)
      .filter((accountFor) => changing[accountFor])
    const notConnected = accountsToChange.find(
      (accountFor) => accounts[accountFor].status !== 'connected'
    )

    if (notConnected) {
      setError({
        message: `Connect the ${notConnected} account first, or cancel that change.`,
      })
      return
    }

    setSaving(true)

    // Each part is its own request, so report which ones went through if a later one fails.
    const saved = []

    try {
      await updateProperty(property.id, {
        name: form.name,
        location: form.location,
        property_type: form.property_type,
        expected_units: Number(form.expected_units) || 0,
        rent_due_day: Number(form.rent_due_day),
        move_in_billing: form.move_in_billing,
        move_out_billing: form.move_out_billing,
        sms_sender_id: form.sms_sender_id.trim() || null,
        // Sent only when changed, so the units are not touched otherwise.
        ...(electricityChanged
          ? {
              electricity_billing_method: form.electricity_billing_method,
              electricity_monthly_charge:
                form.electricity_billing_method === 'fixed_monthly' ? Number(form.electricity_monthly_charge) : 0,
              apply_to_occupied_units: form.electricity_apply_occupied,
            }
          : {}),
      })
      saved.push('property details')

      for (const accountFor of ['water', 'electricity', 'service']) {
        if (removing[accountFor] && !changing[accountFor]) {
          await removePaymentAccount(property.id, accountFor)
          saved.push(`${accountFor} account removal`)
          setRemoving((current) => ({ ...current, [accountFor]: false }))
        }
      }

      for (const accountFor of accountsToChange) {
        await replacePaymentAccount(property.id, accountFor, accounts[accountFor].connectionId)
        saved.push(`${accountFor} account`)
        setChanging((current) => ({ ...current, [accountFor]: false }))
      }

      // Saved after the accounts, because the chosen account must already exist.
      if (serviceChargeAccount !== property.service_charge_account) {
        await updateProperty(property.id, { service_charge_account: serviceChargeAccount })
        saved.push('service charge account choice')
      }

      await saveCaretaker()

      onSaved?.()
      onClose()
    } catch (saveError) {
      if (saved.length) onSaved?.()

      setError({
        message: saved.length
          ? `Saved the ${saved.join(' and ')}, but the next change failed: ${saveError.message}`
          : saveError.message,
      })
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/45 px-4 py-8">
      <div className="flex max-h-[90vh] w-full max-w-[640px] flex-col overflow-hidden rounded-[14px] bg-[var(--surface)] shadow-[0_24px_80px_rgba(0,0,0,0.28)]">
        <div className="flex items-center justify-between border-b border-[var(--line)] px-[22px] py-[18px]">
          <h2 className="font-display text-[15px] font-semibold text-[var(--ink)]">
            Edit property - {property.name}
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
          <div className="flex-1 overflow-y-auto px-[22px] py-[22px]">
            <p className="mb-[18px] text-[11px] leading-[1.5] text-[var(--ink-faint)]">
              Changes here update this property everywhere it appears - Units,
              Reports, SMS centre and Settings.
            </p>

            <Field label="Property name" value={form.name} onChange={setField('name')} required />

            <div className="mb-[18px] grid gap-[14px] sm:grid-cols-2">
              <Field label="Location" value={form.location} onChange={setField('location')} required />

              <SelectField
                label="Property type"
                value={form.property_type}
                onChange={setField('property_type')}
                options={PROPERTY_TYPES}
              />

              <Field
                label="Number of units"
                type="number"
                min="0"
                value={form.expected_units}
                onChange={setField('expected_units')}
              />
              <SelectField
                label="Rent due day"
                value={form.rent_due_day}
                onChange={setField('rent_due_day')}
                options={RENT_DUE_DAYS}
              />
            </div>

            <SelectField
              label="If a tenant moves in mid-month"
              value={form.move_in_billing}
              onChange={setField('move_in_billing')}
              options={MOVE_IN_BILLING}
            />

            <SelectField
              label="If a tenant moves out mid-month"
              value={form.move_out_billing}
              onChange={setField('move_out_billing')}
              options={MOVE_OUT_BILLING}
            />

            <p className="-mt-2 mb-[18px] text-[10px] leading-[1.5] text-[var(--ink-faint)]">
              These rules apply to move-ins and move-outs from now on. Rent
              that has already been billed is not changed.
            </p>

            <SectionTitle title="Electricity billing" />

            <SelectField
              label="Billing method"
              value={form.electricity_billing_method}
              onChange={setField('electricity_billing_method')}
              options={ELECTRICITY_BILLING}
            />

            {form.electricity_billing_method === 'fixed_monthly' ? (
              <div className="mb-[18px] max-w-[300px]">
                <label className="mb-2 block text-[11px] font-bold text-[var(--ink)]">Electricity (KES / month)</label>
                <input
                  type="number"
                  min="1"
                  step="any"
                  required
                  value={form.electricity_monthly_charge}
                  onChange={setField('electricity_monthly_charge')}
                  placeholder="e.g. 1000"
                  className="h-10 w-full rounded-[8px] border border-[var(--line)] bg-[var(--surface)] px-3 text-[12px] text-[var(--ink)] outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)]"
                />
              </div>
            ) : null}

            {electricityChanged ? (
              <label className="-mt-2 mb-[10px] flex items-start gap-2 text-[11px] leading-[1.5] text-[var(--ink-soft)]">
                <input
                  type="checkbox"
                  className="mt-[3px]"
                  checked={form.electricity_apply_occupied}
                  onChange={(event) => setForm((current) => ({ ...current, electricity_apply_occupied: event.target.checked }))}
                />
                Also change units that have a tenant. Left unticked, only vacant units change now.
              </label>
            ) : null}

            <p className="-mt-1 mb-[18px] text-[10px] leading-[1.5] text-[var(--ink-faint)]">
              Units that follow the property change with it; a unit billed
              differently keeps its own. Bills already made are not changed.
            </p>

            <div className="mb-[18px] max-w-[300px]">
              <SmsSenderField
                saved={property.sms_sender_id}
                status={property.sms_sender_status}
                value={form.sms_sender_id}
                onChange={(value) => setForm((current) => ({ ...current, sms_sender_id: value }))}
              />
            </div>

            <div className="mb-[24px]">
              <CaretakerField
                caretaker={caretaker}
                onChange={(patch) => setCaretaker((current) => ({ ...current, ...patch }))}
                existingCaretakers={existingCaretakers}
                loading={caretakers.loading}
                noneLabel={currentCaretaker ? 'None — remove caretaker' : 'None — assign later'}
                newCaretakerNote="The caretaker is created and assigned when you save."
              />

              {currentCaretaker && caretaker.mode === 'none' ? (
                <p className="mt-2 text-[11px] leading-[1.5] text-[var(--danger)]">
                  {currentCaretaker.full_name} will lose access to this
                  property as soon as you save.
                </p>
              ) : null}

              {currentCaretaker &&
              caretaker.mode !== 'none' &&
              caretaker.caretakerId !== String(currentCaretaker.caretaker_id) ? (
                <p className="mt-2 text-[11px] leading-[1.5] text-[var(--warning)]">
                  This replaces {currentCaretaker.full_name}, who will lose
                  access to this property as soon as you save.
                </p>
              ) : null}
            </div>

            <SectionTitle title="Payment accounts" />
            <p className="mb-3 text-[11px] leading-[1.5] text-[var(--ink-faint)]">
              To switch to a different M-Pesa account, or to update the
              credentials of the current one, connect it here. Earlier
              payments stay on record. Water and electricity are paid
              through the rent account unless they have their own.
            </p>

            {keeps('service') ? (
              <p className="mb-[18px] rounded-[8px] bg-[var(--line-soft)] px-3 py-[10px] text-[11px] leading-[1.5] text-[var(--ink-soft)]">
                Service charges and repairs are paid into the service charges
                account only. To have them paid into another account, remove it
                below.
              </p>
            ) : (
              <>
                <SelectField
                  label="Service charges and repairs are paid into"
                  value={serviceChargeAccount}
                  onChange={setField('service_charge_account')}
                  options={serviceChargeAccounts}
                />

                <p className="-mt-2 mb-[18px] text-[10px] leading-[1.5] text-[var(--ink-faint)]">
                  Money paid into this account settles that account&apos;s own
                  bills first, then service charges such as garbage or security.
                  To use a separate account just for them, add a service charges
                  account below.
                </p>
              </>
            )}

            {accountSlots.map(([accountFor, title]) =>
              changing[accountFor] ? (
                <PaymentAccountCard
                  key={accountFor}
                  title={property[`${accountFor}_account`] ? `New ${title.toLowerCase()}` : title}
                  accountFor={accountFor}
                  account={accounts[accountFor]}
                  onChange={(patch) => patchAccount(accountFor, patch)}
                  propertyName={form.name}
                  propertyId={property.id}
                  callbackNote="The new account replaces the current one, and payment callbacks are registered with Safaricom, when you save."
                  cancelLabel={property[`${accountFor}_account`] ? 'Keep current account' : 'Remove this account'}
                  onCancel={() => setChanging((current) => ({ ...current, [accountFor]: false }))}
                  onRemove={
                    accountFor !== 'rent' && !property[`${accountFor}_account`]
                      ? () => setChanging((current) => ({ ...current, [accountFor]: false }))
                      : undefined
                  }
                />
              ) : (
                <CurrentAccount
                  key={accountFor}
                  title={title}
                  account={property[`${accountFor}_account`]}
                  onChange={() => startChanging(accountFor)}
                  removable={accountFor !== 'rent'}
                  removing={Boolean(removing[accountFor])}
                  onToggleRemove={() =>
                    setRemoving((current) => ({ ...current, [accountFor]: !current[accountFor] }))
                  }
                />
              )
            )}

            {error ? (
              <div className="mt-[18px]">
                <FormError error={error} />
              </div>
            ) : null}
          </div>

          <div className="flex justify-end gap-[10px] border-t border-[var(--line)] px-[22px] py-[16px]">
            <button
              type="button"
              onClick={onClose}
              className="rounded-[8px] border border-[var(--line)] bg-[var(--surface)] px-5 py-[10px] text-[12px] font-bold text-[var(--ink)] transition hover:bg-[var(--line-soft)]"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              className="rounded-[8px] border border-[var(--accent)] bg-[var(--accent)] px-5 py-[10px] text-[12px] font-bold text-white transition hover:border-[var(--accent-hover)] hover:bg-[var(--accent-hover)] disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function SectionTitle({ title }) {
  return (
    <div className="mb-[14px] flex items-center gap-3">
      <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--accent-ink)]">
        {title}
      </div>
      <div className="h-px flex-1 bg-[var(--line)]" />
    </div>
  )
}

function CurrentAccount({ title, account, onChange, removable, removing, onToggleRemove }) {
  return (
    <div className="mb-[10px] flex items-center justify-between gap-4 rounded-[8px] border border-[var(--line)] bg-[var(--surface)] px-4 py-4">
      <div>
        <h4 className="text-[13px] font-bold">{title}</h4>
        <p className="mt-[4px] text-[10px] text-[var(--ink-faint)]">
          {account
            ? `${paymentAccountTypeLabel(account)} ${account.business_number} - ${humanize(account.environment)}`
            : title === 'Rent account'
              ? 'Not connected'
              : title === 'Service charges account'
                ? 'No separate account'
                : 'No separate account - paid through the rent account'}
        </p>

        {removing ? (
          <p className="mt-[4px] text-[10px] font-bold text-[var(--danger)]">
            Will be removed when you save. These payments will then go
            through the rent account.
          </p>
        ) : null}
      </div>

      <div className="flex shrink-0 gap-2">
        {account && removable ? (
          <button
            type="button"
            onClick={onToggleRemove}
            className="rounded-[8px] border border-[var(--danger)] bg-[var(--surface)] px-3 py-2 text-[11px] font-bold text-[var(--danger)] transition hover:bg-[var(--danger-soft)]"
          >
            {removing ? 'Undo' : 'Remove'}
          </button>
        ) : null}

        {removing ? null : (
          <button
            type="button"
            onClick={onChange}
            className="rounded-[8px] border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-[11px] font-bold transition hover:border-[var(--accent-soft-line)] hover:text-[var(--accent-ink)]"
          >
            {account ? 'Change account' : 'Add account'}
          </button>
        )}
      </div>
    </div>
  )
}

function Field({ label, ...inputProps }) {
  return (
    <div className="mb-[18px]">
      <label className="mb-2 block text-[11px] font-bold text-[var(--ink)]">
        {label}
      </label>
      <input
        type="text"
        {...inputProps}
        className="h-10 w-full rounded-[8px] border border-[var(--line)] bg-[var(--surface)] px-3 text-[12px] text-[var(--ink)] outline-none transition placeholder:text-[var(--ink-faint)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)]"
      />
    </div>
  )
}

function SelectField({ label, options, value, onChange }) {
  return (
    <div className="mb-[18px]">
      <label className="mb-2 block text-[11px] font-bold text-[var(--ink)]">
        {label}
      </label>
      <select
        value={value}
        onChange={onChange}
        className="h-10 w-full rounded-[8px] border border-[var(--line)] bg-[var(--surface)] px-3 text-[12px] text-[var(--ink)] outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)]"
      >
        {options.map(([optionValue, optionLabel]) => (
          <option key={optionValue} value={optionValue}>
            {optionLabel}
          </option>
        ))}
      </select>
    </div>
  )
}

export default EditPropertyModal
