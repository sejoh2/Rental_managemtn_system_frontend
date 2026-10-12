import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Plus } from 'lucide-react'
import {
  cancelSmsBroadcast,
  createSmsBroadcast,
  createSmsTemplate,
  deleteSmsTemplate,
  estimateSmsRecipients,
  getSmsStats,
  listSmsBroadcasts,
  listSmsMessages,
  listSmsTemplates,
  retrySmsMessage,
  updateSmsTemplate,
} from '../../api/sms'
import { listTenants } from '../../api/tenants'
import { DataState, EmptyState, FormError } from '../../components/common/DataState'
import {
  Field,
  ModalBody,
  ModalFooter,
  ModalShell,
  SelectField,
  labelClass,
  primaryButtonClass,
  secondaryButtonClass,
} from '../../components/common/Modal'
import SearchableSelect from '../../components/common/SearchableSelect'
import StatusBadge from '../../components/common/StatusBadge'
import ConfirmDeleteModal from '../../components/dashboard/ConfirmDeleteModal'
import StatCard from '../../components/dashboard/StatCard'
import { useProperties } from '../../context/PropertiesContext'
import { useApi } from '../../hooks/useApi'
import { formatDateTime, formatKES, formatNumber, formatPercent, toDateInput } from '../../utils/format'
import { isCurrentTenant } from '../../utils/tenantStatus'

const smallButtonClass =
  'rounded-[8px] border border-[var(--line)] bg-white px-3 py-2 text-[11px] font-bold transition hover:border-[var(--accent-soft-line)] hover:text-[var(--accent)]'

const textareaClass =
  'w-full resize-none rounded-[8px] border border-[var(--line)] bg-white p-3 text-[12px] text-[var(--ink)] outline-none placeholder:text-[var(--ink-faint)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)]'

const RECIPIENT_GROUPS = [
  ['all_active_tenants', 'All current tenants'],
  ['tenants_with_arrears', 'Tenants with arrears'],
  ['tenants_with_credit_balance', 'Tenants with credit balance'],
]

/*
  The "Send to" choice is one string: a group above, "property:3" or "tenant:12".
  -> the recipient fields the API expects.
*/
function recipientTarget(sendTo) {
  const [kind, id] = sendTo.split(':')

  if (kind === 'property') return { recipient_group: 'property', property_id: Number(id) }
  if (kind === 'tenant') return { recipient_group: 'specific_tenant', tenant_id: Number(id) }

  return { recipient_group: sendTo }
}

const PLACEHOLDERS =
  '{name}, {house}, {property}, {balance}, {month}, {due_date}, {days_overdue}'

// accepted = the SMS provider took the message. Delivery to the handset is not tracked.
const messageStatuses = {
  accepted: ['Accepted', 'success'],
  failed: ['Failed', 'danger'],
  queued: ['Queued', 'warning'],
  cancelled: ['Cancelled', 'neutral'],
}

// How many SMS a message is billed as: one up to 160 characters, then one per 153.
function smsParts(message) {
  return message.length <= 160 ? 1 : Math.ceil(message.length / 153)
}

function recipientLabel(broadcast, properties) {
  if (broadcast.recipient_group === 'property') {
    return properties.find((property) => property.id === broadcast.property_id)?.name || 'One property'
  }

  return (
    RECIPIENT_GROUPS.find(([value]) => value === broadcast.recipient_group)?.[1] || 'One tenant'
  )
}

