import { useRef, useState } from 'react'
import { CalendarDays, Clock, Plus, X } from 'lucide-react'
import StatCard from '../../components/dashboard/StatCard'
import { smsMessages, smsStats, smsTemplates } from '../../data/smsCentreData'

function SmsCentrePage() {
  const [broadcastOpen, setBroadcastOpen] = useState(false)
  const [templateOpen, setTemplateOpen] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState(null)

  function openBroadcast(template = null) {
    setSelectedTemplate(template)
    setBroadcastOpen(true)
  }

  return (
    <>
      <div className="mb-7 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-[10px] text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--accent)]">
            Operations
          </div>
          <h1 className="font-display text-[20px] font-semibold tracking-[-0.01em]">
            SMS centre
          </h1>
          <p className="mt-2 text-[12px] text-[var(--ink-soft)]">
            Rent reminders, receipts and announcements sent to tenants.
          </p>
        </div>

        <button
          onClick={() => openBroadcast()}
          className="inline-flex items-center gap-2 rounded-[8px] border border-[var(--accent)] bg-[var(--accent)] px-4 py-[10px] text-[12px] font-bold text-white"
        >
          <Plus size={15} />
          New broadcast
        </button>
      </div>

      <div className="mb-6 grid gap-[14px] sm:grid-cols-2 xl:grid-cols-4">
        {smsStats.map((item) => (
          <StatCard key={item.label} {...item} />
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.6fr_1fr]">
        <section className="overflow-hidden rounded-[10px] border border-[var(--line)] bg-white">
          <div className="border-b border-[var(--line)] px-[18px] py-4">
            <h3 className="text-[12px] font-bold">Recent messages</h3>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-[720px] w-full border-collapse">
              <thead>
                <tr className="bg-[var(--bg)] text-left text-[9px] uppercase tracking-[0.05em] text-[var(--ink-faint)]">
                  <th className="px-[18px] py-[10px] font-bold">Tenant</th>
                  <th className="px-[18px] py-[10px] font-bold">Template</th>
                  <th className="px-[18px] py-[10px] font-bold">Sent</th>
                  <th className="px-[18px] py-[10px] font-bold">Status</th>
                </tr>
              </thead>
              <tbody>
                {smsMessages.map((item) => (
                  <tr key={`${item.tenant}-${item.template}`} className="border-b border-[var(--line-soft)] last:border-b-0">
                    <td className="px-[18px] py-[13px] text-[12px] font-bold">{item.tenant}</td>
                    <td className="px-[18px] py-[13px] text-[12px]">{item.template}</td>
                    <td className="px-[18px] py-[13px] text-[12px]">{item.sent}</td>
                    <td className="px-[18px] py-[13px]">
                      <StatusBadge tone={item.tone}>{item.status}</StatusBadge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="overflow-hidden rounded-[10px] border border-[var(--line)] bg-white">
          <div className="flex items-center justify-between border-b border-[var(--line)] px-[18px] py-4">
            <h3 className="text-[12px] font-bold">Templates</h3>

            <button
              onClick={() => setTemplateOpen(true)}
              className="inline-flex items-center gap-2 rounded-[8px] border border-[var(--line)] bg-white px-3 py-2 text-[11px] font-bold"
            >
              <Plus size={14} />
              Create template
            </button>
          </div>

          <div className="space-y-[10px] p-[18px]">
            {smsTemplates.map((template) => (
              <div
                key={template.title}
                className="rounded-[8px] border border-[var(--line)] border-l-2 border-l-[var(--accent-soft-line)] bg-white p-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h4 className="text-[13px] font-bold">{template.title}</h4>
                    <p className="font-mono mt-[7px] text-[10px] leading-[1.6] text-[var(--ink-faint)]">
                      {template.body}
                    </p>
                  </div>

                  <button
                    onClick={() => openBroadcast(template)}
                    className="rounded-[8px] border border-[var(--line)] bg-white px-3 py-2 text-[11px] font-bold transition hover:border-[var(--accent-soft-line)] hover:text-[var(--accent)]"
                  >
                    Use
                  </button>
                </div>
              </div>
            ))}

            <p className="text-[10px] leading-[1.5] text-[var(--ink-faint)]">
              Templates use placeholders like {'{name}'} and {'{balance}'}.
              Kodi fills these in per tenant automatically when the broadcast is sent.
            </p>
          </div>
        </section>
      </div>

      <BroadcastModal
        open={broadcastOpen}
        selectedTemplate={selectedTemplate}
        onClose={() => {
          setBroadcastOpen(false)
          setSelectedTemplate(null)
        }}
      />

      <CreateTemplateModal
        open={templateOpen}
        onClose={() => setTemplateOpen(false)}
      />
    </>
  )
}

function BroadcastModal({ open, selectedTemplate, onClose }) {
  const [when, setWhen] = useState('now')
  const dateRef = useRef(null)
  const timeRef = useRef(null)

  if (!open) return null

  const templateTitle = selectedTemplate?.title || 'Write a custom message...'
  const templateBody = selectedTemplate?.body?.replace(/^"|"$/g, '') || ''

  function handleSubmit(event) {
    event.preventDefault()
    window.alert(
      when === 'later'
        ? 'Broadcast scheduled successfully.'
        : 'Broadcast sent successfully.'
    )
    onClose()
  }

  return (
    <ModalShell title="New broadcast" onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <div className="px-[22px] py-[22px]">
          <div className="mb-[18px]">
            <label className="mb-2 block text-[11px] font-bold text-[var(--ink)]">
              Template
            </label>
            <select
              defaultValue={templateTitle}
              className="h-10 w-full rounded-[8px] border border-[var(--line)] bg-white px-3 text-[12px] text-[var(--ink)] outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)]"
            >
              <option>Write a custom message...</option>
              {smsTemplates.map((template) => (
                <option key={template.title}>{template.title}</option>
              ))}
            </select>

            <p className="mt-2 text-[10px] leading-[1.5] text-[var(--ink-faint)]">
              Pick a saved template or write your own below. Placeholders like {'{name}'}, {'{house}'} and {'{balance}'} are filled in per tenant automatically.
            </p>
          </div>

          <div className="mb-[18px]">
            <label className="mb-2 block text-[11px] font-bold text-[var(--ink)]">
              Message
            </label>
            <textarea
              defaultValue={templateBody}
              placeholder="Type your message... use {name}, {house}, {balance}, {due_date} as placeholders"
              rows={4}
              className="w-full resize-none rounded-[8px] border border-[var(--line)] bg-white p-3 text-[12px] text-[var(--ink)] outline-none placeholder:text-[var(--ink-faint)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)]"
            />
          </div>

          <div className="mb-[18px]">
            <label className="mb-2 block text-[11px] font-bold text-[var(--ink)]">
              Send to
            </label>
            <select
              defaultValue={selectedTemplate ? 'Tenants with arrears (28)' : 'All active tenants (123)'}
              className="h-10 w-full rounded-[8px] border border-[var(--line)] bg-white px-3 text-[12px] text-[var(--ink)] outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)]"
            >
              <option>All active tenants (123)</option>
              <option>Tenants with arrears (28)</option>
              <option>Tenants with credit balance (4)</option>
              <option>One property only</option>
            </select>
          </div>

          <div className="mb-[18px]">
            <label className="mb-3 block text-[11px] font-bold text-[var(--ink)]">
              When
            </label>

            <div className="flex flex-wrap gap-5 text-[12px] text-[var(--ink)]">
              <label className="inline-flex items-center gap-2">
                <input
                  type="radio"
                  name="when"
                  checked={when === 'now'}
                  onChange={() => setWhen('now')}
                />
                Send now
              </label>

              <label className="inline-flex items-center gap-2">
                <input
                  type="radio"
                  name="when"
                  checked={when === 'later'}
                  onChange={() => setWhen('later')}
                />
                Schedule for later
              </label>
            </div>
          </div>

          {when === 'later' ? (
            <div className="mb-[18px]">
              <div className="grid gap-[14px] sm:grid-cols-2">
                <DatePickerField
                  label="Date"
                  inputRef={dateRef}
                  type="date"
                  placeholder="e.g. 18 Jul 2026"
                  icon={<CalendarDays size={15} />}
                />

                <DatePickerField
                  label="Time"
                  inputRef={timeRef}
                  type="time"
                  placeholder="e.g. 8:00 AM"
                  icon={<Clock size={15} />}
                />
              </div>

              <p className="mt-2 text-[10px] leading-[1.5] text-[var(--ink-faint)]">
                The broadcast is queued and sent automatically at this date and time. You can cancel or edit it from the SMS centre until then.
              </p>
            </div>
          ) : null}

          <div className="rounded-[8px] border border-[var(--line)] border-l-2 border-l-[var(--accent-soft-line)] bg-white px-4 py-4">
            <h3 className="text-[14px] font-bold text-[var(--ink)]">
              Estimated reach
            </h3>
            <p className="mt-1 text-[11px] leading-[1.5] text-[var(--ink-faint)]">
              {selectedTemplate
                ? '28 tenants with arrears - approx. cost KES 42 at KES 1.50/SMS'
                : '123 tenants - approx. cost KES 185 at KES 1.50/SMS'}
            </p>
          </div>
        </div>

        <ModalFooter>
          <button
            type="button"
            onClick={onClose}
            className="rounded-[8px] border border-[var(--line)] bg-white px-5 py-[10px] text-[12px] font-bold"
          >
            Cancel
          </button>

          <button
            type="submit"
            className="rounded-[8px] border border-[var(--accent)] bg-[var(--accent)] px-5 py-[10px] text-[12px] font-bold text-white"
          >
            {when === 'later' ? 'Schedule broadcast' : 'Send broadcast'}
          </button>
        </ModalFooter>
      </form>
    </ModalShell>
  )
}

function CreateTemplateModal({ open, onClose }) {
  if (!open) return null

  function handleSubmit(event) {
    event.preventDefault()
    window.alert('SMS template saved successfully.')
    onClose()
  }

  return (
    <ModalShell title="Create SMS template" onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <div className="px-[22px] py-[22px]">
          <div className="mb-[18px]">
            <Field label="Template name" placeholder="e.g. Water bill reminder" />
          </div>

          <div className="mb-[10px]">
            <label className="mb-2 block text-[11px] font-bold text-[var(--ink)]">
              Message text
            </label>
            <textarea
              placeholder="Dear {name}, your water bill for {house} is KES {balance}..."
              rows={5}
              className="w-full resize-none rounded-[8px] border border-[var(--line)] bg-white p-3 text-[12px] text-[var(--ink)] outline-none placeholder:text-[var(--ink-faint)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)]"
            />
          </div>

          <p className="text-[10px] leading-[1.5] text-[var(--ink-faint)]">
            Available placeholders: {'{name}'}, {'{house}'}, {'{balance}'}, {'{amount}'}, {'{month}'}, {'{due_date}'}, {'{days_overdue}'}. Each fills in automatically per tenant when a broadcast is sent.
          </p>
        </div>

        <ModalFooter>
          <button
            type="button"
            onClick={onClose}
            className="rounded-[8px] border border-[var(--line)] bg-white px-5 py-[10px] text-[12px] font-bold"
          >
            Cancel
          </button>

          <button
            type="submit"
            className="rounded-[8px] border border-[var(--accent)] bg-[var(--accent)] px-5 py-[10px] text-[12px] font-bold text-white"
          >
            Save template
          </button>
        </ModalFooter>
      </form>
    </ModalShell>
  )
}

function DatePickerField({ label, inputRef, type, placeholder, icon }) {
  function openPicker() {
    if (inputRef.current?.showPicker) {
      inputRef.current.showPicker()
    } else {
      inputRef.current?.focus()
    }
  }

  return (
    <div>
      <label className="mb-2 block text-[11px] font-bold text-[var(--ink)]">
        {label}
      </label>

      <div className="relative">
        <input
          ref={inputRef}
          type={type}
          placeholder={placeholder}
          className="h-10 w-full rounded-[8px] border border-[var(--line)] bg-white px-3 pr-10 text-[12px] text-[var(--ink)] outline-none placeholder:text-[var(--ink-faint)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)]"
        />

        <button
          type="button"
          onClick={openPicker}
          className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-[6px] text-[var(--ink-faint)] transition hover:bg-[var(--line-soft)] hover:text-[var(--accent)]"
        >
          {icon}
        </button>
      </div>
    </div>
  )
}

function Field({ label, placeholder }) {
  return (
    <div>
      <label className="mb-2 block text-[11px] font-bold text-[var(--ink)]">
        {label}
      </label>
      <input
        placeholder={placeholder}
        className="h-10 w-full rounded-[8px] border border-[var(--line)] bg-white px-3 text-[12px] text-[var(--ink)] outline-none placeholder:text-[var(--ink-faint)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)]"
      />
    </div>
  )
}

function ModalShell({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/45 px-4 py-8">
      <div className="w-full max-w-[640px] overflow-hidden rounded-[14px] bg-white shadow-[0_24px_80px_rgba(0,0,0,0.28)]">
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

        {children}
      </div>
    </div>
  )
}

function ModalFooter({ children }) {
  return (
    <div className="flex justify-end gap-[10px] border-t border-[var(--line)] px-[22px] py-[16px]">
      {children}
    </div>
  )
}

function StatusBadge({ tone, children }) {
  const tones = {
    success: 'bg-[#E3F1E8] text-[#2E7D4F]',
    danger: 'bg-[#FBE4E2] text-[#B3261E]',
  }

  return (
    <span className={`inline-flex items-center gap-[6px] rounded-full px-[9px] py-[3px] text-[9px] font-bold ${tones[tone]}`}>
      <span className="h-[6px] w-[6px] rounded-full bg-current" />
      {children}
    </span>
  )
}

export default SmsCentrePage