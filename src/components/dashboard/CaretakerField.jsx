import { formatPhone } from '../../utils/format'
import CaretakerPermissions from './CaretakerPermissions'

const inputClass =
  'h-10 w-full rounded-[8px] border border-[var(--line)] bg-[var(--surface)] px-3 text-[12px] text-[var(--ink)] outline-none transition placeholder:text-[var(--ink-faint)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)] disabled:bg-[var(--line-soft)] disabled:text-[var(--ink-faint)]'

const labelClass = 'mb-2 block text-[11px] font-bold text-[var(--ink)]'

const linkClass = 'text-[11px] font-bold text-[var(--accent-ink)] hover:underline'

/*
  Picks a property's caretaker: none, one of the owner's existing
  caretakers, or a new one created inline.

  caretaker / onChange - form state shaped like emptyCaretaker (utils/propertyForm).
*/
function CaretakerField({
  caretaker,
  onChange,
  existingCaretakers,
  loading,
  noneLabel = 'None — assign later',
  newCaretakerNote,
}) {
  if (caretaker.mode === 'new') {
    return (
      <div className="rounded-[10px] border border-[var(--line)] bg-[var(--surface)] p-4">
        <div className="mb-3 flex items-center justify-between">
          <div className="text-[13px] font-bold text-[var(--ink)]">New caretaker</div>
          <button
            type="button"
            className={linkClass}
            onClick={() => onChange({ mode: 'none', caretakerId: '' })}
          >
            Cancel
          </button>
        </div>

        <div className="grid gap-[14px] sm:grid-cols-2">
          <div>
            <label className={labelClass}>First name</label>
            <input
              type="text"
              required
              minLength={2}
              value={caretaker.first_name}
              onChange={(event) => onChange({ first_name: event.target.value })}
              placeholder="e.g. Ruth"
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>Last name</label>
            <input
              type="text"
              required
              minLength={2}
              value={caretaker.last_name}
              onChange={(event) => onChange({ last_name: event.target.value })}
              placeholder="e.g. Chebet"
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>Phone number</label>
            <input
              type="text"
              inputMode="tel"
              required
              value={caretaker.phone}
              onChange={(event) => onChange({ phone: event.target.value })}
              placeholder="e.g. 0733 908 771"
              className={inputClass}
            />
          </div>

        </div>

        <div className="mt-[14px]">
          <CaretakerPermissions
            value={caretaker.permissions}
            onChange={(permissions) => onChange({ permissions })}
          />
        </div>

        <p className="mt-3 text-[11px] leading-[1.5] text-[var(--ink-faint)]">
          {newCaretakerNote} They sign in with this phone number and a
          one-time code — no password to set up.
        </p>
      </div>
    )
  }

  return (
    <div>
      <label className={labelClass}>Assigned caretaker</label>

      {existingCaretakers.length ? (
        <div className="grid gap-[14px]">
          <select
            value={caretaker.caretakerId}
            onChange={(event) =>
              onChange({
                caretakerId: event.target.value,
                mode: event.target.value ? 'existing' : 'none',
              })
            }
            className={inputClass}
          >
            <option value="">{noneLabel}</option>
            {existingCaretakers.map((item) => (
              <option key={item.caretaker_id} value={item.caretaker_id}>
                {item.full_name} · {formatPhone(item.phone)}
              </option>
            ))}
          </select>

          {caretaker.mode === 'existing' ? (
            <CaretakerPermissions
              value={caretaker.permissions}
              onChange={(permissions) => onChange({ permissions })}
            />
          ) : null}
        </div>
      ) : (
        <div className="flex h-10 items-center rounded-[8px] border border-[var(--line)] bg-[var(--line-soft)] px-3 text-[12px] text-[var(--ink-faint)]">
          {loading ? 'Loading caretakers...' : 'You haven’t added any caretakers yet.'}
        </div>
      )}

      <button
        type="button"
        className={`mt-2 ${linkClass}`}
        onClick={() => onChange({ mode: 'new', caretakerId: '' })}
      >
        {existingCaretakers.length ? '+ Create a new caretaker' : '+ Create caretaker'}
      </button>
    </div>
  )
}

export default CaretakerField
