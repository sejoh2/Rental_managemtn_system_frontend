import { useState } from 'react'
import { SMS_SENDER_OPTIONS } from '../../utils/labels'
import { Field, SelectField } from '../common/Modal'

/*
  Who a property's SMS appears to come from. value is the sender ID text;
  empty means the default, where Africa's Talking sends from its own number.
*/
const statusNotes = {
  pending:
    'Waiting for approval by Kodi. Until it is approved, messages for this property go out from the default sender.',
  approved: 'Approved. Messages for this property go out from this sender ID.',
  rejected:
    'Not approved. Messages for this property go out from the default sender. Choose Default, or enter a different sender ID.',
}

// saved / status: the sender ID stored on the property and where its approval stands.
function SmsSenderField({ value, onChange, saved, status }) {
  const [mode, setMode] = useState(value ? 'custom' : 'default')

  function chooseMode(event) {
    setMode(event.target.value)

    if (event.target.value === 'default') onChange('')
  }

  return (
    <div>
      <SelectField
        label="SMS sender"
        value={mode}
        onChange={chooseMode}
        options={SMS_SENDER_OPTIONS}
      />

      {mode === 'custom' ? (
        <div className="mt-[10px]">
          <Field
            label="Sender ID"
            value={value}
            onChange={(event) => onChange(event.target.value)}
            placeholder="e.g. KODI-GVA"
            maxLength={11}
            required
            hint="Up to 11 letters or numbers. Kodi approves a new sender ID before it is used; until then messages go out from the default sender."
          />
          {saved && value.trim() === saved && statusNotes[status] ? (
            <p
              className={`mt-2 text-[10px] leading-[1.5] ${
                status === 'approved'
                  ? 'text-[var(--success)]'
                  : status === 'rejected'
                    ? 'text-[var(--danger)]'
                    : 'text-[var(--warning)]'
              }`}
            >
              {statusNotes[status]}
            </p>
          ) : null}
        </div>
      ) : (
        <p className="mt-2 text-[10px] text-[var(--ink-faint)]">
          Messages are sent from Africa&apos;s Talking&apos;s own number. Nothing to set up.
        </p>
      )}
    </div>
  )
}

export default SmsSenderField
