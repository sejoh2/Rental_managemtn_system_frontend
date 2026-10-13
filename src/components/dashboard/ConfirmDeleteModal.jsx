import { useState } from 'react'
import { X } from 'lucide-react'
import { FormError } from '../common/DataState'

function ConfirmDeleteModal({ open, ...props }) {
  if (!open) return null

  return <ConfirmDeleteDialog {...props} />
}

// onConfirm may be async; the dialog stays open and shows the error if it fails.
function ConfirmDeleteDialog({ title, message, confirmLabel, onClose, onConfirm }) {
  const [working, setWorking] = useState(false)
  const [error, setError] = useState(null)

  async function handleConfirm() {
    setWorking(true)
    setError(null)

    try {
      await onConfirm()
      onClose()
    } catch (confirmError) {
      setError(confirmError)
      setWorking(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/45 px-4 py-8">
      <div className="w-full max-w-[460px] overflow-hidden rounded-[14px] bg-[var(--surface)] shadow-[0_24px_80px_rgba(0,0,0,0.28)]">
        <div className="flex items-center justify-between border-b border-[var(--line)] px-[22px] py-[18px]">
          <h2 className="font-display text-[15px] font-semibold text-[var(--ink)]">
            {title}
          </h2>

          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--line-soft)] text-[var(--ink-soft)] transition hover:bg-[var(--line)] hover:text-[var(--ink)]"
          >
            <X size={15} />
          </button>
        </div>

        <div className="px-[22px] py-[22px]">
          <div className="rounded-[8px] border border-[var(--danger-line)] bg-[var(--surface)] px-4 py-4">
            <h3 className="text-[13px] font-bold text-[var(--danger)]">
              This action will archive the record
            </h3>
            <p className="mt-[6px] text-[11px] leading-[1.5] text-[var(--ink-faint)]">
              {message}
            </p>
          </div>

          {error ? (
            <div className="mt-[14px]">
              <FormError error={error} />
            </div>
          ) : null}
        </div>

        <div className="flex justify-end gap-[10px] border-t border-[var(--line)] px-[22px] py-[16px]">
          <button
            type="button"
            onClick={onClose}
            className="rounded-[8px] border border-[var(--line)] bg-[var(--surface)] px-5 py-[10px] text-[12px] font-bold text-[var(--ink)]"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleConfirm}
            disabled={working}
            className="rounded-[8px] border border-[var(--danger-solid)] bg-[var(--danger-solid)] px-5 py-[10px] text-[12px] font-bold text-white transition hover:border-[var(--danger-solid-hover)] hover:bg-[var(--danger-solid-hover)] disabled:opacity-50"
          >
            {working ? 'Working...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ConfirmDeleteModal
