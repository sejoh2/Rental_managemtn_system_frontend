import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Camera, Plus, Settings } from 'lucide-react'
import { listUnits } from '../../api/units'
import {
  getWaterStats,
  listWaterReadings,
  reviewWaterReading,
  submitWaterReading,
} from '../../api/water'
import { DataState, EmptyState, FormError } from '../../components/common/DataState'
import {
  Field,
  ModalBody,
  ModalFooter,
  ModalShell,
  inputClass,
  labelClass,
  primaryButtonClass,
  secondaryButtonClass,
} from '../../components/common/Modal'
import StatusBadge from '../../components/common/StatusBadge'
import StatCard from '../../components/dashboard/StatCard'
import WaterRulesModal from '../../components/dashboard/WaterRulesModal'
import { useProperties } from '../../context/PropertiesContext'
import { useApi } from '../../hooks/useApi'
import { formatKES, formatMonth, formatNumber, formatPercent, toDateInput } from '../../utils/format'
import { waterBillingLabel } from '../../utils/labels'

// -> { label, tone } for a reading's status badge
function readingStatus(reading) {
  if (reading.status === 'flagged') return { label: 'Flagged: lower reading', tone: 'danger' }
  if (reading.status === 'rejected') return { label: 'Rejected', tone: 'neutral' }
  if (reading.bill_status === 'paid') return { label: 'Paid', tone: 'success' }
  if (reading.bill_status === 'partial') return { label: 'Part paid', tone: 'warning' }
  if (reading.bill_status === 'void') return { label: 'Bill cancelled', tone: 'neutral' }

  return { label: 'Unpaid', tone: 'warning' }
}

