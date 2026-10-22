import { useState } from 'react'
import { Plus } from 'lucide-react'
import {
  assignCaretaker,
  getCaretaker,
  listCaretakers,
  updateCaretaker,
  updatePropertyCaretaker,
} from '../../api/caretakers'
import { DataState, EmptyState, FormError } from '../../components/common/DataState'
import {
  Field,
  ModalBody,
  ModalFooter,
  ModalShell,
  SelectField,
  inputClass,
  primaryButtonClass,
  secondaryButtonClass,
} from '../../components/common/Modal'
import StatusBadge from '../../components/common/StatusBadge'
import ConfirmDeleteModal from '../../components/dashboard/ConfirmDeleteModal'
import { useProperties } from '../../context/PropertiesContext'
import { useApi } from '../../hooks/useApi'
import { formatPhone } from '../../utils/format'
import CaretakerPermissions from '../../components/dashboard/CaretakerPermissions'
import {
  DEFAULT_CARETAKER_PERMISSIONS,
  permissionSummary,
  samePermissions,
} from '../../utils/labels'

const smallButtonClass =
  'rounded-[8px] border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-[11px] font-bold transition hover:border-[var(--accent-soft-line)] hover:text-[var(--accent-ink)]'

const sectionTitleClass = 'text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--accent-ink)]'

/*
  The API returns one row per caretaker-and-property, past ones included.
  -> one entry per caretaker, with the properties they look after now.
*/
function groupCaretakers(rows) {
  const caretakers = new Map()

  for (const row of rows) {
    if (!caretakers.has(row.caretaker_id)) {
      caretakers.set(row.caretaker_id, {
        caretaker_id: row.caretaker_id,
        first_name: row.first_name,
        last_name: row.last_name,
        full_name: row.full_name,
        phone: row.phone,
        user_status: row.user_status,
        assignments: [],
      })
    }

    if (row.assignment_status === 'active') {
      caretakers.get(row.caretaker_id).assignments.push({
        property_id: row.property_id,
        property_name: row.property_name,
        permissions: row.permissions || DEFAULT_CARETAKER_PERMISSIONS,
      })
    }
  }

  const order = { active: 0, suspended: 1, inactive: 2 }

  return [...caretakers.values()].sort(
    (first, second) =>
      order[caretakerStatus(first).key] - order[caretakerStatus(second).key] ||
      first.full_name.localeCompare(second.full_name)
  )
}

// -> { key, label, tone } for a StatusBadge
function caretakerStatus(caretaker) {
  if (caretaker.user_status === 'suspended') {
    return { key: 'suspended', label: 'Suspended', tone: 'warning' }
  }

  return caretaker.assignments.length && caretaker.user_status === 'active'
    ? { key: 'active', label: 'Active', tone: 'success' }
    : { key: 'inactive', label: 'Inactive', tone: 'neutral' }
}

// "Green View Apartments - currently: Peter Mwangi"
function propertyOption(property) {
  return [
    String(property.id),
    property.caretaker
      ? `${property.name} - currently: ${property.caretaker.full_name}`
      : `${property.name} - no caretaker`,
  ]
}

