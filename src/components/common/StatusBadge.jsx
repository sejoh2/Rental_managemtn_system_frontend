const tones = {
  success: 'bg-[#E3F1E8] text-[#2E7D4F]',
  danger: 'bg-[#FBE4E2] text-[#B3261E]',
  info: 'bg-[#E6EDF4] text-[#3C5C82]',
  warning: 'bg-[#FBF0DA] text-[#B8790E]',
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
