import { AlertCircle, Inbox, Loader2 } from 'lucide-react'

export function LoadingState({ label = 'Loading...' }) {
  return (
    <div className="flex items-center justify-center gap-2 px-[18px] py-10 text-[12px] text-[var(--ink-faint)]">
      <Loader2 size={15} className="animate-spin" />
      {label}
    </div>
  )
}

export function ErrorState({ error, onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-[18px] py-10 text-center">
      <div className="flex items-center gap-2 text-[12px] font-bold text-[#B3261E]">
        <AlertCircle size={15} />
        {error?.message || 'Something went wrong.'}
      </div>

      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="rounded-[8px] border border-[var(--line)] bg-white px-3 py-2 text-[11px] font-bold"
        >
          Try again
        </button>
      ) : null}
    </div>
  )
}

export function EmptyState({ title = 'Nothing here yet', message, children }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-[18px] py-10 text-center">
      <Inbox size={20} className="text-[var(--ink-faint)]" />
      <div className="text-[12px] font-bold text-[var(--ink)]">{title}</div>
      {message ? (
        <p className="max-w-[360px] text-[11px] leading-[1.5] text-[var(--ink-faint)]">{message}</p>
      ) : null}
      {children}
    </div>
  )
}

/*
  Renders the right state for a useApi() result, or the children once data is ready.

  <DataState state={units} isEmpty={(data) => !data.length} empty={<EmptyState ... />}>
    {(data) => ...}
  </DataState>
*/
export function DataState({ state, isEmpty, empty, loadingLabel, children }) {
  if (state.error) return <ErrorState error={state.error} onRetry={state.reload} />
  if (state.data === null) return <LoadingState label={loadingLabel} />
  if (isEmpty?.(state.data)) return empty || <EmptyState />

  return children(state.data)
}

// Inline error line for forms and modals.
export function FormError({ error }) {
  if (!error) return null

  return (
    <div className="flex items-start gap-2 rounded-[8px] border border-[#F3C9C5] bg-[#FBE4E2] px-3 py-[10px] text-[11px] font-bold leading-[1.5] text-[#B3261E]">
      <AlertCircle size={14} className="mt-[1px] shrink-0" />
      <span>{error.message || String(error)}</span>
    </div>
  )
}
