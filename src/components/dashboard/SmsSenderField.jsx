import { useState } from 'react'
import { SMS_SENDER_OPTIONS } from '../../utils/labels'
import { Field, SelectField } from '../common/Modal'

/*
  Who a property's SMS appears to come from. value is the sender ID text;
  empty means the default, where Africa's Talking sends from its own number.
*/
function SmsSenderField({ value, onChange }) {
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
            hint="Up to 11 letters or numbers. It must already be approved for your account by Africa's Talking, or every message will fail."
          />
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
