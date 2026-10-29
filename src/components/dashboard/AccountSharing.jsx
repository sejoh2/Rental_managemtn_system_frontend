import { ACCOUNT_NAMES, PAYMENT_ORDERS } from '../../utils/accountSharing'

// The Add and Edit property form pieces for accounts that share; rules in utils/accountSharing.

/*
  A kind with no account of its own: says where its bills go and offers
  "Use rent account", "Use water account"..., and "Add ... account".
*/
export function SharedAccountSlot({
  title,
  billsLabel,
  target,
  targets,
  numbers = {},
  addLabel,
  onUse,
  onAdd,
  note = null,
  actions = null,
}) {
  const number = numbers[target]

  return (
    <div className="mb-4 rounded-[10px] border border-[var(--line)] bg-[var(--surface)] p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[13px] font-bold text-[var(--ink)]">{title}</div>
          <p className="mt-[4px] text-[11px] leading-[1.5] text-[var(--ink-soft)]">
            No separate account. {billsLabel} {billsLabel.endsWith('s') ? 'are' : 'is'} paid into the{' '}
            <strong className="text-[var(--ink)]">
              {ACCOUNT_NAMES[target]} account{number ? ` (${number})` : ''}
            </strong>
            .
          </p>
          {note}
        </div>

        {actions}
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {targets.map((option) => {
          const active = option === target

          return (
            <button
              key={option}
              type="button"
              aria-pressed={active}
              onClick={() => onUse(option)}
              className={`rounded-[8px] border px-3 py-2 text-[11px] font-bold transition ${
                active
                  ? 'border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent-ink)]'
                  : 'border-[var(--line)] bg-[var(--surface)] text-[var(--ink-soft)] hover:border-[var(--accent-soft-line)] hover:text-[var(--accent-ink)]'
              }`}
            >
              {active ? '✓ ' : ''}Use {ACCOUNT_NAMES[option]} account
            </button>
          )
        })}

        {onAdd ? (
          <button
            type="button"
            onClick={onAdd}
            className="rounded-[8px] border border-dashed border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-[11px] font-bold text-[var(--ink-soft)] transition hover:border-[var(--accent-soft-line)] hover:text-[var(--accent-ink)]"
          >
            + {addLabel}
          </button>
        ) : null}
      </div>
    </div>
  )
}

// How a payment that doesn't cover every bill is shared out.
export function PaymentOrderField({ value, onChange, note }) {
  return (
    <fieldset className="mb-4 rounded-[10px] border border-[var(--line)] bg-[var(--surface)] p-4">
      <legend className="px-1 text-[11px] font-bold text-[var(--ink)]">
        When a payment doesn&apos;t cover every bill, pay
      </legend>

      {PAYMENT_ORDERS.map(([option, label, hint]) => (
        <label key={option} className="mt-2 flex cursor-pointer items-start gap-2 text-[12px] text-[var(--ink)]">
          <input
            type="radio"
            name="payment_order"
            value={option}
            checked={value === option}
            onChange={() => onChange(option)}
            className="mt-[3px] accent-[var(--accent)]"
          />
          <span>
            <strong>{label}</strong>
            {option === 'fixed' ? ' (default)' : ''}
            <span className="block text-[11px] leading-[1.5] text-[var(--ink-faint)]">{hint}</span>
          </span>
        </label>
      ))}

      <p className="mt-3 text-[10px] leading-[1.5] text-[var(--ink-faint)]">
        Each payment only pays the bills of the account it came into.
        {note ? ` ${note}` : ''}
      </p>
    </fieldset>
  )
}
