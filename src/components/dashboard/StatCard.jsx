function StatCard({ label, value, note, tone }) {
  const noteColor = {
    success: 'text-[var(--success)]',
    danger: 'text-[var(--danger)]',
    muted: 'text-[var(--ink-faint)]',
  }[tone || 'muted']

  return (
    <article className="relative overflow-hidden rounded-[10px] border border-[var(--line)] bg-[var(--surface)] px-[18px] py-4">
      <div className="text-[10px] font-bold uppercase tracking-[0.04em] text-[var(--ink-soft)]">
        {label}
      </div>

      <div className="font-mono mt-3 text-[18px] font-semibold tracking-[-0.02em] text-[var(--ink)]">
        {value}
      </div>

      <div className={`mt-[6px] text-[11px] ${noteColor}`}>
        {note}
      </div>
    </article>
  )
}

export default StatCard