function WaterBillingPage() {
  const propertiesState = useProperties()
  const [searchParams, setSearchParams] = useSearchParams()
  const [rulesOpen, setRulesOpen] = useState(false)
  const [addOpen, setAddOpen] = useState(false)
  const [resolving, setResolving] = useState(null)

  // Property and month live in the URL: /water-billing?property=1&month=2026-10
  const properties = propertiesState.data || []
  const property =
    properties.find((item) => String(item.id) === searchParams.get('property')) || properties[0]
  const month = searchParams.get('month') || toDateInput().slice(0, 7)
  const billingPeriod = `${month}-01`

  const key = property ? `${property.id}-${month}` : null
  const statsState = useApi(key && `water-stats-${key}`, () => getWaterStats(property.id, billingPeriod))
  const readingsState = useApi(key && `water-readings-${key}`, () =>
    listWaterReadings(property.id, { billing_period: billingPeriod })
  )

  function setParam(name, value) {
    const next = new URLSearchParams(searchParams)

    next.set(name, value)
    setSearchParams(next)
  }

  function reloadAll() {
    statsState.reload()
    readingsState.reload()
  }

  const stats = statsState.data
  const statCards = [
    {
      label: `Billed in ${formatMonth(billingPeriod)}`,
      value: stats ? formatKES(stats.total_billed) : '-',
      note: stats ? `${stats.open_bills} unpaid ${stats.open_bills === 1 ? 'bill' : 'bills'}` : 'Loading...',
      tone: 'muted',
    },
    {
      label: 'Collected',
      value: stats ? formatKES(stats.total_collected) : '-',
      note: stats
        ? stats.total_billed
          ? `${formatPercent(Math.round((stats.total_collected / stats.total_billed) * 1000) / 10)} of billed`
          : 'nothing billed yet'
        : 'Loading...',
      tone: 'success',
    },
    {
      label: 'Readings pending',
      value: stats ? String(stats.pending_readings) : '-',
      note: stats?.pending_readings ? 'metered units awaiting a reading' : 'all metered units read',
      tone: stats?.pending_readings ? 'danger' : 'muted',
    },
    {
      label: 'Flagged readings',
      value: stats ? String(stats.flagged_readings) : '-',
      note: stats?.flagged_readings ? 'lower than previous - not billed' : 'none to review',
      tone: stats?.flagged_readings ? 'danger' : 'muted',
    },
  ]

  return (
    <>
      <div className="mb-7 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-[10px] text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--accent-ink)]">
            Money
          </div>
          <h1 className="font-display text-[20px] font-semibold tracking-[-0.01em]">
            Water billing
          </h1>
          <p className="mt-2 text-[12px] text-[var(--ink-soft)]">
            {property
              ? `${property.name} - ${waterBillingLabel(property)}`
              : 'Meter readings and water bills, billed separately from rent.'}
          </p>
        </div>

        {property ? (
          <div className="flex flex-wrap gap-[10px]">
            <select
              value={property.id}
              onChange={(event) => setParam('property', event.target.value)}
              className="min-w-[200px] rounded-[8px] border border-[var(--line)] bg-[var(--surface)] px-3 py-[10px] text-[12px] font-bold"
            >
              {properties.map((item) => (
                <option key={item.id} value={item.id}>{item.name}</option>
              ))}
            </select>

            <input
              type="month"
              value={month}
              max={toDateInput().slice(0, 7)}
              onChange={(event) => event.target.value && setParam('month', event.target.value)}
              aria-label="Billing month"
              className="rounded-[8px] border border-[var(--line)] bg-[var(--surface)] px-3 py-[10px] text-[12px] font-bold"
            />

            <button
              onClick={() => setRulesOpen(true)}
              className="inline-flex items-center gap-2 rounded-[8px] border border-[var(--line)] bg-[var(--surface)] px-4 py-[10px] text-[12px] font-bold"
            >
              <Settings size={15} />
              Billing rules
            </button>

            <button
              onClick={() => setAddOpen(true)}
              className="inline-flex items-center gap-2 rounded-[8px] border border-[var(--accent)] bg-[var(--accent)] px-4 py-[10px] text-[12px] font-bold text-white"
            >
              <Plus size={15} />
              Add reading
            </button>
          </div>
        ) : null}
      </div>

      <DataState
        state={propertiesState}
        loadingLabel="Loading properties..."
        isEmpty={(data) => !data.length}
        empty={
          <section className="rounded-[10px] border border-[var(--line)] bg-[var(--surface)]">
            <EmptyState
              title="Add a property first"
              message="Water is billed per property. Once you have a property you can enter its meter readings here."
            >
              <Link
                to="/properties"
                className="mt-2 rounded-[8px] border border-[var(--accent)] bg-[var(--accent)] px-4 py-[10px] text-[12px] font-bold text-white"
              >
                Go to properties
              </Link>
            </EmptyState>
          </section>
        }
      >
        {() => (
          <>
            <div className="mb-6 grid gap-[14px] sm:grid-cols-2 xl:grid-cols-4">
              {statCards.map((item) => (
                <StatCard key={item.label} {...item} />
              ))}
            </div>

            <section className="overflow-hidden rounded-[10px] border border-[var(--line)] bg-[var(--surface)]">
              <div className="border-b border-[var(--line)] px-[18px] py-4">
                <h3 className="text-[12px] font-bold">Readings for {formatMonth(billingPeriod)}</h3>
              </div>

              <DataState
                state={readingsState}
                loadingLabel="Loading readings..."
                isEmpty={(readings) => !readings.length}
                empty={
                  <EmptyState
                    title="No readings for this month"
                    message={
                      property.water_billing_method === 'per_unit_metered'
                        ? 'Use Add reading to enter a meter reading. The bill is created from the unit’s rate straight away.'
                        : 'This property is not billed by meter. Fixed water charges are billed automatically with rent on the 1st.'
                    }
                  />
                }
              >
                {(readings) => (
                  <div className="overflow-x-auto">
                    <table className="min-w-[980px] w-full border-collapse">
                      <thead>
                        <tr className="bg-[var(--bg)] text-left text-[9px] uppercase tracking-[0.05em] text-[var(--ink-faint)]">
                          <th className="px-[18px] py-[10px] font-bold">Tenant / Unit</th>
                          <th className="px-[18px] py-[10px] font-bold">Previous</th>
                          <th className="px-[18px] py-[10px] font-bold">Current</th>
                          <th className="px-[18px] py-[10px] font-bold">Units used</th>
                          <th className="px-[18px] py-[10px] font-bold">Bill</th>
                          <th className="px-[18px] py-[10px] font-bold">Photo</th>
                          <th className="px-[18px] py-[10px] font-bold">Status</th>
                          <th className="px-[18px] py-[10px] font-bold"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {readings.map((reading) => {
                          const status = readingStatus(reading)

                          return (
                            <tr key={reading.id} className="border-b border-[var(--line-soft)] last:border-b-0">
                              <td className="px-[18px] py-[18px] text-[12px] font-bold">
                                {reading.tenant_id ? (
                                  <Link to={`/tenants/${reading.tenant_id}`} className="hover:text-[var(--accent-ink)]">
                                    {reading.tenant_name}
                                  </Link>
                                ) : (
                                  'No tenant'
                                )}{' '}
                                - {reading.unit_number}
                              </td>
                              <td className="font-mono px-[18px] py-[18px] text-[12px]">
                                {formatNumber(reading.previous_reading)}
                              </td>
                              <td className="font-mono px-[18px] py-[18px] text-[12px]">
                                {formatNumber(reading.current_reading)}
                              </td>
                              <td className="font-mono px-[18px] py-[18px] text-[12px]">
                                {reading.units_used === null ? '-' : formatNumber(reading.units_used)}
                              </td>
                              <td className="font-mono px-[18px] py-[18px] text-[12px]">
                                {reading.bill_amount === null ? '-' : formatKES(reading.bill_amount)}
                              </td>
                              <td className="px-[18px] py-[18px] text-[var(--ink-faint)]">
                                {reading.meter_photo_url ? (
                                  <a
                                    href={reading.meter_photo_url}
                                    target="_blank"
                                    rel="noreferrer"
                                    title="Open meter photo"
                                    className="hover:text-[var(--accent-ink)]"
                                  >
                                    <Camera size={19} />
                                  </a>
                                ) : (
                                  '-'
                                )}
                              </td>
                              <td className="px-[18px] py-[18px]">
                                <StatusBadge tone={status.tone}>{status.label}</StatusBadge>
                              </td>
                              <td className="px-[18px] py-[18px] text-right">
                                {reading.status === 'flagged' ? (
                                  <button
                                    onClick={() => setResolving(reading)}
                                    className="rounded-[8px] border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-[11px] font-bold"
                                  >
                                    Correct reading
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
          </>
        )}
      </DataState>

      <WaterRulesModal
        open={rulesOpen}
        property={property}
        onClose={() => setRulesOpen(false)}
        onSaved={propertiesState.reload}
      />

      {addOpen && property ? (
        <AddReadingModal
          property={property}
          billingPeriod={billingPeriod}
          readings={readingsState.data || []}
          onClose={() => setAddOpen(false)}
          onDone={reloadAll}
        />
      ) : null}

      {resolving ? (
        <ResolveReadingModal
          reading={resolving}
          onClose={() => setResolving(null)}
          onDone={reloadAll}
        />
      ) : null}
    </>
  )
}

function AddReadingModal({ property, billingPeriod, readings, onClose, onDone }) {
  const unitsState = useApi(`units-${property.id}`, () => listUnits(property.id))

  // Only metered units with a tenant can be billed, and each gets one reading a month.
  const alreadyRead = new Set(
    readings.filter((reading) => reading.status !== 'rejected').map((reading) => reading.unit_id)
  )
  const units = (unitsState.data || []).filter(
    (unit) =>
      unit.water_billing_method === 'per_unit_metered' &&
      unit.status === 'occupied' &&
      !alreadyRead.has(unit.id)
  )

  const [unitId, setUnitId] = useState('')
  const [currentReading, setCurrentReading] = useState('')
  const [previousReading, setPreviousReading] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [flagged, setFlagged] = useState(null)

  const unit = units.find((item) => String(item.id) === unitId)

  async function handleSubmit(event) {
    event.preventDefault()
    setSaving(true)
    setError(null)

    try {
      const reading = await submitWaterReading(property.id, unit.id, {
        billing_period: billingPeriod,
        current_reading: Number(currentReading),
        ...(previousReading === '' ? {} : { previous_reading: Number(previousReading) }),
        notes: notes.trim() || null,
      })

      onDone()

      if (reading.status === 'flagged') {
        // Saved, but not billed: keep the dialog open to say so.
        setFlagged(reading)
        setSaving(false)
      } else {
        onClose()
      }
    } catch (saveError) {
      setError(saveError)
      setSaving(false)
    }
  }

  if (flagged) {
    return (
      <ModalShell title="Reading saved, but flagged" onClose={onClose}>
        <ModalBody>
          <div className="rounded-[8px] border border-[var(--line)] bg-[var(--surface)] px-4 py-4">
            <h3 className="text-[14px] font-bold text-[var(--danger)]">
              {formatNumber(flagged.current_reading)} is lower than the previous reading of{' '}
              {formatNumber(flagged.previous_reading)}
            </h3>
            <p className="mt-1 text-[11px] leading-[1.5] text-[var(--ink-faint)]">
              No bill was created for House {flagged.unit_number}. Use
              “Correct reading” on its row to enter the right figure, or
              reject it if it was entered by mistake.
            </p>
          </div>
        </ModalBody>

        <ModalFooter>
          <button type="button" onClick={onClose} className={primaryButtonClass}>
            Done
          </button>
        </ModalFooter>
      </ModalShell>
    )
  }

  return (
    <ModalShell title={`Add meter reading - ${formatMonth(billingPeriod)}`} onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-hidden">
        <ModalBody>
          <p className="mb-[18px] text-[11px] leading-[1.5] text-[var(--ink-faint)]">
            The bill is worked out as units used × the unit’s water rate and
            added to the tenant’s account straight away.
          </p>

          <label className={labelClass}>House / unit</label>
          <select
            value={unitId}
            onChange={(event) => setUnitId(event.target.value)}
            required
            className={inputClass}
          >
            <option value="">
              {unitsState.loading
                ? 'Loading units...'
                : units.length
                  ? 'Choose a unit'
                  : 'No metered, occupied units are waiting for a reading'}
            </option>
            {units.map((item) => (
              <option key={item.id} value={item.id}>
                {item.unit_number} - {item.current_tenant?.full_name || 'tenant'} (meter{' '}
                {item.water_meter_number})
              </option>
            ))}
          </select>

          <div className="mt-[18px] grid gap-[14px] sm:grid-cols-2">
            <Field
              label="Current reading"
              placeholder="e.g. 145"
              type="number"
              min="0"
              step="any"
              value={currentReading}
              onChange={(event) => setCurrentReading(event.target.value)}
              required
            />
            <Field
              label="Previous reading (first reading only)"
              placeholder="e.g. 120"
              type="number"
              min="0"
              step="any"
              value={previousReading}
              onChange={(event) => setPreviousReading(event.target.value)}
              hint="Needed only the first time this unit is read. After that, last month's reading is used."
            />
          </div>

          {unit ? (
            <p className="mt-3 text-[11px] text-[var(--ink-faint)]">
              Rate for {unit.unit_number}: {formatKES(unit.water_rate_per_unit)} per unit.
            </p>
          ) : null}

          <div className="mt-[18px]">
            <Field
              label="Notes (optional)"
              placeholder="e.g. Read by caretaker on the 2nd"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
            />
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
          <button type="submit" disabled={saving || !unit} className={primaryButtonClass}>
            {saving ? 'Saving...' : 'Save reading'}
          </button>
        </ModalFooter>
      </form>
    </ModalShell>
  )
}

// A flagged reading is fixed by entering the right figure, or thrown out.
function ResolveReadingModal({ reading, onClose, onDone }) {
  const [corrected, setCorrected] = useState('')
  const [notes, setNotes] = useState('')
  const [working, setWorking] = useState(null)
  const [error, setError] = useState(null)

  async function run(action, body) {
    setWorking(action)
    setError(null)

    try {
      await reviewWaterReading(reading.id, { action, notes: notes.trim() || null, ...body })
      onDone()
      onClose()
    } catch (actionError) {
      setError(actionError)
      setWorking(null)
    }
  }

  function handleSubmit(event) {
    event.preventDefault()
    run('approve', { corrected_current_reading: Number(corrected) })
  }

  return (
    <ModalShell title={`Correct reading - House ${reading.unit_number}`} onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-hidden">
        <ModalBody>
          <div className="mb-[18px] rounded-[8px] border border-[var(--line)] bg-[var(--surface)] px-4 py-4">
            <h3 className="text-[14px] font-bold text-[var(--danger)]">
              Entered {formatNumber(reading.current_reading)}, but the previous reading was{' '}
              {formatNumber(reading.previous_reading)}
            </h3>
            <p className="mt-1 text-[11px] leading-[1.5] text-[var(--ink-faint)]">
              A meter cannot go backwards, so {reading.tenant_name || 'the tenant'} has not
              been billed. Enter the correct reading to create the bill.
            </p>
          </div>

          <div className="grid gap-[14px] sm:grid-cols-2">
            <Field
              label="Correct current reading"
              placeholder={`${reading.previous_reading} or higher`}
              type="number"
              min={reading.previous_reading}
              step="any"
              value={corrected}
              onChange={(event) => setCorrected(event.target.value)}
              required
              autoFocus
            />
            <Field
              label="Notes (optional)"
              placeholder="e.g. Digits were swapped"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
            />
          </div>

          {error ? (
            <div className="mt-[14px]">
              <FormError error={error} />
            </div>
          ) : null}
        </ModalBody>

        <ModalFooter>
          <button
            type="button"
            onClick={() => run('reject')}
            disabled={Boolean(working)}
            title="Discard this reading so a new one can be entered for the month"
            className="mr-auto rounded-[8px] border border-[var(--danger)] bg-[var(--surface)] px-5 py-[10px] text-[12px] font-bold text-[var(--danger)] disabled:opacity-50"
          >
            {working === 'reject' ? 'Rejecting...' : 'Reject reading'}
          </button>
          <button type="button" onClick={onClose} className={secondaryButtonClass}>
            Cancel
          </button>
          <button type="submit" disabled={Boolean(working)} className={primaryButtonClass}>
            {working === 'approve' ? 'Saving...' : 'Save and bill'}
          </button>
        </ModalFooter>
      </form>
    </ModalShell>
  )
}

export default WaterBillingPage
