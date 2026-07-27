import { X } from 'lucide-react'

function AddUnitModal({ open, onClose }) {
  if (!open) return null

  function handleSubmit(event) {
    event.preventDefault()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/45 px-4 py-8">
      <div className="w-full max-w-[640px] overflow-hidden rounded-[14px] bg-white shadow-[0_24px_80px_rgba(0,0,0,0.28)]">
        <div className="flex items-center justify-between border-b border-[var(--line)] px-[22px] py-[18px]">
          <h2 className="font-display text-[15px] font-semibold text-[var(--ink)]">
            Add unit / house
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
            <Field label="House number" placeholder="e.g. H15" />
            <Field label="Floor" placeholder="e.g. 2" />

            <div>
              <label className="mb-2 block text-[11px] font-bold text-[var(--ink)]">
                Unit type
              </label>
              <select className="h-10 w-full rounded-[8px] border border-[var(--line)] bg-white px-3 text-[12px] text-[var(--ink)] outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)]">
                <option>Single room</option>
                <option>Bedsitter</option>
                <option>One bedroom</option>
                <option>Two bedroom</option>
              </select>
            </div>

            <Field label="Monthly rent (KES)" placeholder="e.g. 15000" />
            <Field label="Deposit (KES)" placeholder="e.g. 15000" />
            <Field label="Water meter number" placeholder="Optional" />
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
              Add unit
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function Field({ label, placeholder }) {
  return (
    <div>
      <label className="mb-2 block text-[11px] font-bold text-[var(--ink)]">
        {label}
      </label>
      <input
        placeholder={placeholder}
        className="h-10 w-full rounded-[8px] border border-[var(--line)] bg-white px-3 text-[12px] text-[var(--ink)] outline-none placeholder:text-[var(--ink-faint)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)]"
      />
    </div>
  )
}

export default AddUnitModal