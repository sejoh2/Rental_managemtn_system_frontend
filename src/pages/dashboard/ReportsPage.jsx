import { useState } from 'react'
import { Download, X } from 'lucide-react'
import { arrearsByProperty, smsUsage } from '../../data/reportsData'

function ReportsPage() {
  const [exportOpen, setExportOpen] = useState(false)

  return (
    <>
      <div className="mb-7 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-[10px] text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--accent)]">
            Operations
          </div>
          <h1 className="font-display text-[20px] font-semibold tracking-[-0.01em]">
            Reports
          </h1>
          <p className="mt-2 text-[12px] text-[var(--ink-soft)]">
            Collection, arrears, occupancy and water reports across properties.
          </p>
        </div>

        <button
          onClick={() => setExportOpen(true)}
          className="inline-flex items-center gap-2 rounded-[8px] border border-[var(--line)] bg-white px-4 py-[10px] text-[12px] font-bold"
        >
          <Download size={15} />
          Export PDF
        </button>
      </div>

      <div className="mb-0 grid gap-4 xl:grid-cols-3">
        <section className="overflow-hidden rounded-[10px] border border-[var(--line)] bg-white">
          <div className="border-b border-[var(--line)] px-[18px] py-4">
            <h3 className="text-[12px] font-bold">Occupancy</h3>
          </div>

          <div className="flex flex-col items-center justify-center px-[18px] py-8">
            <div className="relative flex h-[104px] w-[104px] items-center justify-center rounded-full border-[14px] border-[var(--accent)]">
              <span className="text-[20px] font-bold">96%</span>
            </div>
            <p className="mt-5 text-[11px] text-[var(--ink-faint)]">
              123 of 128 units occupied
            </p>
          </div>
        </section>

        <ReportList title="Arrears by property" rows={arrearsByProperty} danger />
        <ReportList title="SMS usage" rows={smsUsage} />
      </div>

      <section className="overflow-hidden rounded-[10px] border border-[var(--line)] bg-white">
        <div className="border-b border-[var(--line)] px-[18px] py-4">
          <h3 className="text-[12px] font-bold">Tenant statement generator</h3>
        </div>

        <div className="grid gap-3 px-[18px] py-5 lg:grid-cols-[1fr_130px_150px] lg:items-end">
          <div>
            <label className="mb-2 block text-[11px] font-bold">Tenant</label>
            <select className="w-full rounded-[8px] border border-[var(--line)] bg-white px-3 py-[11px] text-[12px]">
              <option>John Otieno - Green View H44</option>
            </select>
          </div>

          <div>
            <label className="mb-2 block text-[11px] font-bold">Period</label>
            <select className="w-full rounded-[8px] border border-[var(--line)] bg-white px-3 py-[11px] text-[12px]">
              <option>Last 6 months</option>
            </select>
          </div>

          <button
            onClick={() => window.alert('Tenant statement PDF generated successfully.')}
            className="inline-flex items-center justify-center gap-2 rounded-[8px] border border-[var(--accent)] bg-[var(--accent)] px-4 py-[11px] text-[12px] font-bold text-white"
          >
            <Download size={15} />
            Generate PDF
          </button>
        </div>
      </section>

      <ExportReportModal
        open={exportOpen}
        onClose={() => setExportOpen(false)}
      />
    </>
  )
}

function ExportReportModal({ open, onClose }) {
  if (!open) return null

  function handleSubmit(event) {
    event.preventDefault()
    window.alert('Report generated successfully.')
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
              Put together a summary of rent, water and occupancy for the period
              and properties you choose below.
            </p>

            <div className="mb-[18px]">
              <label className="mb-2 block text-[11px] font-bold text-[var(--ink)]">
                What to include
              </label>
              <select className="h-10 w-full rounded-[8px] border border-[var(--line)] bg-white px-3 text-[12px] text-[var(--ink)] outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)]">
                <option>Full monthly summary (rent + water + occupancy)</option>
                <option>Rent collection only</option>
                <option>Water billing only</option>
                <option>Occupancy and arrears only</option>
                <option>SMS usage only</option>
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
                  <option>This year</option>
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

            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-[8px] border border-[var(--accent)] bg-[var(--accent)] px-5 py-[10px] text-[12px] font-bold text-white"
            >
              <Download size={15} />
              Generate report
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function ReportList({ title, rows, danger }) {
  return (
    <section className="overflow-hidden rounded-[10px] border border-[var(--line)] bg-white">
      <div className="border-b border-[var(--line)] px-[18px] py-4">
        <h3 className="text-[12px] font-bold">{title}</h3>
      </div>

      <div className="px-[18px] py-5">
        {rows.map((row) => (
          <div key={row.label || row.property} className="flex items-center justify-between border-b border-[var(--line-soft)] py-[10px] text-[12px] last:border-b-0">
            <span className="text-[var(--ink-soft)]">{row.label || row.property}</span>
            <span className={`font-mono font-semibold ${danger ? 'text-[#B3261E]' : ''}`}>
              {row.value || row.amount}
            </span>
          </div>
        ))}
      </div>
    </section>
  )
}

export default ReportsPage