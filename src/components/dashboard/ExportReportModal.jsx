import { Download, X } from 'lucide-react'

function ExportReportModal({ open, onClose }) {
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
            Export report
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
          <div className="px-[22px] py-[22px]">
            <p className="mb-[18px] text-[11px] leading-[1.5] text-[var(--ink-faint)]">
              Put together a summary of rent, water and occupancy for the
              period and properties you choose below.
            </p>

            <div className="mb-[18px]">
              <label className="mb-2 block text-[11px] font-bold text-[var(--ink)]">
                What to include
              </label>
              <select className="h-10 w-full rounded-[8px] border border-[var(--line)] bg-white px-3 text-[12px] text-[var(--ink)] outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)]">
                <option>Full monthly summary (rent + water + occupancy)</option>
                <option>Rent collection only</option>
                <option>Water billing only</option>
                <option>Occupancy report only</option>
              </select>
            </div>

            <div className="mb-[22px] grid gap-[14px] sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-[11px] font-bold text-[var(--ink)]">
                  Property
                </label>
                <select className="h-10 w-full rounded-[8px] border border-[var(--line)] bg-white px-3 text-[12px] text-[var(--ink)] outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)]">
                  <option>All 3 properties</option>
                  <option>Green View Apartments</option>
                  <option>Sunrise Bedsitters</option>
                  <option>Riverside Court</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-[11px] font-bold text-[var(--ink)]">
                  Period
                </label>
                <select className="h-10 w-full rounded-[8px] border border-[var(--line)] bg-white px-3 text-[12px] text-[var(--ink)] outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)]">
                  <option>This month - July 2026</option>
                  <option>Last month - June 2026</option>
                  <option>Last 3 months</option>
                  <option>Last 6 months</option>
                </select>
              </div>
            </div>

            <div>
              <label className="mb-3 block text-[11px] font-bold text-[var(--ink)]">
                Format
              </label>

              <div className="flex flex-wrap gap-5 text-[12px] text-[var(--ink)]">
                <label className="inline-flex items-center gap-2">
                  <input type="radio" name="format" defaultChecked />
                  PDF
                </label>

                <label className="inline-flex items-center gap-2">
                  <input type="radio" name="format" />
                  Excel (CSV)
                </label>
              </div>
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

            <button className="inline-flex items-center gap-2 rounded-[8px] border border-[var(--accent)] bg-[var(--accent)] px-5 py-[10px] text-[12px] font-bold text-white">
              <Download size={15} />
              Generate report
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ExportReportModal