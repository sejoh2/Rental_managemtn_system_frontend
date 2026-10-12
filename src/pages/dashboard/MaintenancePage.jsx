import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Plus } from 'lucide-react'
import {
  listMaintenance,
  reportMaintenance,
  sendRepairChargeSms,
  updateMaintenance,
} from '../../api/maintenance'
import { listUnits } from '../../api/units'
import { DataState, EmptyState, FormError } from '../../components/common/DataState'
import {
  Field,
  ModalBody,
  ModalFooter,
  ModalShell,
  SelectField,
  primaryButtonClass,
  secondaryButtonClass,
} from '../../components/common/Modal'
import StatusBadge from '../../components/common/StatusBadge'
import { useProperties } from '../../context/PropertiesContext'
import { useApi } from '../../hooks/useApi'
import { formatDate, formatDateTime, formatKES } from '../../utils/format'
import {
  MAINTENANCE_CATEGORIES,
  MAINTENANCE_PRIORITIES,
  MAINTENANCE_STATUSES,
  optionLabel,
} from '../../utils/labels'

const tabs = [['', 'All'], ...MAINTENANCE_STATUSES.filter(([value]) => value !== 'cancelled')]

const statusTones = {
  reported: 'danger',
  in_progress: 'warning',
  resolved: 'success',
  cancelled: 'neutral',
}

// The caretaker and / or outside worker on the job: "Peter Mwangi / Kamau Repairs"
function assignedTo(request) {
  return [(request.assigned_caretaker_name || '').trim(), request.assigned_vendor_name]
    .filter(Boolean)
    .join(' / ')
}

// "Test Apartment · reported by New User · 12 Oct 2026 · KES 2,500 · charged to tenant"
function requestSubtitle(request) {
  return [
    request.property_name,
    `reported by ${request.reporter_name || request.reporter_role}`,
    formatDate(request.created_at),
    assignedTo(request) ? `assigned to ${assignedTo(request)}` : null,
    request.actual_cost
      ? formatKES(request.actual_cost)
      : request.estimated_cost
        ? `est. ${formatKES(request.estimated_cost)}`
        : null,
    request.tenant_charge_id ? 'charged to tenant' : null,
  ]
    .filter(Boolean)
    .join(' · ')
}