function SmsCentrePage() {
  const properties = useProperties().data || []
  const [searchParams, setSearchParams] = useSearchParams()
  // null | { template } - template is set when "Use" was clicked.
  const [broadcast, setBroadcast] = useState(null)
  // null | { template } - template is set when editing.
  const [templateForm, setTemplateForm] = useState(null)
  const [deletingTemplate, setDeletingTemplate] = useState(null)
  const [cancelling, setCancelling] = useState(null)
  const [actionError, setActionError] = useState(null)

  // The message filter lives in the URL: /sms-centre?status=failed
  const status = searchParams.get('status') || ''

  const statsState = useApi('sms-stats', getSmsStats)
  const messagesState = useApi(`sms-messages-${status}`, () => listSmsMessages({ status, limit: 50 }))
  const templatesState = useApi('sms-templates', listSmsTemplates)
  const scheduledState = useApi('sms-scheduled', () => listSmsBroadcasts({ status: 'scheduled' }))

  const stats = statsState.data
  const templates = templatesState.data || []
  // A broadcast sent "now" is briefly scheduled too; only future ones can still be cancelled.
  const scheduled = (scheduledState.data || []).filter(
    (item) => new Date(item.scheduled_at) > new Date()
  )

  function reloadActivity() {
    statsState.reload()
    messagesState.reload()
    scheduledState.reload()
  }

  // Messages are handed to the SMS provider in the background, so look again shortly after.
  function reloadAfterSending() {
    reloadActivity()
    setTimeout(reloadActivity, 2500)
  }

  async function retry(message) {
    setActionError(null)

    try {
      await retrySmsMessage(message.id)
      reloadAfterSending()
    } catch (error) {
      setActionError(error)
    }
  }

  const statCards = stats
    ? [
        {
          label: 'Sent this month',
          value: formatNumber(stats.sent_this_month),
          note: `${formatKES(stats.accepted_cost)} cost`,
          tone: 'muted',
        },
        {
          label: 'Accepted',
          value: formatPercent(stats.accepted_percentage),
          note: `${formatNumber(stats.accepted_count)} ${stats.accepted_count === 1 ? 'message' : 'messages'}`,
          tone: 'success',
        },
        {
          label: 'Failed',
          value: formatNumber(stats.failed_count),
          note: stats.failed_count ? 'retry from the list below' : 'none this month',
          tone: stats.failed_count ? 'danger' : 'muted',
        },
        {
          label: 'Scheduled',
          value: formatNumber(stats.scheduled_count),
          note: stats.next_scheduled_at
            ? `next: ${formatDateTime(stats.next_scheduled_at)}`
            : 'nothing scheduled',
          tone: 'muted',
        },
      ]
    : []

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
            Rent reminders and announcements sent to tenants.
          </p>
        </div>

        <button
          onClick={() => setBroadcast({})}
          className="inline-flex items-center gap-2 rounded-[8px] border border-[var(--accent)] bg-[var(--accent)] px-4 py-[10px] text-[12px] font-bold text-white"
        >
          <Plus size={15} />
          New broadcast
        </button>
      </div>

      {stats?.sms_mode === 'console' ? (
        <p className="mb-4 rounded-[8px] border border-[var(--line)] border-l-2 border-l-[#B8790E] bg-white px-4 py-3 text-[11px] leading-[1.5] text-[var(--ink-soft)]">
          <strong>Test mode:</strong> messages are printed in the backend
          terminal and are not sent to any phone. They still appear here as
          accepted.
        </p>
      ) : null}

      {actionError ? (
        <div className="mb-4">
          <FormError error={actionError} />
        </div>
      ) : null}

      <DataState state={statsState} loadingLabel="Loading SMS summary...">
        {() => (
          <div className="mb-6 grid gap-[14px] sm:grid-cols-2 xl:grid-cols-4">
            {statCards.map((item) => (
              <StatCard key={item.label} {...item} />
            ))}
          </div>
        )}
      </DataState>

      {scheduled.length ? (
        <section className="mb-4 overflow-hidden rounded-[10px] border border-[var(--line)] bg-white">
          <div className="border-b border-[var(--line)] px-[18px] py-4">
            <h3 className="text-[12px] font-bold">Scheduled broadcasts</h3>
            <p className="mt-[3px] text-[10px] text-[var(--ink-faint)]">
              Who receives each one, and their balance, is worked out at the
              time it is sent. To change one, cancel it and create it again.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-[720px] w-full border-collapse">
              <tbody>
                {scheduled.map((item) => (
                  <tr key={item.id} className="border-b border-[var(--line-soft)] last:border-b-0">
                    <td className="px-[18px] py-[13px] text-[12px] font-bold">
                      {item.template_name || 'Custom message'}
                      <div className="mt-[3px] max-w-[420px] truncate text-[10px] font-normal text-[var(--ink-faint)]">
                        {item.message_template}
                      </div>
                    </td>
                    <td className="px-[18px] py-[13px] text-[12px]">{recipientLabel(item, properties)}</td>
                    <td className="px-[18px] py-[13px] text-[12px]">{formatDateTime(item.scheduled_at)}</td>
                    <td className="px-[18px] py-[13px] text-right">
                      <button
                        onClick={() => setCancelling(item)}
                        className="rounded-[8px] border border-[#B3261E] bg-white px-3 py-2 text-[11px] font-bold text-[#B3261E]"
                      >
                        Cancel
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-[1.6fr_1fr]">
        <section className="overflow-hidden rounded-[10px] border border-[var(--line)] bg-white">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--line)] px-[18px] py-4">
            <h3 className="text-[12px] font-bold">Recent messages</h3>

            <div className="flex gap-2">
              {[
                ['', 'All'],
                ['failed', 'Failed'],
              ].map(([value, label]) => (
                <button
                  key={label}
                  onClick={() => setSearchParams(value ? { status: value } : {})}
                  className={`rounded-full px-3 py-[5px] text-[10px] font-bold ${
                    status === value
                      ? 'bg-[var(--accent-soft)] text-[var(--accent-hover)]'
                      : 'bg-[var(--line-soft)] text-[var(--ink-soft)]'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <DataState
            state={messagesState}
            loadingLabel="Loading messages..."
            isEmpty={(messages) => !messages.length}
            empty={
              <EmptyState
                title={status ? 'No failed messages' : 'No messages yet'}
                message={
                  status
                    ? 'Messages the SMS provider refuses appear here so you can retry them.'
                    : 'Send a broadcast to your tenants and each message will be listed here.'
                }
              />
            }
          >
            {(messages) => (
              <div className="overflow-x-auto">
                <table className="min-w-[720px] w-full border-collapse">
                  <thead>
                    <tr className="bg-[var(--bg)] text-left text-[9px] uppercase tracking-[0.05em] text-[var(--ink-faint)]">
                      <th className="px-[18px] py-[10px] font-bold">Tenant</th>
                      <th className="px-[18px] py-[10px] font-bold">Message</th>
                      <th className="px-[18px] py-[10px] font-bold">Sent</th>
                      <th className="px-[18px] py-[10px] font-bold">Status</th>
                      <th className="px-[18px] py-[10px] font-bold"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {messages.map((item) => {
                      const [label, tone] = messageStatuses[item.status] || [item.status, 'neutral']

                      return (
                        <tr key={item.id} className="border-b border-[var(--line-soft)] align-top last:border-b-0">
                          <td className="px-[18px] py-[13px] text-[12px] font-bold">
                            {item.tenant_name}
                            <div className="mt-[3px] text-[10px] font-normal text-[var(--ink-faint)]">
                              {[item.property_name, item.unit_number ? `House ${item.unit_number}` : null]
                                .filter(Boolean)
                                .join(' · ')}
                            </div>
                          </td>
                          <td className="px-[18px] py-[13px] text-[12px]">
                            {item.template_name || 'Custom message'}
                            <div className="mt-[3px] max-w-[320px] text-[10px] leading-[1.5] text-[var(--ink-faint)]">
                              {item.message}
                            </div>
                            {item.provider_error ? (
                              <div className="mt-[3px] max-w-[320px] text-[10px] text-[#B3261E]">
                                {item.provider_error}
                              </div>
                            ) : null}
                          </td>
                          <td className="whitespace-nowrap px-[18px] py-[13px] text-[12px]">
                            {formatDateTime(item.sent_at || item.created_at)}
                          </td>
                          <td className="px-[18px] py-[13px]">
                            <StatusBadge tone={tone}>{label}</StatusBadge>
                          </td>
                          <td className="px-[18px] py-[13px] text-right">
                            {item.status === 'failed' ? (
                              <button onClick={() => retry(item)} className={smallButtonClass}>
                                Retry
                              </button>
                            ) : null}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </DataState>
        </section>

        <section className="h-fit overflow-hidden rounded-[10px] border border-[var(--line)] bg-white">
          <div className="flex items-center justify-between border-b border-[var(--line)] px-[18px] py-4">
            <h3 className="text-[12px] font-bold">Templates</h3>

            <button
              onClick={() => setTemplateForm({})}
              className="inline-flex items-center gap-2 rounded-[8px] border border-[var(--line)] bg-white px-3 py-2 text-[11px] font-bold"
            >
              <Plus size={14} />
              Create template
            </button>
          </div>

          <DataState
            state={templatesState}
            loadingLabel="Loading templates..."
            isEmpty={(data) => !data.length}
            empty={
              <EmptyState
                title="No templates"
                message="Create a template for messages you send often, such as a balance reminder."
              />
            }
          >
            {() => (
              <div className="space-y-[10px] p-[18px]">
                {templates.map((template) => (
                  <div
                    key={template.id}
                    className="rounded-[8px] border border-[var(--line)] border-l-2 border-l-[var(--accent-soft-line)] bg-white p-4"
                  >
                    <h4 className="text-[13px] font-bold">{template.name}</h4>
                    <p className="font-mono mt-[7px] text-[10px] leading-[1.6] text-[var(--ink-faint)]">
                      {template.body}
                    </p>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <button onClick={() => setBroadcast({ template })} className={smallButtonClass}>
                        Use
                      </button>
                      <button onClick={() => setTemplateForm({ template })} className={smallButtonClass}>
                        Edit
                      </button>
                      <button
                        onClick={() => setDeletingTemplate(template)}
                        className="rounded-[8px] border border-red-500 bg-white px-3 py-2 text-[11px] font-bold text-red-600"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}

                <p className="text-[10px] leading-[1.5] text-[var(--ink-faint)]">
                  Templates use placeholders like {'{name}'} and {'{balance}'}.
                  Kodi fills these in per tenant automatically when the broadcast is sent.
                </p>
              </div>
            )}
          </DataState>
        </section>
      </div>

      {broadcast ? (
        <BroadcastModal
          templates={templates}
          selectedTemplate={broadcast.template}
          properties={properties}
          onClose={() => setBroadcast(null)}
          onDone={reloadAfterSending}
        />
      ) : null}

      {templateForm ? (
        <TemplateModal
          template={templateForm.template}
          onClose={() => setTemplateForm(null)}
          onDone={templatesState.reload}
        />
      ) : null}

      <ConfirmDeleteModal
        open={Boolean(deletingTemplate)}
        title="Delete SMS template"
        message={`"${deletingTemplate?.name || 'This template'}" will be deleted. Messages already sent or scheduled with it are not affected.`}
        confirmLabel="Delete template"
        onClose={() => setDeletingTemplate(null)}
        onConfirm={async () => {
          await deleteSmsTemplate(deletingTemplate.id)
          templatesState.reload()
        }}
      />

      <ConfirmDeleteModal
        open={Boolean(cancelling)}
        title="Cancel scheduled broadcast"
        message={`The broadcast scheduled for ${formatDateTime(cancelling?.scheduled_at)} will not be sent. It stays on record as cancelled.`}
        confirmLabel="Cancel broadcast"
        onClose={() => setCancelling(null)}
        onConfirm={async () => {
          await cancelSmsBroadcast(cancelling.id)
          reloadActivity()
        }}
      />
    </>
  )
}

function BroadcastModal({ templates, selectedTemplate, properties, onClose, onDone }) {
  const [form, setForm] = useState({
    template_id: selectedTemplate ? String(selectedTemplate.id) : '',
    message: selectedTemplate?.body || '',
    send_to: 'all_active_tenants',
    when: 'now',
    date: toDateInput(),
    time: '08:00',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  // Every current tenant is listed, so a message can go to one person.
  const tenantsState = useApi('tenants', () => listTenants())
  const sendToOptions = [
    ...RECIPIENT_GROUPS.map(([value, label]) => ({ value, label, group: 'Groups' })),
    ...properties.map((property) => ({
      value: `property:${property.id}`,
      label: `Everyone in ${property.name}`,
      group: 'One property',
    })),
    ...(tenantsState.data || []).filter(isCurrentTenant).map((tenant) => ({
      value: `tenant:${tenant.id}`,
      label: tenant.full_name,
      hint: `${tenant.property_name} · House ${tenant.unit_number}`,
      group: 'One tenant',
    })),
  ]

  const target = recipientTarget(form.send_to)
  const estimateState = useApi(`sms-estimate-${form.send_to}`, () => estimateSmsRecipients(target))
  const estimate = estimateState.data
  const parts = smsParts(form.message)
  const later = form.when === 'later'

  function setField(field) {
    return (event) => setForm((current) => ({ ...current, [field]: event.target.value }))
  }

  // Picking a template puts its text in the message box, where it can still be edited.
  function chooseTemplate(event) {
    const template = templates.find((item) => String(item.id) === event.target.value)

    setForm((current) => ({
      ...current,
      template_id: event.target.value,
      message: template ? template.body : current.message,
    }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError(null)

    const sendAt = later ? new Date(`${form.date}T${form.time}`) : null

    if (later && !(sendAt > new Date())) {
      setError({ message: 'Choose a date and time in the future.' })
      return
    }

    setSaving(true)

    try {
      await createSmsBroadcast({
        ...target,
        ...(form.template_id ? { template_id: Number(form.template_id) } : {}),
        message: form.message.trim(),
        ...(sendAt ? { send_at: sendAt.toISOString() } : {}),
      })

      onDone()
      onClose()
    } catch (saveError) {
      setError(saveError)
      setSaving(false)
    }
  }

  return (
    <ModalShell title="New broadcast" onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-hidden">
        <ModalBody>
          <div className="grid gap-[18px]">
            <div>
              <SelectField
                label="Template"
                value={form.template_id}
                onChange={chooseTemplate}
                options={[
                  ['', 'Write a custom message...'],
                  ...templates.map((template) => [String(template.id), template.name]),
                ]}
              />
              <p className="mt-2 text-[10px] leading-[1.5] text-[var(--ink-faint)]">
                Pick a saved template or write your own below. You can edit
                the text either way; the template itself is not changed.
              </p>
            </div>

            <div>
              <label className={labelClass}>Message</label>
              <textarea
                value={form.message}
                onChange={setField('message')}
                placeholder="Type your message... use {name}, {house}, {balance}, {due_date} as placeholders"
                rows={4}
                maxLength={1000}
                required
                className={textareaClass}
              />
              <p className="mt-2 text-[10px] leading-[1.5] text-[var(--ink-faint)]">
                Placeholders filled in per tenant: {PLACEHOLDERS}.{' '}
                {form.message.length} characters, about {parts} SMS per tenant
                before the placeholders are filled in.
              </p>
            </div>

            <div>
              <SearchableSelect
                label="Send to"
                value={form.send_to}
                onChange={(value) => setForm((current) => ({ ...current, send_to: value }))}
                options={sendToOptions}
                placeholder="Search a group, property or tenant..."
              />
              <p className="mt-2 text-[10px] leading-[1.5] text-[var(--ink-faint)]">
                Click to search. Choose a group, everyone in one property, or
                a single tenant by name or house number.
                {tenantsState.loading ? ' Loading tenants...' : ''}
              </p>
            </div>

            <div>
              <label className={labelClass}>When</label>

              <div className="flex flex-wrap gap-5 text-[12px] text-[var(--ink)]">
                {[
                  ['now', 'Send now'],
                  ['later', 'Schedule for later'],
                ].map(([value, label]) => (
                  <label key={value} className="inline-flex items-center gap-2">
                    <input
                      type="radio"
                      name="when"
                      checked={form.when === value}
                      onChange={() => setForm((current) => ({ ...current, when: value }))}
                    />
                    {label}
                  </label>
                ))}
              </div>
            </div>

            {later ? (
              <div>
                <div className="grid gap-[14px] sm:grid-cols-2">
                  <Field
                    label="Date"
                    type="date"
                    min={toDateInput()}
                    value={form.date}
                    onChange={setField('date')}
                    required
                  />
                  <Field label="Time" type="time" value={form.time} onChange={setField('time')} required />
                </div>

                <p className="mt-2 text-[10px] leading-[1.5] text-[var(--ink-faint)]">
                  The broadcast is sent automatically at this date and time.
                  Who receives it, and each tenant&apos;s balance, is worked
                  out then, not now. You can cancel it from the SMS centre
                  until it is sent.
                </p>
              </div>
            ) : null}

            <div className="rounded-[8px] border border-[var(--line)] border-l-2 border-l-[var(--accent-soft-line)] bg-white px-4 py-4">
              <h3 className="text-[14px] font-bold text-[var(--ink)]">Estimated reach</h3>
              <p className="mt-1 text-[11px] leading-[1.5] text-[var(--ink-faint)]">
                {estimate
                  ? `${estimate.recipient_count} ${estimate.recipient_count === 1 ? 'tenant' : 'tenants'}${later ? ' as of now' : ''} - approx. cost ${formatKES(estimate.recipient_count * parts * estimate.cost_per_message)} at ${formatKES(estimate.cost_per_message)}/SMS`
                  : estimateState.error
                    ? estimateState.error.message
                    : 'Working out who will receive this...'}
              </p>
            </div>
          </div>

          {error ? (
            <div className="mt-[14px]">
              <FormError error={error} />
            </div>
          ) : null}
        </ModalBody>

        <ModalFooter>
          <button type="button" onClick={onClose} className={secondaryButtonClass}>
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving || (!later && estimate?.recipient_count === 0)}
            className={primaryButtonClass}
          >
            {saving ? 'Sending...' : later ? 'Schedule broadcast' : 'Send broadcast'}
          </button>
        </ModalFooter>
      </form>
    </ModalShell>
  )
}

// Creates a template, or edits one when `template` is passed.
function TemplateModal({ template, onClose, onDone }) {
  const [form, setForm] = useState({ name: template?.name || '', body: template?.body || '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  function setField(field) {
    return (event) => setForm((current) => ({ ...current, [field]: event.target.value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setSaving(true)
    setError(null)

    const body = { name: form.name.trim(), body: form.body.trim() }

    try {
      if (template) await updateSmsTemplate(template.id, body)
      else await createSmsTemplate(body)

      onDone()
      onClose()
    } catch (saveError) {
      setError(saveError)
      setSaving(false)
    }
  }

  return (
    <ModalShell title={template ? `Edit SMS template - ${template.name}` : 'Create SMS template'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-hidden">
        <ModalBody>
          <div className="grid gap-[18px]">
            <Field
              label="Template name"
              placeholder="e.g. Water bill reminder"
              value={form.name}
              onChange={setField('name')}
              required
              minLength={2}
              maxLength={120}
            />

            <div>
              <label className={labelClass}>Message text</label>
              <textarea
                value={form.body}
                onChange={setField('body')}
                placeholder="Dear {name}, your water bill for {house} is KES {balance}..."
                rows={5}
                maxLength={1000}
                required
                className={textareaClass}
              />
              <p className="mt-2 text-[10px] leading-[1.5] text-[var(--ink-faint)]">
                Available placeholders: {PLACEHOLDERS}. Each fills in
                automatically per tenant when a broadcast is sent.
                {template ? ' Broadcasts already sent or scheduled keep the old text.' : ''}
              </p>
            </div>
          </div>

          {error ? (
            <div className="mt-[14px]">
              <FormError error={error} />
            </div>
          ) : null}
        </ModalBody>

        <ModalFooter>
          <button type="button" onClick={onClose} className={secondaryButtonClass}>
            Cancel
          </button>
          <button type="submit" disabled={saving} className={primaryButtonClass}>
            {saving ? 'Saving...' : 'Save template'}
          </button>
        </ModalFooter>
      </form>
    </ModalShell>
  )
}

export default SmsCentrePage