function CaretakersPage() {
  const propertiesState = useProperties()
  const properties = propertiesState.data || []
  const caretakersState = useApi('caretakers', listCaretakers)
  const [addOpen, setAddOpen] = useState(false)
  const [managingId, setManagingId] = useState(null)

  // With one property chosen in the top bar, only the caretakers looking after it.
  const caretakers = groupCaretakers(caretakersState.data || []).filter(
    (caretaker) =>
      !propertiesState.selectedId ||
      caretaker.assignments.some((item) => String(item.property_id) === propertiesState.selectedId)
  )
  // Looked up again after every reload, so the Manage modal always shows fresh data.
  const managing = caretakers.find((caretaker) => caretaker.caretaker_id === managingId)

  function reloadAll() {
    caretakersState.reload()
    // Property cards and forms show each property's caretaker.
    propertiesState.reload()
  }

  return (
    <>
      <div className="mb-7 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-[10px] text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--accent-ink)]">
            Operations
          </div>
          <h1 className="font-display text-[20px] font-semibold tracking-[-0.01em]">
            Caretakers
          </h1>
          <p className="mt-2 text-[12px] text-[var(--ink-soft)]">
            Manage caretaker accounts and what they can access.
          </p>
        </div>

        <button
          onClick={() => setAddOpen(true)}
          disabled={!properties.length}
          className="inline-flex items-center gap-2 rounded-[8px] border border-[var(--accent)] bg-[var(--accent)] px-4 py-[10px] text-[12px] font-bold text-white disabled:opacity-50"
        >
          <Plus size={15} />
          Add caretaker
        </button>
      </div>

      <section className="overflow-hidden rounded-[10px] border border-[var(--line)] bg-[var(--surface)]">
        <DataState
          state={caretakersState}
          loadingLabel="Loading caretakers..."
          isEmpty={() => !caretakers.length}
          empty={
            <EmptyState
              title={propertiesState.selected ? `No caretaker at ${propertiesState.selected.name}` : 'No caretakers yet'}
              message="Add a caretaker to a property so they can submit meter readings, report maintenance and record expenses for it."
            />
          }
        >
          {() => (
            <div className="overflow-x-auto">
              <table className="min-w-[880px] w-full border-collapse">
                <thead>
                  <tr className="bg-[var(--bg)] text-left text-[9px] uppercase tracking-[0.05em] text-[var(--ink-faint)]">
                    <th className="px-[18px] py-[10px] font-bold">Caretaker</th>
                    <th className="px-[18px] py-[10px] font-bold">Assigned properties</th>
                    <th className="px-[18px] py-[10px] font-bold">Status</th>
                    <th className="px-[18px] py-[10px] font-bold"></th>
                  </tr>
                </thead>
                <tbody>
                  {caretakers.map((caretaker) => {
                    const status = caretakerStatus(caretaker)

                    return (
                      <tr
                        key={caretaker.caretaker_id}
                        className="border-b border-[var(--line-soft)] align-top last:border-b-0"
                      >
                        <td className="px-[18px] py-[13px]">
                          <div className="text-[12px] font-bold">{caretaker.full_name}</div>
                          <div className="mt-[3px] text-[10px] text-[var(--ink-faint)]">
                            {formatPhone(caretaker.phone)}
                          </div>
                        </td>

                        <td className="px-[18px] py-[13px] text-[12px]">
                          {caretaker.assignments.length ? (
                            <div className="space-y-[6px]">
                              {caretaker.assignments.map((assignment) => (
                                <div key={assignment.property_id} className="flex flex-wrap items-center gap-2">
                                  <span>{assignment.property_name}</span>
                                  <span className="text-[10px] text-[var(--ink-faint)]">
                                    {permissionSummary(assignment.permissions)}
                                  </span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <span className="text-[var(--ink-faint)]">Not assigned to a property</span>
                          )}
                        </td>

                        <td className="px-[18px] py-[13px]">
                          <StatusBadge tone={status.tone}>{status.label}</StatusBadge>
                        </td>

                        <td className="px-[18px] py-[13px] text-right">
                          <button
                            onClick={() => setManagingId(caretaker.caretaker_id)}
                            className={smallButtonClass}
                          >
                            Manage
                          </button>
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

      {addOpen ? (
        <AddCaretakerModal
          properties={properties}
          onClose={() => setAddOpen(false)}
          onDone={reloadAll}
        />
      ) : null}

      {managing ? (
        <ManageCaretakerModal
          key={managing.caretaker_id}
          caretaker={managing}
          properties={properties}
          onClose={() => setManagingId(null)}
          onChanged={reloadAll}
        />
      ) : null}
    </>
  )
}

// Shown wherever assigning would take a property away from its current caretaker.
function ReplaceWarning({ property, caretakerId }) {
  const current = property?.caretaker

  if (!current || current.caretaker_id === caretakerId) return null

  return (
    <div className="rounded-[8px] border border-[var(--line)] bg-[var(--surface)] px-4 py-4">
      <h3 className="text-[13px] font-bold text-[var(--warning)]">This will replace the current caretaker</h3>
      <p className="mt-1 text-[11px] leading-[1.5] text-[var(--ink-faint)]">
        Every property has one caretaker. {current.full_name} will lose access
        to {property.name} as soon as you save.
      </p>
    </div>
  )
}

function AddCaretakerModal({ properties, onClose, onDone }) {
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    property_id: String(properties[0]?.id || ''),
    permissions: DEFAULT_CARETAKER_PERMISSIONS,
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  const property = properties.find((item) => String(item.id) === form.property_id)

  function setField(field) {
    return (event) => setForm((current) => ({ ...current, [field]: event.target.value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setSaving(true)
    setError(null)

    try {
      await assignCaretaker(form.property_id, {
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        phone: form.phone.replace(/\s/g, ''),
        permissions: form.permissions,
      })

      onDone()
      onClose()
    } catch (saveError) {
      setError(saveError)
      setSaving(false)
    }
  }

  return (
    <ModalShell title="Add caretaker" onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-hidden">
        <ModalBody>
          <div className="grid gap-[14px] sm:grid-cols-2">
            <Field
              label="First name"
              placeholder="e.g. Ruth"
              value={form.first_name}
              onChange={setField('first_name')}
              required
              minLength={2}
            />
            <Field
              label="Last name"
              placeholder="e.g. Chebet"
              value={form.last_name}
              onChange={setField('last_name')}
              required
              minLength={2}
            />

            <div className="sm:col-span-2">
              <Field
                label="Phone number"
                placeholder="e.g. 0733 908 771"
                inputMode="tel"
                value={form.phone}
                onChange={setField('phone')}
                required
                hint="The caretaker signs in with this number and a one-time code - no password to set up."
              />
            </div>

            <div className="sm:col-span-2">
              <SelectField
                label="Assigned property"
                value={form.property_id}
                onChange={setField('property_id')}
                options={properties.map(propertyOption)}
              />
            </div>

            <div className="sm:col-span-2">
              <CaretakerPermissions
                value={form.permissions}
                onChange={(permissions) => setForm((current) => ({ ...current, permissions }))}
              />
            </div>
          </div>

          <div className="mt-[18px]">
            <ReplaceWarning property={property} />
          </div>

          <p className="mt-3 text-[11px] leading-[1.5] text-[var(--ink-faint)]">
            To put a caretaker you already have on another property, open
            Manage on that caretaker instead.
          </p>

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
            {saving ? 'Adding...' : 'Add caretaker'}
          </button>
        </ModalFooter>
      </form>
    </ModalShell>
  )
}

function ManageCaretakerModal({ caretaker, properties, onClose, onChanged }) {
  const detailState = useApi(`caretaker-${caretaker.caretaker_id}`, () =>
    getCaretaker(caretaker.caretaker_id)
  )
  const suspended = caretaker.user_status === 'suspended'

  const [form, setForm] = useState({
    first_name: caretaker.first_name || '',
    last_name: caretaker.last_name || '',
    phone: formatPhone(caretaker.phone, ''),
    status: suspended ? 'suspended' : 'active',
  })
  // property id -> the switches, for the properties whose switches were changed.
  const [permissions, setPermissions] = useState({})
  const [another, setAnother] = useState({ property_id: '' })
  const [removing, setRemoving] = useState(null)
  // 'save' | 'assign' while a request is running.
  const [working, setWorking] = useState(null)
  const [error, setError] = useState(null)

  const assignedIds = caretaker.assignments.map((assignment) => assignment.property_id)
  const otherProperties = properties.filter((property) => !assignedIds.includes(property.id))
  const anotherProperty = properties.find((property) => String(property.id) === another.property_id)
  const activity = detailState.data?.activity_last_30_days

  function setField(field) {
    return (event) => setForm((current) => ({ ...current, [field]: event.target.value }))
  }

  async function handleSave(event) {
    event.preventDefault()
    setWorking('save')
    setError(null)

    const phone = form.phone.replace(/\s/g, '')
    const details = {
      ...(form.first_name.trim() !== (caretaker.first_name || '')
        ? { first_name: form.first_name.trim() }
        : {}),
      ...(form.last_name.trim() !== (caretaker.last_name || '')
        ? { last_name: form.last_name.trim() }
        : {}),
      ...(phone !== formatPhone(caretaker.phone, '').replace(/\s/g, '') ? { phone } : {}),
      ...(form.status !== (suspended ? 'suspended' : 'active') ? { status: form.status } : {}),
    }

    try {
      if (Object.keys(details).length) await updateCaretaker(caretaker.caretaker_id, details)

      for (const assignment of caretaker.assignments) {
        const changed = permissions[assignment.property_id]

        if (changed && !samePermissions(changed, assignment.permissions)) {
          await updatePropertyCaretaker(assignment.property_id, { permissions: changed })
        }
      }

      onChanged()
      onClose()
    } catch (saveError) {
      onChanged()
      setError(saveError)
      setWorking(null)
    }
  }

  async function assignAnother() {
    setWorking('assign')
    setError(null)

    try {
      await assignCaretaker(another.property_id, {
        first_name: caretaker.first_name,
        last_name: caretaker.last_name,
        phone: caretaker.phone,
      })

      setAnother({ property_id: '' })
      onChanged()
    } catch (assignError) {
      setError(assignError)
    } finally {
      setWorking(null)
    }
  }

  async function removeFromProperty() {
    await updatePropertyCaretaker(removing.property_id, { status: 'inactive' })
    onChanged()
  }

  return (
    <ModalShell title={`Manage caretaker - ${caretaker.full_name}`} onClose={onClose}>
      <form onSubmit={handleSave} className="flex flex-1 flex-col overflow-hidden">
        <ModalBody>
          <div className="grid gap-[14px] sm:grid-cols-2">
            <Field
              label="First name"
              value={form.first_name}
              onChange={setField('first_name')}
              required
              minLength={2}
            />
            <Field
              label="Last name"
              value={form.last_name}
              onChange={setField('last_name')}
              required
              minLength={2}
            />
            <Field
              label="Phone number"
              inputMode="tel"
              value={form.phone}
              onChange={setField('phone')}
              required
              hint="This is the number they sign in with. Changing it signs them out."
            />
            <SelectField
              label="Sign-in"
              value={form.status}
              onChange={setField('status')}
              options={[
                ['active', 'Active'],
                ['suspended', 'Suspended - cannot sign in'],
              ]}
            />
          </div>

          <p className="mt-2 text-[10px] leading-[1.5] text-[var(--ink-faint)]">
            {form.status === 'suspended'
              ? 'A suspended caretaker cannot sign in, but keeps the properties below. Set them back to Active to restore access.'
              : caretaker.assignments.length
                ? 'An active caretaker can sign in and work on the properties below.'
                : 'This caretaker is not on any property, so they cannot sign in until you assign one below.'}
          </p>

          <div className="mb-[10px] mt-[22px] flex items-center gap-3">
            <div className={sectionTitleClass}>Assigned properties</div>
            <div className="h-px flex-1 bg-[var(--line)]" />
          </div>

          {caretaker.assignments.length ? (
            <div className="grid gap-[10px]">
              {caretaker.assignments.map((assignment) => (
                <div key={assignment.property_id} className="flex flex-wrap items-center gap-3">
                  <span className="min-w-[150px] flex-1 text-[12px] font-bold">
                    {assignment.property_name}
                  </span>
                  <button
                    type="button"
                    onClick={() => setRemoving(assignment)}
                    className="rounded-[8px] border border-[var(--danger)] bg-[var(--surface)] px-3 py-2 text-[11px] font-bold text-[var(--danger)]"
                  >
                    Remove
                  </button>

                  <div className="w-full basis-full">
                    <CaretakerPermissions
                      value={permissions[assignment.property_id] || assignment.permissions}
                      onChange={(next) =>
                        setPermissions((current) => ({ ...current, [assignment.property_id]: next }))
                      }
                      propertyName={assignment.property_name}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[11px] text-[var(--ink-faint)]">Not assigned to any property.</p>
          )}

          {otherProperties.length ? (
            <div className="mt-[14px] rounded-[8px] border border-[var(--line)] bg-[var(--surface)] px-4 py-4">
              <div className="mb-1 text-[12px] font-bold">Assign to another property</div>
              <p className="mb-3 text-[10px] leading-[1.5] text-[var(--ink-faint)]">
                They start with the day-to-day work (readings, electricity, maintenance, expenses,
                view tenants). Change it in the list above once assigned.
              </p>

              <div className="flex flex-wrap items-center gap-3">
                <select
                  value={another.property_id}
                  onChange={(event) =>
                    setAnother((current) => ({ ...current, property_id: event.target.value }))
                  }
                  aria-label="Property"
                  className={`${inputClass} min-w-[200px] flex-1`}
                >
                  <option value="">Choose a property</option>
                  {otherProperties.map((property) => {
                    const [value, label] = propertyOption(property)

                    return <option key={value} value={value}>{label}</option>
                  })}
                </select>
                <button
                  type="button"
                  onClick={assignAnother}
                  disabled={!another.property_id || Boolean(working)}
                  className={`${smallButtonClass} disabled:opacity-50`}
                >
                  {working === 'assign' ? 'Assigning...' : 'Assign'}
                </button>
              </div>

              {anotherProperty?.caretaker ? (
                <div className="mt-3">
                  <ReplaceWarning property={anotherProperty} caretakerId={caretaker.caretaker_id} />
                </div>
              ) : null}
            </div>
          ) : null}

          <p className="mt-[18px] text-[11px] leading-[1.5] text-[var(--ink-faint)]">
            {activity
              ? `Recent activity: ${activity.water_readings} water ${activity.water_readings === 1 ? 'reading' : 'readings'}, ${activity.maintenance_reports} maintenance ${activity.maintenance_reports === 1 ? 'report' : 'reports'} and ${activity.expenses_recorded} ${activity.expenses_recorded === 1 ? 'expense' : 'expenses'} submitted in the last 30 days.`
              : detailState.error
                ? 'Recent activity could not be loaded.'
                : 'Loading recent activity...'}
          </p>

          {error ? (
            <div className="mt-[14px]">
              <FormError error={error} />
            </div>
          ) : null}
        </ModalBody>

        <ModalFooter>
          <button type="button" onClick={onClose} className={secondaryButtonClass}>
            Close
          </button>
          <button type="submit" disabled={Boolean(working)} className={primaryButtonClass}>
            {working === 'save' ? 'Saving...' : 'Save changes'}
          </button>
        </ModalFooter>
      </form>

      <ConfirmDeleteModal
        open={Boolean(removing)}
        title="Remove caretaker from property"
        message={`${caretaker.full_name} will lose access to ${removing?.property_name || 'this property'} immediately. Readings and reports they already submitted stay on record, and the property will have no caretaker until you assign one.${caretaker.assignments.length === 1 ? ' This is their last property, so they will no longer be able to sign in.' : ''}`}
        confirmLabel="Remove caretaker"
        onClose={() => setRemoving(null)}
        onConfirm={removeFromProperty}
      />
    </ModalShell>
  )
}

export default CaretakersPage
