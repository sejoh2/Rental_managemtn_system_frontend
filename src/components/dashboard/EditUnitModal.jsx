import { X } from 'lucide-react'

function EditUnitModal({ open, unit, onClose }) {
  if (!open || !unit) return null

  function handleSubmit(event) {
    event.preventDefault()
    onClose()
  }

  const rentValue = unit.rent.replace('KES ', '').replace(',', '')
  const floorValue = unit.floor.replace('Floor ', '')

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/45 px-4 py-8">
      <div className="w-full max-w-[640px] overflow-hidden rounded-[14px] bg-white shadow-[0_24px_80px_rgba(0,0,0,0.28)]">
        <div className="flex items-center justify-between border-b border-[var(--line)] px-[22px] py-[18px]">
          <h2 className="font-display text-[15px] font-semibold text-[var(--ink)]">
            Edit unit - {unit.number}
          </h2>

          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--line-soft)] text-[var(--ink-soft)] transition hover:bg-[var(--line)] hover:text-[var(--ink)]"
          >
            <X size={15} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-[18px] px-[22px] py-[22px] sm:grid-cols-2">
            <Field label="House number" defaultValue={unit.number} />
            <Field label="Floor" defaultValue={floorValue} />

            <div>
              <label className="mb-2 block text-[11px] font-bold text-[var(--ink)]">
                Unit type
              </label>
              <select
                defaultValue={unit.type}
                className="h-10 w-full rounded-[8px] border border-[var(--line)] bg-white px-3 text-[12px] text-[var(--ink)] outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)]"
              >
                <option>Single room</option>
                <option>Bedsitter</option>
                <option>One bedroom</option>
                <option>Two bedroom</option>
              </select>
            </div>

            <Field label="Monthly rent (KES)" defaultValue={rentValue} />
            <Field label="Deposit (KES)" defaultValue={rentValue} />
            <Field label="Water meter number" placeholder="Optional" />

            <div className="sm:col-span-2">
              <label className="mb-2 block text-[11px] font-bold text-[var(--ink)]">
                Status
              </label>
              <select
                defaultValue={unit.status}
                className="h-10 w-full rounded-[8px] border border-[var(--line)] bg-white px-3 text-[12px] text-[var(--ink)] outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)]"
              >
                <option value="occupied">Occupied</option>
                <option value="vacant">Vacant</option>
                <option value="maintenance">Under maintenance</option>
                <option value="arrears">In arrears</option>
              </select>

              <p className="mt-2 text-[10px] text-[var(--ink-faint)]">
                A unit becomes "Occupied" automatically once a tenant is added to it.
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-[10px] border-t border-[var(--line)] px-[22px] py-[16px]">
            <button
              type="button"
              onClick={onClose}
              className="rounded-[8px] border border-[var(--line)] bg-white px-5 py-[10px] text-[12px] font-bold text-[var(--ink)]"
            >
              Cancel
            </button>

            <button className="rounded-[8px] border border-[var(--accent)] bg-[var(--accent)] px-5 py-[10px] text-[12px] font-bold text-white">
              Save changes
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function Field({ label, placeholder, defaultValue }) {
  return (
    <div>
      <label className="mb-2 block text-[11px] font-bold text-[var(--ink)]">
        {label}
      </label>
      <input
        placeholder={placeholder}
        defaultValue={defaultValue}
        className="h-10 w-full rounded-[8px] border border-[var(--line)] bg-white px-3 text-[12px] text-[var(--ink)] outline-none placeholder:text-[var(--ink-faint)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)]"
      />
    </div>
  )
}

export default EditUnitModal