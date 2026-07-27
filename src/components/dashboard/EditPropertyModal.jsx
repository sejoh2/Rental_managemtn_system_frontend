import { useState } from 'react'
import { X } from 'lucide-react'

function EditPropertyModal({ open, property, onClose }) {
  const [rentAccountType, setRentAccountType] = useState('till')
  const [waterAccountType, setWaterAccountType] = useState('bank')

  if (!open || !property) return null

  function handleSubmit(event) {
    event.preventDefault()
    onClose()
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

            <Field label="Property name" defaultValue={property.name} />

            <div className="mb-[18px] grid gap-[14px] sm:grid-cols-2">
              <Field label="Location" defaultValue={property.location} />

              <SelectField
                label="Property type"
                defaultValue="Apartment block"
                options={['Apartment block', 'Bedsitters', 'Mixed use', 'Single rooms']}
              />

              <Field label="Number of units" defaultValue={property.units} />
              <Field label="Rent due day" defaultValue="5th of every month" />
            </div>

            <div className="mb-[18px] max-w-[300px]">
              <Field label="SMS sender ID" defaultValue="KODI-GVA" />
            </div>

            <div className="mb-[24px]">
              <SelectField
                label="Assigned caretaker"
                defaultValue="Peter Mwangi"
                options={['None - assign later', 'Peter Mwangi', 'Ruth Chebet', 'James Odhiambo']}
              />
            </div>

            <SectionTitle title="Payment accounts" />
            <p className="mb-3 text-[11px] leading-[1.5] text-[var(--ink-faint)]">
              Choose how rent and water payments reach you for this property -
              each account type asks for the right details.
            </p>

            <div className="grid gap-[14px]">
              <SelectField
                label="Rent account type"
                value={rentAccountType}
                onChange={(event) => setRentAccountType(event.target.value)}
                options={[
                  ['paybill', 'M-Pesa Paybill'],
                  ['till', 'M-Pesa Till number'],
                  ['bank', 'Bank account'],
                ]}
              />

              {rentAccountType === 'paybill' && (
                <div className="grid gap-[14px] sm:grid-cols-2">
                  <Field label="Business number" defaultValue="400200" />
                  <Field label="Account number" defaultValue="GREENVIEW" />
                </div>
              )}

              {rentAccountType === 'till' && (
                <Field label="Till number" placeholder="e.g. 552233" />
              )}

              {rentAccountType === 'bank' && (
                <div className="grid gap-[14px] sm:grid-cols-2">
                  <Field label="Bank name" defaultValue="Equity Bank" />
                  <Field label="Account number" defaultValue="1102334471" />
                </div>
              )}

              <SelectField
                label="Water account type"
                value={waterAccountType}
                onChange={(event) => setWaterAccountType(event.target.value)}
                options={[
                  ['paybill', 'M-Pesa Paybill'],
                  ['till', 'M-Pesa Till number'],
                  ['bank', 'Bank account'],
                ]}
              />

              {waterAccountType === 'paybill' && (
                <div className="grid gap-[14px] sm:grid-cols-2">
                  <Field label="Business number" defaultValue="400200" />
                  <Field label="Account number" defaultValue="GREENVIEW" />
                </div>
              )}

              {waterAccountType === 'till' && (
                <Field label="Till number" placeholder="e.g. 552233" />
              )}

              {waterAccountType === 'bank' && (
                <div className="grid gap-[14px] sm:grid-cols-2">
                  <Field label="Bank name" defaultValue="Equity Bank" />
                  <Field label="Account number" defaultValue="0140294471" />
                </div>
              )}
            </div>
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
              className="rounded-[8px] border border-[var(--accent)] bg-[var(--accent)] px-5 py-[10px] text-[12px] font-bold text-white transition hover:border-[var(--accent-hover)] hover:bg-[var(--accent-hover)]"
            >
              Save changes
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

function Field({ label, placeholder, defaultValue }) {
  return (
    <div className="mb-[18px]">
      <label className="mb-2 block text-[11px] font-bold text-[var(--ink)]">
        {label}
      </label>
      <input
        type="text"
        placeholder={placeholder}
        defaultValue={defaultValue}
        className="h-10 w-full rounded-[8px] border border-[var(--line)] bg-white px-3 text-[12px] text-[var(--ink)] outline-none transition placeholder:text-[var(--ink-faint)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)]"
      />
    </div>
  )
}

function SelectField({ label, options, defaultValue, value, onChange }) {
  return (
    <div className="mb-[18px]">
      <label className="mb-2 block text-[11px] font-bold text-[var(--ink)]">
        {label}
      </label>
      <select
        value={value}
        onChange={onChange}
        defaultValue={defaultValue}
        className="h-10 w-full rounded-[8px] border border-[var(--line)] bg-white px-3 text-[12px] text-[var(--ink)] outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)]"
      >
        {options.map((option) => {
          const optionValue = Array.isArray(option) ? option[0] : option
          const optionLabel = Array.isArray(option) ? option[1] : option

          return (
            <option key={optionValue} value={optionValue}>
              {optionLabel}
            </option>
          )
        })}
      </select>
    </div>
  )
}

export default EditPropertyModal