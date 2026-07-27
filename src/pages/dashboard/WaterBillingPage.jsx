import { useState } from 'react'
import { Camera, Settings, X } from 'lucide-react'
import StatCard from '../../components/dashboard/StatCard'
import { waterBillingStats, waterReadings } from '../../data/waterBillingData'

function WaterBillingPage() {
  const [rulesOpen, setRulesOpen] = useState(false)

  return (
    <>
      <div className="mb-7 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-[10px] text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--accent)]">
            Money
          </div>
          <h1 className="font-display text-[20px] font-semibold tracking-[-0.01em]">
            Water billing
          </h1>
          <p className="mt-2 text-[12px] text-[var(--ink-soft)]">
            Readings submitted by caretakers, billed separately from rent.
          </p>
        </div>

        <button
          onClick={() => setRulesOpen(true)}
          className="inline-flex items-center gap-2 rounded-[8px] border border-[var(--line)] bg-white px-4 py-[10px] text-[12px] font-bold"
        >
          <Settings size={15} />
          Billing rules
        </button>
      </div>

      <div className="mb-6 grid gap-[14px] sm:grid-cols-2 xl:grid-cols-4">
        {waterBillingStats.map((item) => (
          <StatCard key={item.label} {...item} />
        ))}
      </div>

      <section className="overflow-hidden rounded-[10px] border border-[var(--line)] bg-white">
        <div className="border-b border-[var(--line)] px-[18px] py-4">
          <h3 className="text-[12px] font-bold">Latest readings</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-[980px] w-full border-collapse">
            <thead>
              <tr className="bg-[var(--bg)] text-left text-[9px] uppercase tracking-[0.05em] text-[var(--ink-faint)]">
                <th className="px-[18px] py-[10px] font-bold">Tenant / Unit</th>
                <th className="px-[18px] py-[10px] font-bold">Previous</th>
                <th className="px-[18px] py-[10px] font-bold">Current</th>
                <th className="px-[18px] py-[10px] font-bold">Units used</th>
                <th className="px-[18px] py-[10px] font-bold">Bill</th>
                <th className="px-[18px] py-[10px] font-bold">Photo</th>
                <th className="px-[18px] py-[10px] font-bold">Status</th>
              </tr>
            </thead>
            <tbody>
              {waterReadings.map((item) => (
                <tr key={item.tenant} className="border-b border-[var(--line-soft)] last:border-b-0">
                  <td className="px-[18px] py-[36px] text-[12px] font-bold">{item.tenant}</td>
                  <td className="font-mono px-[18px] py-[36px] text-[12px]">{item.previous}</td>
                  <td className="font-mono px-[18px] py-[36px] text-[12px]">{item.current}</td>
                  <td className="font-mono px-[18px] py-[36px] text-[12px]">{item.units}</td>
                  <td className="font-mono px-[18px] py-[36px] text-[12px]">{item.bill}</td>
                  <td className="px-[18px] py-[36px] text-[var(--ink-faint)]">
                    <Camera size={19} />
                  </td>
                  <td className="px-[18px] py-[36px]">
                    <StatusBadge tone={item.tone}>{item.status}</StatusBadge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <WaterRulesModal
        open={rulesOpen}
        onClose={() => setRulesOpen(false)}
      />
    </>
  )
}

function WaterRulesModal({ open, onClose }) {
  if (!open) return null

  function saveRules(event) {
    event.preventDefault()
    window.alert('Water billing rules saved successfully.')
    onClose()
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/45 px-4 py-8">
      <div className="w-full max-w-[640px] overflow-hidden rounded-[14px] bg-white shadow-[0_24px_80px_rgba(0,0,0,0.28)]">
        <div className="flex items-center justify-between border-b border-[var(--line)] px-[22px] py-[18px]">
          <h2 className="font-display text-[15px] font-semibold text-[var(--ink)]">
            Water billing rules
          </h2>

          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--line-soft)] text-[var(--ink-soft)] transition hover:bg-[var(--line)] hover:text-[var(--ink)]"
          >
            <X size={15} />
          </button>
        </div>

        <form onSubmit={saveRules}>
          <div className="px-[22px] py-[22px]">
            <p className="mb-[18px] text-[11px] leading-[1.5] text-[var(--ink-faint)]">
              Set how water is billed for each property. Once a caretaker submits
              a meter reading, Kodi uses these rules to calculate the bill automatically.
            </p>

            <div className="mb-[18px]">
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

            <div className="mb-[18px]">
              <label className="mb-2 block text-[11px] font-bold text-[var(--ink)]">
                Billing method
              </label>
              <select className="h-10 w-full rounded-[8px] border border-[var(--line)] bg-white px-3 text-[12px] text-[var(--ink)] outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)]">
                <option>Per-unit metered - bill by consumption</option>
                <option>Flat monthly water charge</option>
                <option>Included in rent</option>
              </select>
            </div>

            <div className="mb-[18px] grid gap-[14px] sm:grid-cols-2">
              <Field label="Rate per unit (KES)" placeholder="e.g. 100" />

              <div>
                <label className="mb-2 block text-[11px] font-bold text-[var(--ink)]">
                  Billing day
                </label>
                <select className="h-10 w-full rounded-[8px] border border-[var(--line)] bg-white px-3 text-[12px] text-[var(--ink)] outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)]">
                  <option>Same day as rent is billed</option>
                  <option>1st of every month</option>
                  <option>5th of every month</option>
                  <option>Last day of every month</option>
                </select>
              </div>
            </div>

            <div className="mb-[18px] max-w-[292px]">
              <label className="mb-2 block text-[11px] font-bold text-[var(--ink)]">
                Reading due from caretaker
              </label>
              <select className="h-10 w-full rounded-[8px] border border-[var(--line)] bg-white px-3 text-[12px] text-[var(--ink)] outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)]">
                <option>Within 3 days of billing day</option>
                <option>Within 5 days of billing day</option>
                <option>Within 7 days of billing day</option>
              </select>
            </div>

            <div className="mb-[18px]">
              <label className="mb-2 block text-[11px] font-bold text-[var(--ink)]">
                If a reading is missed
              </label>
              <select className="h-10 w-full rounded-[8px] border border-[var(--line)] bg-white px-3 text-[12px] text-[var(--ink)] outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)]">
                <option>Carry forward previous month's units and flag for review</option>
                <option>Do not bill water until reading is submitted</option>
                <option>Apply estimated average and flag for review</option>
              </select>
            </div>

            <div className="rounded-[8px] border border-[var(--line)] border-l-2 border-l-[var(--accent-soft-line)] bg-white px-4 py-4">
              <h3 className="text-[14px] font-bold text-[var(--ink)]">
                Flag suspicious readings
              </h3>
              <p className="mt-1 text-[11px] leading-[1.5] text-[var(--ink-faint)]">
                Kodi already flags any reading lower than the previous one so you
                can catch entry errors before a tenant is billed.
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

            <button
              type="submit"
              className="rounded-[8px] border border-[var(--accent)] bg-[var(--accent)] px-5 py-[10px] text-[12px] font-bold text-white"
            >
              Save rules
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

function StatusBadge({ tone, children }) {
  const tones = {
    success: 'bg-[#E3F1E8] text-[#2E7D4F]',
    warning: 'bg-[#FBF0DA] text-[#B8790E]',
    danger: 'bg-[#FBE4E2] text-[#B3261E]',
  }

  return (
    <span className={`inline-flex items-center gap-[6px] rounded-full px-[9px] py-[3px] text-[9px] font-bold ${tones[tone]}`}>
      <span className="h-[6px] w-[6px] rounded-full bg-current" />
      {children}
    </span>
  )
}

export default WaterBillingPage