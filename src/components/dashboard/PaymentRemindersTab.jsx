import { useState } from 'react'
import { getPaymentReminders, savePaymentReminders } from '../../api/properties'
import { useApi } from '../../hooks/useApi'
import { formatDate, ordinal } from '../../utils/format'
import { REMINDER_DAYS_BEFORE, REMINDER_HOURS, REMINDER_LATE_DAYS, optionLabel } from '../../utils/labels'
import { DataState, FormError } from '../common/DataState'
import { SelectField, primaryButtonClass } from '../common/Modal'

const cardClass = 'overflow-hidden rounded-[10px] border border-[var(--line)] bg-[var(--surface)]'

// The next date the property's rent falls due, today included.
function nextDueDate(dueDay) {
  const today = new Date()
  const due = new Date(today.getFullYear(), today.getMonth(), dueDay)

  if (due < new Date(today.getFullYear(), today.getMonth(), today.getDate())) {
    due.setMonth(due.getMonth() + 1)
  }

  return due
}

function daysFrom(date, days) {
  const copy = new Date(date)

  copy.setDate(copy.getDate() + days)

  return copy
}

// Automatic payment reminders for one property. Off until the owner switches them on.
function PaymentRemindersTab({ property }) {
  const state = useApi(`payment-reminders-${property.id}`, () => getPaymentReminders(property.id))

  return (
    <section className={cardClass}>
      <div className="border-b border-[var(--line)] px-[18px] py-4">
        <h3 className="text-[12px] font-bold">Automatic payment reminders - {property.name}</h3>
        <p className="mt-[3px] text-[10px] leading-[1.5] text-[var(--ink-faint)]">
          Kodi can text tenants before rent is due. Only a tenant who owes
          something is sent a reminder, and it tells them everything they
          owe: rent, water, electricity, service charges and repairs.
        </p>
      </div>

      <DataState state={state} loadingLabel="Loading reminder settings...">
        {(settings) => <RemindersForm property={property} settings={settings} onSaved={state.reload} />}
      </DataState>
    </section>
  )
}

