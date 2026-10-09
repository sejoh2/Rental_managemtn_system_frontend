import { useState } from 'react'
import { X } from 'lucide-react'
import { assignCaretaker, listCaretakers, updatePropertyCaretaker } from '../../api/caretakers'
import { replacePaymentAccount, updateProperty } from '../../api/properties'
import { useApi } from '../../hooks/useApi'
import { humanize } from '../../utils/format'
import { PROPERTY_TYPES, paymentAccountTypeLabel } from '../../utils/labels'
import {
  caretakerDetails,
  emptyAccount,
  emptyCaretaker,
  uniqueCaretakers,
} from '../../utils/propertyForm'
import { FormError } from '../common/DataState'
import CaretakerField from './CaretakerField'
import PaymentAccountCard from './PaymentAccountCard'

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
    rent_due_day: property.rent_due_day,
    sms_sender_id: property.sms_sender_id || '',
  })
  const [caretaker, setCaretaker] = useState(
    currentCaretaker
      ? {
          ...emptyCaretaker,
          mode: 'existing',
          caretakerId: String(currentCaretaker.caretaker_id),
          permission_level: currentCaretaker.permission_level,
        }
      : emptyCaretaker
  )
  // A new account form is shown only for the accounts the owner chose to change.
  const [changing, setChanging] = useState({ rent: false, water: false })
  const [accounts, setAccounts] = useState({ rent: emptyAccount, water: emptyAccount })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  const existingCaretakers = uniqueCaretakers(caretakers.data)

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
      if (caretaker.permission_level !== currentCaretaker.permission_level) {
        await updatePropertyCaretaker(property.id, {
          permission_level: caretaker.permission_level,
        })
      }

      return
    }

    const details = caretakerDetails(caretaker, existingCaretakers)

    if (details) await assignCaretaker(property.id, details)
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError(null)

    const accountsToChange = ['rent', 'water'].filter((accountFor) => changing[accountFor])
    const notConnected = accountsToChange.find(
      (accountFor) => accounts[accountFor].status !== 'connected'
    )

    if (notConnected) {
      setError({
        message: `Connect the new ${notConnected} account first, or click "Keep current account".`,
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
        rent_due_day: form.rent_due_day,
        sms_sender_id: form.sms_sender_id.trim() || null,
      })
      saved.push('property details')

      for (const accountFor of accountsToChange) {
        await replacePaymentAccount(property.id, accountFor, accounts[accountFor].connectionId)
        saved.push(`${accountFor} account`)
        setChanging((current) => ({ ...current, [accountFor]: false }))
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
      <div className="flex max-h-[90vh] w-full max-w-[640px] flex-col overflow-hidden rounded-[14px] bg-white shadow-[0_24px_80px_rgba(0,0,0,0.28)]">
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
              <Field
                label="Rent due day"
                value={form.rent_due_day}
                onChange={setField('rent_due_day')}
                required
              />
            </div>

            <div className="mb-[18px] max-w-[300px]">
              <Field
                label="SMS sender ID"
                value={form.sms_sender_id}
                onChange={setField('sms_sender_id')}
                placeholder="e.g. KODI-GVA"
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
                <p className="mt-2 text-[11px] leading-[1.5] text-[#B3261E]">
                  {currentCaretaker.full_name} will lose access to this
                  property as soon as you save.
                </p>
              ) : null}

              {currentCaretaker &&
              caretaker.mode !== 'none' &&
              caretaker.caretakerId !== String(currentCaretaker.caretaker_id) ? (
                <p className="mt-2 text-[11px] leading-[1.5] text-[#B8790E]">
                  This replaces {currentCaretaker.full_name}, who will lose
                  access to this property as soon as you save.
                </p>
              ) : null}
            </div>

            <SectionTitle title="Payment accounts" />
            <p className="mb-3 text-[11px] leading-[1.5] text-[var(--ink-faint)]">
              To switch to a different M-Pesa account, or to update the
              credentials of the current one, connect it here. Earlier
              payments stay on record.
            </p>

            {[
              ['rent', 'Rent account'],
              ['water', 'Water account'],
            ].map(([accountFor, title]) =>
              changing[accountFor] ? (
                <PaymentAccountCard
                  key={accountFor}
                  title={`New ${title.toLowerCase()}`}
                  accountFor={accountFor}
                  account={accounts[accountFor]}
                  onChange={(patch) => patchAccount(accountFor, patch)}
                  propertyName={form.name}
                  propertyId={property.id}
                  callbackNote="The new account replaces the current one, and payment callbacks are registered with Safaricom, when you save."
                  onCancel={() => setChanging((current) => ({ ...current, [accountFor]: false }))}
                />
              ) : (
                <CurrentAccount
                  key={accountFor}
                  title={title}
                  account={property[`${accountFor}_account`]}
                  onChange={() => startChanging(accountFor)}
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
              className="rounded-[8px] border border-[var(--line)] bg-white px-5 py-[10px] text-[12px] font-bold text-[var(--ink)] transition hover:bg-[var(--line-soft)]"
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
      <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--accent)]">
        {title}
      </div>
      <div className="h-px flex-1 bg-[var(--line)]" />
    </div>
  )
}

function CurrentAccount({ title, account, onChange }) {
  return (
    <div className="mb-[10px] flex items-center justify-between gap-4 rounded-[8px] border border-[var(--line)] border-l-2 border-l-[var(--accent-soft-line)] bg-white px-4 py-4">
      <div>
        <h4 className="text-[13px] font-bold">{title}</h4>
        <p className="mt-[4px] text-[10px] text-[var(--ink-faint)]">
          {account
            ? `${paymentAccountTypeLabel(account)} ${account.business_number} - ${humanize(account.environment)}`
            : 'Not connected'}
        </p>
      </div>

      <button
        type="button"
        onClick={onChange}
        className="shrink-0 rounded-[8px] border border-[var(--line)] bg-white px-3 py-2 text-[11px] font-bold transition hover:border-[var(--accent-soft-line)] hover:text-[var(--accent)]"
      >
        {account ? 'Change account' : 'Connect account'}
      </button>
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
        className="h-10 w-full rounded-[8px] border border-[var(--line)] bg-white px-3 text-[12px] text-[var(--ink)] outline-none transition placeholder:text-[var(--ink-faint)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)]"
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
        className="h-10 w-full rounded-[8px] border border-[var(--line)] bg-white px-3 text-[12px] text-[var(--ink)] outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)]"
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