function MaintenancePage() {
  const properties = useProperties().data || []
  const [searchParams, setSearchParams] = useSearchParams()
  const [reportOpen, setReportOpen] = useState(false)
  const [updating, setUpdating] = useState(null)

  // Filters live in the URL: /maintenance?property=1&status=reported
  const propertyId = searchParams.get('property') || ''
  const status = searchParams.get('status') || ''

  // Every status is loaded, so the tabs can show their counts.
  const requestsState = useApi(`maintenance-${propertyId || 'all'}`, () =>
    listMaintenance({ property_id: propertyId })
  )
  const requests = requestsState.data || []
  const shown = status ? requests.filter((request) => request.status === status) : requests

  function setParam(name, value) {
    const next = new URLSearchParams(searchParams)

    if (value) next.set(name, value)
    else next.delete(name)

    setSearchParams(next)
  }

  return (
    <>
      <div className="mb-7 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-[10px] text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--accent)]">
            Operations
          </div>
          <h1 className="font-display text-[20px] font-semibold tracking-[-0.01em]">
            Maintenance
          </h1>
          <p className="mt-2 text-[12px] text-[var(--ink-soft)]">
            Reports from caretakers and tenants, tracked to resolution.
          </p>
        </div>

        <div className="flex flex-wrap gap-[10px]">
          <select
            value={propertyId}
            onChange={(event) => setParam('property', event.target.value)}
            className="min-w-[200px] rounded-[8px] border border-[var(--line)] bg-white px-3 py-[10px] text-[12px] font-bold"
          >
            <option value="">All properties</option>
            {properties.map((property) => (
              <option key={property.id} value={property.id}>{property.name}</option>
            ))}
          </select>

          <button
            onClick={() => setReportOpen(true)}
            disabled={!properties.length}
            className="inline-flex items-center gap-2 rounded-[8px] border border-[var(--accent)] bg-[var(--accent)] px-4 py-[10px] text-[12px] font-bold text-white disabled:opacity-50"
          >
            <Plus size={15} />
            Report issue
          </button>
        </div>
      </div>

      <div className="mb-[18px] flex flex-wrap gap-7 border-b border-[var(--line)]">
        {tabs.map(([value, label]) => (
          <button
            key={label}
            onClick={() => setParam('status', value)}
            className={`pb-[12px] text-[11px] font-bold transition ${
              status === value
                ? 'border-b-2 border-[var(--accent)] text-[var(--accent)]'
                : 'text-[var(--ink-faint)] hover:text-[var(--accent)]'
            }`}
          >
            {label}
            {requestsState.data
              ? ` (${value ? requests.filter((request) => request.status === value).length : requests.length})`
              : ''}
          </button>
        ))}
      </div>

      <DataState
        state={requestsState}
        loadingLabel="Loading maintenance requests..."
        isEmpty={() => !shown.length}
        empty={
          <section className="rounded-[10px] border border-[var(--line)] bg-white">
            <EmptyState
              title={status ? `Nothing ${optionLabel(MAINTENANCE_STATUSES, status).toLowerCase()}` : 'No maintenance requests'}
              message="Report an issue to track it until it is resolved. When it is resolved with a cost, the cost is recorded as an expense."
            />
          </section>
        }
      >
        {() => (
          <div className="grid gap-[14px] xl:grid-cols-2">
            {shown.map((request) => (
              <article
                key={request.id}
                className="rounded-[8px] border border-[var(--line)] border-l-2 border-l-[var(--accent-soft-line)] bg-white px-5 py-4 transition hover:-translate-y-[1px] hover:shadow-[0_10px_24px_rgba(32,28,24,0.06)]"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-[14px] font-bold text-[var(--ink)]">
                      {request.title} - {request.unit_number ? `House ${request.unit_number}` : 'Common area'}
                    </h3>
                    <p className="mt-[5px] text-[11px] text-[var(--ink-faint)]">
                      {requestSubtitle(request)}
                    </p>
                  </div>
                  <StatusBadge tone={statusTones[request.status]}>
                    {optionLabel(MAINTENANCE_STATUSES, request.status)}
                  </StatusBadge>
                </div>

                <div className="mt-3 flex items-center justify-between gap-3">
                  <span className="text-[10px] uppercase tracking-[0.04em] text-[var(--ink-faint)]">
                    {optionLabel(MAINTENANCE_CATEGORIES, request.category)} ·{' '}
                    {optionLabel(MAINTENANCE_PRIORITIES, request.priority)} priority
                  </span>

                  <button
                    onClick={() => setUpdating(request)}
                    className="rounded-[8px] border border-[var(--line)] bg-white px-3 py-2 text-[11px] font-bold"
                  >
                    {request.status === 'resolved' || request.status === 'cancelled' ? 'View' : 'Update'}
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </DataState>

      {reportOpen ? (
        <ReportIssueModal
          properties={properties}
          defaultPropertyId={propertyId}
          onClose={() => setReportOpen(false)}
          onDone={requestsState.reload}
        />
      ) : null}

      {updating ? (
        <UpdateRequestModal
          request={updating}
          property={properties.find((property) => property.id === updating.property_id)}
          onClose={() => setUpdating(null)}
          onDone={requestsState.reload}
        />
      ) : null}
    </>
  )
}

function ReportIssueModal({ properties, defaultPropertyId, onClose, onDone }) {
  const [form, setForm] = useState({
    property_id: defaultPropertyId || String(properties[0]?.id || ''),
    unit_id: '',
    title: '',
    description: '',
    category: 'plumbing',
    priority: 'normal',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  const unitsState = useApi(form.property_id ? `units-${form.property_id}` : null, () =>
    listUnits(form.property_id)
  )

  function setField(field) {
    return (event) => setForm((current) => ({ ...current, [field]: event.target.value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setSaving(true)
    setError(null)

    try {
      await reportMaintenance(form.property_id, {
        unit_id: form.unit_id ? Number(form.unit_id) : null,
        title: form.title.trim(),
        description: form.description.trim() || null,
        category: form.category,
        priority: form.priority,
      })

      onDone()
      onClose()
    } catch (saveError) {
      setError(saveError)
      setSaving(false)
    }
  }

  return (
    <ModalShell title="Report maintenance issue" onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-hidden">
        <ModalBody>
          <div className="grid gap-[14px] sm:grid-cols-2">
            <SelectField
              label="Property"
              value={form.property_id}
              onChange={(event) =>
                setForm((current) => ({ ...current, property_id: event.target.value, unit_id: '' }))
              }
              options={properties.map((property) => [String(property.id), property.name])}
            />
            <SelectField
              label="Where"
              value={form.unit_id}
              onChange={setField('unit_id')}
              options={[
                ['', unitsState.loading ? 'Loading units...' : 'Common area (gate, compound, ...)'],
                ...(unitsState.data || []).map((unit) => [
                  String(unit.id),
                  `House ${unit.unit_number}${unit.current_tenant ? ` - ${unit.current_tenant.full_name}` : ''}`,
                ]),
              ]}
            />

            <div className="sm:col-span-2">
              <Field
                label="What is the issue"
                placeholder="e.g. Broken window"
                value={form.title}
                onChange={setField('title')}
                required
                minLength={3}
                maxLength={255}
              />
            </div>

            <SelectField
              label="Category"
              value={form.category}
              onChange={setField('category')}
              options={MAINTENANCE_CATEGORIES}
            />
            <SelectField
              label="Priority"
              value={form.priority}
              onChange={setField('priority')}
              options={MAINTENANCE_PRIORITIES}
            />

            <div className="sm:col-span-2">
              <Field
                label="Details (optional)"
                placeholder="e.g. Bedroom window, glass cracked"
                value={form.description}
                onChange={setField('description')}
              />
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
          <button type="submit" disabled={saving || !form.property_id} className={primaryButtonClass}>
            {saving ? 'Saving...' : 'Report issue'}
          </button>
        </ModalFooter>
      </form>
    </ModalShell>
  )
}

function UpdateRequestModal({ request, property, onClose, onDone }) {
  // A request can be given to the property's caretaker; one already assigned stays listed.
  const caretakerOptions = [
    ['', 'Not assigned to a caretaker'],
    ...(property?.caretaker
      ? [[String(property.caretaker.caretaker_id), property.caretaker.full_name]]
      : []),
    ...(request.assigned_caretaker_id &&
    request.assigned_caretaker_id !== property?.caretaker?.caretaker_id
      ? [[String(request.assigned_caretaker_id), (request.assigned_caretaker_name || '').trim()]]
      : []),
  ]

  // Once the cost is an expense it is fixed, and a closed request is read-only.
  const costRecorded = Boolean(request.expense_id)
  const closed = request.status === 'cancelled' || (request.status === 'resolved' && costRecorded)

  const [form, setForm] = useState({
    status: request.status,
    priority: request.priority,
    assigned_caretaker_id: request.assigned_caretaker_id ? String(request.assigned_caretaker_id) : '',
    assigned_vendor_name: request.assigned_vendor_name || '',
    estimated_cost: request.estimated_cost === null ? '' : String(request.estimated_cost),
    actual_cost: request.actual_cost === null ? '' : String(request.actual_cost),
    charge_to_tenant: request.charge_to_tenant,
    resolution_notes: request.resolution_notes || '',
    cancellation_reason: request.cancellation_reason || '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  // When the tenant was last sent an SMS about the charge; updated when "Send SMS" is clicked.
  const [smsSentAt, setSmsSentAt] = useState(request.charge_sms_sent_at)
  const [sendingSms, setSendingSms] = useState(false)

  async function sendSms() {
    setSendingSms(true)
    setError(null)

    try {
      const updated = await sendRepairChargeSms(request.id)

      setSmsSentAt(updated.charge_sms_sent_at)
      onDone()
    } catch (sendError) {
      setError(sendError)
    } finally {
      setSendingSms(false)
    }
  }

  const resolving = form.status === 'resolved'
  const cost = Number(form.actual_cost) || 0
  const canChargeTenant = Boolean(request.unit_id && request.unit_tenant_name)

  function setField(field) {
    return (event) => setForm((current) => ({ ...current, [field]: event.target.value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setSaving(true)
    setError(null)

    try {
      await updateMaintenance(request.id, {
        // Sent only when it changes, so the resolved date is not reset by a later edit.
        ...(form.status !== request.status ? { status: form.status } : {}),
        priority: form.priority,
        // Sent only when it changes: a caretaker since removed from the property cannot be re-sent.
        ...(form.assigned_caretaker_id !== String(request.assigned_caretaker_id || '')
          ? {
              assigned_caretaker_id: form.assigned_caretaker_id
                ? Number(form.assigned_caretaker_id)
                : null,
            }
          : {}),
        assigned_vendor_name: form.assigned_vendor_name.trim() || null,
        estimated_cost: form.estimated_cost === '' ? null : Number(form.estimated_cost),
        ...(costRecorded
          ? {}
          : {
              actual_cost: form.actual_cost === '' ? null : Number(form.actual_cost),
              charge_to_tenant: Boolean(canChargeTenant && form.charge_to_tenant),
            }),
        resolution_notes: form.resolution_notes.trim() || null,
        ...(form.status === 'cancelled'
          ? { cancellation_reason: form.cancellation_reason.trim() }
          : {}),
      })

      onDone()
      onClose()
    } catch (saveError) {
      setError(saveError)
      setSaving(false)
    }
  }

  return (
    <ModalShell
      title={`${request.title} - ${request.unit_number ? `House ${request.unit_number}` : 'Common area'}`}
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-hidden">
        <ModalBody>
          <p className="mb-[18px] text-[11px] leading-[1.5] text-[var(--ink-faint)]">
            {requestSubtitle(request)}
            {request.description ? ` - ${request.description}` : ''}
          </p>

          <div className="grid gap-[14px] sm:grid-cols-2">
            <SelectField
              label="Status"
              value={form.status}
              onChange={setField('status')}
              options={MAINTENANCE_STATUSES}
              disabled={closed}
            />
            <SelectField
              label="Priority"
              value={form.priority}
              onChange={setField('priority')}
              options={MAINTENANCE_PRIORITIES}
              disabled={closed}
            />

            <div className="sm:col-span-2">
              <SelectField
                label="Assigned caretaker"
                value={form.assigned_caretaker_id}
                onChange={setField('assigned_caretaker_id')}
                options={caretakerOptions}
                disabled={closed}
              />
            </div>

            <Field
              label="Outside worker (optional)"
              placeholder="e.g. Kamau Repairs"
              value={form.assigned_vendor_name}
              onChange={setField('assigned_vendor_name')}
              disabled={closed}
            />
            <Field
              label="Estimated cost (KES, optional)"
              type="number"
              min="0"
              step="any"
              value={form.estimated_cost}
              onChange={setField('estimated_cost')}
              disabled={closed}
            />

            {form.status === 'cancelled' ? (
              <div className="sm:col-span-2">
                <Field
                  label="Why is it cancelled"
                  value={form.cancellation_reason}
                  onChange={setField('cancellation_reason')}
                  required
                  minLength={2}
                  disabled={closed}
                />
              </div>
            ) : null}

            {resolving ? (
              <>
                <Field
                  label="Actual cost (KES)"
                  placeholder="Leave empty if it cost nothing"
                  type="number"
                  min="0"
                  step="any"
                  value={form.actual_cost}
                  onChange={setField('actual_cost')}
                  disabled={costRecorded}
                />
                <Field
                  label="Resolution notes (optional)"
                  placeholder="e.g. Glass replaced"
                  value={form.resolution_notes}
                  onChange={setField('resolution_notes')}
                />
              </>
            ) : null}
          </div>

          {resolving ? (
            <div className="mt-[18px] rounded-[8px] border border-[var(--line)] border-l-2 border-l-[var(--accent-soft-line)] bg-white px-4 py-4">
              {canChargeTenant ? (
                <label className={`flex items-start gap-3 ${costRecorded ? '' : 'cursor-pointer'}`}>
                  <input
                    type="checkbox"
                    checked={Boolean(form.charge_to_tenant)}
                    disabled={costRecorded}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, charge_to_tenant: event.target.checked }))
                    }
                    className="mt-[2px] h-4 w-4 accent-[var(--accent)]"
                  />
                  <span>
                    <span className="block text-[11px] font-bold text-[var(--ink)]">
                      Charge this cost to the tenant ({request.unit_tenant_name})
                    </span>
                    <span className="mt-1 block text-[11px] leading-[1.5] text-[var(--ink-faint)]">
                      Tick this when the tenant caused the damage. Leave it
                      unticked for normal wear, which is your cost.
                    </span>
                  </span>
                </label>
              ) : (
                <p className="text-[11px] leading-[1.5] text-[var(--ink-faint)]">
                  {request.unit_id
                    ? 'No tenant lives in this unit now, so the cost cannot be charged to a tenant.'
                    : 'This is a common-area repair, so the cost is yours and cannot be charged to a tenant.'}
                </p>
              )}

              <p className="mt-3 text-[11px] leading-[1.6] text-[var(--ink-soft)]">
                {costRecorded ? (
                  <>
                    <strong>{formatKES(request.actual_cost)} was recorded as an expense</strong>
                    {request.tenant_charge_id ? ' and charged to the tenant.' : '.'}{' '}
                    The cost can no longer be changed here.
                  </>
                ) : cost > 0 ? (
                  <>
                    <strong>When you save:</strong> {formatKES(cost)} is recorded as a
                    repairs expense for {request.property_name}.{' '}
                    {canChargeTenant && form.charge_to_tenant
                      ? `${request.unit_tenant_name} is also charged ${formatKES(cost)}. They can pay it during their stay; anything unpaid is deducted from their deposit at move-out. No SMS is sent automatically: open this request again and click "Send SMS" to tell them.`
                      : 'The tenant is not charged.'}{' '}
                    The cost cannot be changed afterwards.
                  </>
                ) : (
                  'Enter the actual cost to record it as an expense. Without a cost, nothing is recorded in Expenses.'
                )}
              </p>

              {request.tenant_charge_id ? (
                <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--line-soft)] pt-3">
                  <p className="text-[11px] leading-[1.5] text-[var(--ink-faint)]">
                    {smsSentAt
                      ? `SMS about this charge sent to the tenant on ${formatDateTime(smsSentAt)}.`
                      : 'The tenant has not been sent an SMS about this charge.'}
                  </p>
                  <button
                    type="button"
                    onClick={sendSms}
                    disabled={sendingSms}
                    className="rounded-[8px] border border-[var(--line)] bg-white px-3 py-2 text-[11px] font-bold disabled:opacity-50"
                  >
                    {sendingSms ? 'Sending...' : smsSentAt ? 'Send SMS again' : 'Send SMS'}
                  </button>
                </div>
              ) : null}
            </div>
          ) : null}

          {error ? (
            <div className="mt-[14px]">
              <FormError error={error} />
            </div>
          ) : null}
        </ModalBody>

        <ModalFooter>
          <button type="button" onClick={onClose} className={secondaryButtonClass}>
            {closed ? 'Close' : 'Cancel'}
          </button>
          {closed ? null : (
            <button type="submit" disabled={saving} className={primaryButtonClass}>
              {saving ? 'Saving...' : 'Save'}
            </button>
          )}
        </ModalFooter>
      </form>
    </ModalShell>
  )
}

export default MaintenancePage