function RemindersForm({ property, settings, onSaved }) {
  const [form, setForm] = useState({
    enabled: settings.enabled,
    days_before: settings.days_before,
    hour: String(settings.hour),
    late_enabled: settings.late_enabled,
    late_days_after: String(settings.late_days_after),
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState(null)

  function patch(change) {
    setSaved(false)
    setForm((current) => ({ ...current, ...change }))
  }

  function toggleDay(days) {
    patch({
      days_before: form.days_before.includes(days)
        ? form.days_before.filter((item) => item !== days)
        : [...form.days_before, days],
    })
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setSaving(true)
    setError(null)

    try {
      await savePaymentReminders(property.id, {
        enabled: form.enabled,
        days_before: form.days_before,
        hour: Number(form.hour),
        late_enabled: form.late_enabled,
        late_days_after: Number(form.late_days_after),
      })

      setSaved(true)
      onSaved()
    } catch (saveError) {
      setError(saveError.details?.[0] || saveError)
    } finally {
      setSaving(false)
    }
  }

  const due = nextDueDate(property.rent_due_day)
  const time = optionLabel(REMINDER_HOURS, form.hour)
  const reminderDates = [...form.days_before]
    .sort((a, b) => b - a)
    .map((days) => formatDate(daysFrom(due, -days)))
  // A reminder sent before the 1st cannot include the new month's bills.
  const beforeBilling = form.days_before.some((days) => days >= property.rent_due_day)

  return (
    <form onSubmit={handleSubmit} className="px-[18px] py-4">
      <label className="flex cursor-pointer items-start gap-3 text-[12px] font-medium">
        <input
          type="checkbox"
          checked={form.enabled}
          onChange={(event) => patch({ enabled: event.target.checked })}
          className="mt-[2px] h-4 w-4 accent-[var(--accent)]"
        />
        <span>
          <span className="block font-bold">Remind tenants before the due date</span>
          <span className="mt-[2px] block text-[10px] font-normal text-[var(--ink-faint)]">
            Rent for {property.name} is due on the {ordinal(property.rent_due_day)} of every month.
          </span>
        </span>
      </label>

      {form.enabled ? (
        <div className="ml-7 mt-4">
          <div className="mb-2 text-[11px] font-bold">Send a reminder</div>

          <div className="grid gap-2 sm:grid-cols-3">
            {REMINDER_DAYS_BEFORE.map(([value, label]) => (
              <label key={value} className="flex cursor-pointer items-center gap-2 text-[12px]">
                <input
                  type="checkbox"
                  checked={form.days_before.includes(value)}
                  onChange={() => toggleDay(value)}
                  className="h-[13px] w-[13px] accent-[var(--accent)]"
                />
                {label}
              </label>
            ))}
          </div>

          <div className="mt-4 max-w-[240px]">
            <SelectField
              label="At what time"
              value={form.hour}
              onChange={(event) => patch({ hour: event.target.value })}
              options={REMINDER_HOURS}
            />
          </div>

          <p className="mt-3 text-[11px] leading-[1.5] text-[var(--ink-soft)]">
            {reminderDates.length
              ? `For rent due on ${formatDate(due)}, tenants who owe are reminded on ${reminderDates.join(' and ')} at ${time}.`
              : 'Choose at least one day.'}
          </p>

          {beforeBilling ? (
            <p className="mt-2 text-[11px] leading-[1.5] text-[var(--warning)]">
              One of the days you chose falls before the 1st of the month.
              The new month&apos;s rent is billed on the 1st, so a reminder
              sent before then only reaches tenants who still owe from
              earlier, and does not include the new rent.
            </p>
          ) : null}

          <div className="mt-3 rounded-[8px] border border-[var(--line)] bg-[var(--bg)] px-3 py-3 text-[11px] leading-[1.5] text-[var(--ink-soft)]">
            <span className="font-bold">What the tenant receives:</span> &quot;Dear John, your
            balance for House A1 is KES 11,650. Kindly pay by {formatDate(due)}. {property.name}&quot;
          </div>
        </div>
      ) : null}

      <label className="mt-5 flex cursor-pointer items-start gap-3 border-t border-[var(--line-soft)] pt-5 text-[12px] font-medium">
        <input
          type="checkbox"
          checked={form.late_enabled}
          onChange={(event) => patch({ late_enabled: event.target.checked })}
          className="mt-[2px] h-4 w-4 accent-[var(--accent)]"
        />
        <span>
          <span className="block font-bold">Send a notice to tenants who have not paid after the due date</span>
          <span className="mt-[2px] block text-[10px] font-normal text-[var(--ink-faint)]">
            One notice, to each tenant who still has a bill past its due date.
          </span>
        </span>
      </label>

      {form.late_enabled ? (
        <div className="ml-7 mt-4">
          <div className="max-w-[240px]">
            <SelectField
              label="How long after the due date"
              value={form.late_days_after}
              onChange={(event) => patch({ late_days_after: event.target.value })}
              options={REMINDER_LATE_DAYS}
            />
          </div>

          <p className="mt-3 text-[11px] leading-[1.5] text-[var(--ink-soft)]">
            For rent due on {formatDate(due)}, the notice goes out on{' '}
            {formatDate(daysFrom(due, Number(form.late_days_after)))} at {time}.
          </p>

          <div className="mt-3 rounded-[8px] border border-[var(--line)] bg-[var(--bg)] px-3 py-3 text-[11px] leading-[1.5] text-[var(--ink-soft)]">
            <span className="font-bold">What the tenant receives:</span> &quot;Dear John, your
            balance of KES 11,000 for House A1 was due on {formatDate(due)} and is still unpaid.
            Kindly settle it. {property.name}&quot;
          </div>
        </div>
      ) : null}

      <p className="mt-5 text-[10px] leading-[1.5] text-[var(--ink-faint)]">
        Each reminder is one SMS per tenant, charged like any other message,
        and is listed in the SMS centre. A tenant gets each reminder once.
        Tenants who owe nothing get none. Payment confirmations are not sent
        automatically.
      </p>

      {error ? (
        <div className="mt-[14px]">
          <FormError error={error} />
        </div>
      ) : null}

      <div className="mt-[14px] flex items-center gap-3">
        <button
          type="submit"
          disabled={saving || (form.enabled && !form.days_before.length)}
          className={primaryButtonClass}
        >
          {saving ? 'Saving...' : 'Save reminders'}
        </button>
        {saved ? <span className="text-[11px] font-bold text-[var(--success)]">Saved</span> : null}
      </div>
    </form>
  )
}

export default PaymentRemindersTab
