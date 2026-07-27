import { useMemo, useState } from 'react'
import { maintenanceItems, maintenanceTabs } from '../../data/maintenanceData'

function MaintenancePage() {
  const [activeTab, setActiveTab] = useState('All')

  const filteredItems = useMemo(() => {
    if (activeTab === 'All') return maintenanceItems

    return maintenanceItems.filter((item) => item.status === activeTab)
  }, [activeTab])

  return (
    <>
      <div className="mb-7">
        <div className="mb-[10px] text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--accent)]">
          Operations
        </div>
        <h1 className="font-display text-[20px] font-semibold tracking-[-0.01em]">
          Maintenance
        </h1>
        <p className="mt-2 text-[12px] text-[var(--ink-soft)]">
          Reports from caretakers and tenants, tracked to resolution.
        </p>
      </div>

      <div className="mb-[18px] flex flex-wrap gap-7 border-b border-[var(--line)]">
        {maintenanceTabs.map((tab) => (
          <button
            key={tab.label}
            onClick={() => setActiveTab(tab.label)}
            className={`pb-[12px] text-[11px] font-bold transition ${
              activeTab === tab.label
                ? 'border-b-2 border-[var(--accent)] text-[var(--accent)]'
                : 'text-[var(--ink-faint)] hover:text-[var(--accent)]'
            }`}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      <div className="grid gap-[14px] xl:grid-cols-2">
        {filteredItems.map((item) => (
          <article
            key={item.title}
            className="rounded-[8px] border border-[var(--line)] border-l-2 border-l-[var(--accent-soft-line)] bg-white px-5 py-4 transition hover:-translate-y-[1px] hover:shadow-[0_10px_24px_rgba(32,28,24,0.06)]"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-[14px] font-bold text-[var(--ink)]">
                  {item.title}
                </h3>
                <p className="mt-[5px] text-[11px] text-[var(--ink-faint)]">
                  {item.subtitle}
                </p>
              </div>
              <StatusBadge tone={item.tone}>{item.status}</StatusBadge>
            </div>
          </article>
        ))}
      </div>
    </>
  )
}

function StatusBadge({ tone, children }) {
  const tones = {
    success: 'bg-[#E3F1E8] text-[#2E7D4F]',
    warning: 'bg-[#FBF0DA] text-[#B8790E]',
    danger: 'bg-[#FBE4E2] text-[#B3261E]',
  }

  return (
    <span className={`inline-flex shrink-0 items-center gap-[6px] rounded-full px-[9px] py-[3px] text-[9px] font-bold ${tones[tone]}`}>
      <span className="h-[6px] w-[6px] rounded-full bg-current" />
      {children}
    </span>
  )
}

export default MaintenancePage