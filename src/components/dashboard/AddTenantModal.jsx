import { X } from 'lucide-react'

function AddTenantModal({ open, onClose }) {
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
            Add tenant
          </h2>

          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--line-soft)] text-[var(--ink-soft)] transition hover:bg-[var(--line)] hover:text-[var(--ink)]"
            aria-label="Close add tenant modal"
          >
            <X size={15} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="px-[22px] py-[22px]">
            <div className="mb-[18px]">
              <Field label="Full name" placeholder="e.g. John Otieno" />
            </div>

            <div className="mb-[18px] grid gap-[14px] sm:grid-cols-2">
              <Field label="Phone number" placeholder="e.g. 0722 000 019" />
              <Field label="ID number" placeholder="Optional" />

              <div>
                <label className="mb-2 block text-[11px] font-bold text-[var(--ink)]">
                  Property
                </label>
                <select className="h-10 w-full rounded-[8px] border border-[var(--line)] bg-white px-3 text-[12px] text-[var(--ink)] outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)]">
                  <option>Green View Apartments</option>
                  <option>Sunrise Bedsitters</option>
                  <option>Riverside Court</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-[11px] font-bold text-[var(--ink)]">
                  House / unit
                </label>
                <select className="h-10 w-full rounded-[8px] border border-[var(--line)] bg-white px-3 text-[12px] text-[var(--ink)] outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)]">
                  <option>H44 - vacant</option>
                  <option>H04 - vacant</option>
                  <option>B3 - vacant</option>
                </select>
              </div>

              <Field label="Move-in date" placeholder="e.g. 15 Jul 2026" />
              <Field label="Monthly rent (KES)" placeholder="e.g. 10000" />
              <Field label="Deposit (KES)" placeholder="e.g. 10000" />
            </div>

            <p className="text-[11px] text-[var(--ink-faint)]">
              A tenancy agreement will be auto-generated from your default
              template.
            </p>
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
              Add tenant
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
        type="text"
        placeholder={placeholder}
        className="h-10 w-full rounded-[8px] border border-[var(--line)] bg-white px-3 text-[12px] text-[var(--ink)] outline-none transition placeholder:text-[var(--ink-faint)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)]"
      />
    </div>
  )
}

export default AddTenantModal