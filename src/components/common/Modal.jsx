import { X } from 'lucide-react'

export function ModalShell({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/45 px-4 py-8">
      <div className="flex max-h-[90vh] w-full max-w-[640px] flex-col overflow-hidden rounded-[14px] bg-white shadow-[0_24px_80px_rgba(0,0,0,0.28)]">
        <div className="flex items-center justify-between border-b border-[var(--line)] px-[22px] py-[18px]">
          <h2 className="font-display text-[15px] font-semibold text-[var(--ink)]">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--line-soft)] text-[var(--ink-soft)] transition hover:bg-[var(--line)] hover:text-[var(--ink)]"
          >
            <X size={15} />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

export function ModalBody({ children }) {
  return <div className="flex-1 overflow-y-auto px-[22px] py-[22px]">{children}</div>
}

export function ModalFooter({ children }) {
  return (
    <div className="flex justify-end gap-[10px] border-t border-[var(--line)] px-[22px] py-[16px]">
      {children}
    </div>
  )
}

export const secondaryButtonClass =
  'rounded-[8px] border border-[var(--line)] bg-white px-5 py-[10px] text-[12px] font-bold text-[var(--ink)] transition hover:bg-[var(--line-soft)]'

export const primaryButtonClass =
  'rounded-[8px] border border-[var(--accent)] bg-[var(--accent)] px-5 py-[10px] text-[12px] font-bold text-white transition hover:border-[var(--accent-hover)] hover:bg-[var(--accent-hover)] disabled:opacity-50'

export const inputClass =
  'h-10 w-full rounded-[8px] border border-[var(--line)] bg-white px-3 text-[12px] text-[var(--ink)] outline-none placeholder:text-[var(--ink-faint)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)] disabled:bg-[var(--line-soft)] disabled:text-[var(--ink-faint)]'

export const labelClass = 'mb-2 block text-[11px] font-bold text-[var(--ink)]'

export function Field({ label, hint, ...inputProps }) {
  return (
    <div>
      <label className={labelClass}>{label}</label>
      <input type="text" {...inputProps} className={inputClass} />
      {hint ? <p className="mt-2 text-[10px] text-[var(--ink-faint)]">{hint}</p> : null}
    </div>
  )
}

// options: [value, label] pairs.
export function SelectField({ label, options, ...selectProps }) {
  return (
    <div>
      <label className={labelClass}>{label}</label>
      <select {...selectProps} className={inputClass}>
        {options.map(([value, optionLabel]) => (
          <option key={value} value={value}>
            {optionLabel}
          </option>
        ))}
      </select>
    </div>
  )
}
