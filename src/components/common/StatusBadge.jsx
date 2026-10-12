const tones = {
  success: 'bg-[var(--success-soft)] text-[var(--success)]',
  danger: 'bg-[var(--danger-soft)] text-[var(--danger)]',
  info: 'bg-[var(--info-soft)] text-[var(--info)]',
  warning: 'bg-[var(--warning-soft)] text-[var(--warning)]',
  neutral: 'bg-[var(--line-soft)] text-[var(--ink-soft)]',
}

function StatusBadge({ tone = 'neutral', children }) {
  return (
    <span className={`inline-flex shrink-0 items-center gap-[6px] rounded-full px-[9px] py-[3px] text-[9px] font-bold ${tones[tone]}`}>
      <span className="h-[6px] w-[6px] rounded-full bg-current" />
      {children}
    </span>
  )
}

export default StatusBadge
