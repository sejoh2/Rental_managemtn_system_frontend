import { CARETAKER_PERMISSIONS, withPermission } from '../../utils/labels'

/*
  What the owner lets the caretaker do in one property: one switch each.
  Managing tenants and recording payments need the tenants to be visible,
  so ticking either ticks "View tenants", and unticking that unticks both.

  value: { can_read_meters, ..., can_record_payments }; onChange(next)
*/
function CaretakerPermissions({ value, onChange, propertyName }) {
  return (
    <fieldset className="rounded-[8px] border border-[var(--line)] bg-[var(--surface)] px-4 py-3">
      <legend className="px-1 text-[11px] font-bold text-[var(--ink)]">
        What they may do{propertyName ? ` at ${propertyName}` : ''}
      </legend>

      <div className="grid gap-[10px] sm:grid-cols-2">
        {CARETAKER_PERMISSIONS.map(([key, title, hint]) => (
          <label key={key} className="flex items-start gap-2 text-[11px] leading-[1.5]">
            <input
              type="checkbox"
              checked={value[key] === true}
              onChange={(event) => onChange(withPermission(value, key, event.target.checked))}
              className="mt-[2px] h-[13px] w-[13px]"
            />
            <span>
              <span className="font-bold text-[var(--ink)]">{title}</span>
              <span className="block text-[10px] text-[var(--ink-faint)]">{hint}</span>
            </span>
          </label>
        ))}
      </div>

      <p className="mt-3 text-[10px] leading-[1.5] text-[var(--ink-faint)]">
        Caretakers never see totals: no rent collected, income or monthly summaries, only each
        tenant&apos;s own balance and statement.
      </p>
    </fieldset>
  )
}

export default CaretakerPermissions
