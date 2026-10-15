import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { archiveUnit, listUnits, restoreUnit } from '../../api/units'
import { DataState, EmptyState, FormError } from '../../components/common/DataState'
import ChooseProperty from '../../components/dashboard/ChooseProperty'
import ConfirmDeleteModal from '../../components/dashboard/ConfirmDeleteModal'
import ElectricityBillsModal from '../../components/dashboard/ElectricityBillsModal'
import UnitFormModal from '../../components/dashboard/UnitFormModal'
import { useProperties } from '../../context/PropertiesContext'
import { useApi } from '../../hooks/useApi'
import { formatKES } from '../../utils/format'
import { UNIT_TYPES, unitTypeLabel } from '../../utils/labels'

// "arrears" is not a backend status: it is an occupied unit whose tenant owes money.
const unitFilters = [
  { key: 'all', label: 'All', matches: () => true },
  { key: 'occupied', label: 'Occupied', matches: (unit) => unit.status === 'occupied' },
  { key: 'vacant', label: 'Vacant', matches: (unit) => displayStatus(unit) === 'vacant' },
  { key: 'arrears', label: 'In arrears', matches: (unit) => displayStatus(unit) === 'arrears' },
]

// Shown beside the filters above: units taken out of use, kept for their history.
const NOT_IN_USE = 'not_in_use'

const unitStatusColors = {
  occupied: 'bg-[var(--success)]',
  arrears: 'bg-[var(--danger)]',
  vacant: 'bg-[var(--ink-faint)]',
}

const unitLegend = [
  { label: 'Occupied', color: unitStatusColors.occupied },
  { label: 'In arrears', color: unitStatusColors.arrears },
  { label: 'Vacant', color: unitStatusColors.vacant },
]

// A unit in use is either occupied or vacant. "Reserved" and "Under maintenance" are no longer
// offered; a unit still carrying one of them is shown as vacant.
function displayStatus(unit) {
  if (unit.status !== 'occupied') return 'vacant'

  return unit.current_tenant?.balance > 0 ? 'arrears' : 'occupied'
}

// Types the owner typed for this property's units, offered again in the unit form.
function customUnitTypes(units) {
  const usual = UNIT_TYPES.map(([value]) => value)

  return [...new Set(units.map((unit) => unit.unit_type))].filter(
    (type) => type && !usual.includes(type)
  )
}

function UnitsHousesPage() {
  const propertiesState = useProperties()
  const [activeFilter, setActiveFilter] = useState('all')
  const [addOpen, setAddOpen] = useState(false)
  const [editingUnit, setEditingUnit] = useState(null)
  const [deletingUnit, setDeletingUnit] = useState(null)
  const [electricityOpen, setElectricityOpen] = useState(false)

  // Chosen in the top bar; with all properties chosen, the page asks for one.
  const selectedProperty = propertiesState.oneProperty

  const unitsState = useApi(
    selectedProperty ? `units-all-${selectedProperty.id}` : null,
    () => listUnits(selectedProperty.id, { includeArchived: true })
  )
  // Units in use, which every count is about, and units taken out of use.
  const units = (unitsState.data || []).filter((unit) => unit.status !== 'inactive')
  const unitsNotInUse = (unitsState.data || []).filter((unit) => unit.status === 'inactive')
  const filteredUnits =
    activeFilter === NOT_IN_USE
      ? []
      : units.filter(unitFilters.find((filter) => filter.key === activeFilter).matches)
  // "All" lists them after the units in use; their own filter lists only them.
  const shownNotInUse = activeFilter === 'all' || activeFilter === NOT_IN_USE ? unitsNotInUse : []
  const [restoreError, setRestoreError] = useState(null)

  async function handleRestoreUnit(unit) {
    setRestoreError(null)

    try {
      await restoreUnit(unit.id)
      handleUnitsChanged()
    } catch (error) {
      setRestoreError(error)
    }
  }

  function handleUnitsChanged() {
    unitsState.reload()
    // Property cards and the sidebar show unit counts.
    propertiesState.reload()
  }

  async function handleDeleteUnit() {
    await archiveUnit(deletingUnit.id)
    handleUnitsChanged()
  }

  return (
    <>
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-[10px] text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--accent-ink)]">
            Property
          </div>

          <h1 className="font-display text-[20px] font-semibold tracking-[-0.01em]">
            Units / Houses
          </h1>

          <p className="mt-2 text-[12px] text-[var(--ink-soft)]">
            {selectedProperty
              ? `${selectedProperty.name} - ${unitsState.data ? `${units.length} ${units.length === 1 ? 'unit' : 'units'}` : 'loading units...'}`
              : 'Houses in each of your properties'}
          </p>
        </div>

        {selectedProperty ? (
          <div className="flex flex-wrap gap-[10px]">
            {/* Only for properties with a unit whose electricity is typed in each month. */}
            {units.some((unit) => unit.electricity_billing_method === 'entered') ? (
              <button
                onClick={() => setElectricityOpen(true)}
                className="rounded-[8px] border border-[var(--line)] bg-[var(--surface)] px-4 py-[10px] text-[12px] font-bold"
              >
                Enter electricity bills
              </button>
            ) : null}

            <button
              onClick={() => setAddOpen(true)}
              className="inline-flex items-center justify-center gap-2 rounded-[8px] border border-[var(--accent)] bg-[var(--accent)] px-4 py-[10px] text-[12px] font-bold text-white"
            >
              <Plus size={15} />
              Add unit
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
              message="Units belong to a property. Once you have a property you can add its houses here."
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
        {() => !selectedProperty ? (
          <ChooseProperty message="Units are listed one property at a time. Pick one here or at the top." />
        ) : (
          <DataState key={selectedProperty.id} state={unitsState} loadingLabel="Loading units...">
            {() => (
              <>
                <div className="mb-[18px] flex flex-wrap gap-[10px]">
                  {unitFilters.map((filter) => (
                    <button
                      key={filter.key}
                      onClick={() => setActiveFilter(filter.key)}
                      className={`rounded-full border px-3 py-[7px] text-[11px] font-medium transition ${
                        activeFilter === filter.key
                          ? 'border-transparent bg-[var(--accent-soft)] text-[var(--accent-hover)]'
                          : 'border-[var(--line)] bg-[var(--surface)] text-[var(--ink-soft)] hover:border-[var(--accent-soft-line)] hover:text-[var(--accent-ink)]'
                      }`}
                    >
                      {filter.label} ({units.filter(filter.matches).length})
                    </button>
                  ))}

                  {unitsNotInUse.length ? (
                    <button
                      onClick={() => setActiveFilter(NOT_IN_USE)}
                      className={`rounded-full border px-3 py-[7px] text-[11px] font-medium transition ${
                        activeFilter === NOT_IN_USE
                          ? 'border-transparent bg-[var(--accent-soft)] text-[var(--accent-hover)]'
                          : 'border-[var(--line)] bg-[var(--surface)] text-[var(--ink-soft)] hover:border-[var(--accent-soft-line)] hover:text-[var(--accent-ink)]'
                      }`}
                    >
                      Not in use ({unitsNotInUse.length})
                    </button>
                  ) : null}
                </div>

                {restoreError ? (
                  <div className="mb-[14px]">
                    <FormError error={restoreError} />
                  </div>
                ) : null}

                <div className="grid gap-[10px] sm:grid-cols-2 xl:grid-cols-4">
                  {filteredUnits.map((unit) => (
                    <UnitTile
                      key={unit.id}
                      unit={unit}
                      onEdit={() => setEditingUnit(unit)}
                      onDelete={() => setDeletingUnit(unit)}
                    />
                  ))}

                  {shownNotInUse.map((unit) => (
                    <NotInUseTile key={unit.id} unit={unit} onRestore={() => handleRestoreUnit(unit)} />
                  ))}

                  <button
                    onClick={() => setAddOpen(true)}
                    className="flex min-h-[200px] flex-col items-center justify-between rounded-[8px] border border-dashed border-[var(--line)] bg-[var(--surface)] px-4 py-4 text-[var(--ink-faint)] transition hover:border-[var(--accent-soft-line)] hover:bg-[var(--accent-soft)] hover:text-[var(--accent-ink)]"
                  >
                    <Plus size={22} />
                    <span className="text-[11px] font-bold">Add unit</span>
                  </button>
                </div>

                <div className="mt-4 flex flex-wrap gap-[7px] text-[10px] text-[var(--ink-faint)]">
                  {unitLegend.map((item) => (
                    <LegendDot key={item.label} color={item.color} label={item.label} />
                  ))}
                </div>
              </>
            )}
          </DataState>
        )}
      </DataState>

      <UnitFormModal
        open={addOpen}
        property={selectedProperty}
        customTypes={customUnitTypes(unitsState.data || [])}
        onClose={() => setAddOpen(false)}
        onSaved={handleUnitsChanged}
      />

      <UnitFormModal
        open={Boolean(editingUnit)}
        property={selectedProperty}
        unit={editingUnit}
        customTypes={customUnitTypes(unitsState.data || [])}
        onClose={() => setEditingUnit(null)}
        onSaved={handleUnitsChanged}
      />

      <ElectricityBillsModal
        open={electricityOpen}
        property={selectedProperty}
        onClose={() => setElectricityOpen(false)}
        onSaved={handleUnitsChanged}
      />

      <ConfirmDeleteModal
        open={Boolean(deletingUnit)}
        title="Take unit / house out of use"
        message={`${deletingUnit?.unit_number || 'This unit'} will be marked "Not in use": no tenant can be added to it and it is not counted or billed. It stays listed on this page, its rent, tenant and water history is kept, and you can restore it at any time. Use this for a house that is not rented out, such as the caretaker\u2019s.`}
        confirmLabel="Take out of use"
        onClose={() => setDeletingUnit(null)}
        onConfirm={handleDeleteUnit}
      />
    </>
  )
}

function UnitTile({ unit, onEdit, onDelete }) {
  const status = displayStatus(unit)

  return (
    <article className="relative rounded-[8px] border border-[var(--line)] bg-[var(--surface)] px-3 py-9 transition hover:-translate-y-[1px] hover:border-[var(--ink-faint)] hover:shadow-[0_10px_24px_rgba(32,28,24,0.06)]">
      <span
        className={`absolute right-[10px] top-[10px] h-2 w-2 rounded-full ${
          unitStatusColors[status]
        }`}
      />

      <h3 className="text-[13px] font-bold">{unit.unit_number}</h3>

      <p className="mt-[5px] text-[10px] text-[var(--ink-faint)]">
        {[unitTypeLabel(unit.unit_type), unit.block_or_floor].filter(Boolean).join(' - ')}
      </p>

      <p className="mt-[3px] truncate text-[10px] text-[var(--ink-faint)]">
        {unit.current_tenant
          ? status === 'arrears'
            ? `${unit.current_tenant.full_name} - owes ${formatKES(unit.current_tenant.balance)}`
            : unit.current_tenant.full_name
          : 'No tenant'}
      </p>

      <div className="font-mono mt-[10px] text-[12px] font-semibold">
        {formatKES(unit.monthly_rent)}
      </div>

      <div className="mt-[12px] grid grid-cols-2 gap-[8px]">
        <button
          onClick={onEdit}
          className="rounded-[8px] border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-left text-[11px] font-bold text-[var(--ink)] transition hover:bg-[var(--line-soft)]"
        >
          Edit
        </button>

        <button
          onClick={onDelete}
          className="rounded-[8px] border border-[var(--danger)] bg-[var(--surface)] px-3 py-2 text-left text-[11px] font-bold text-[var(--danger)] transition hover:bg-[var(--danger-soft)]"
        >
          Not in use
        </button>
      </div>
    </article>
  )
}

// A unit taken out of use: kept for its history, not rented, counted or billed.
function NotInUseTile({ unit, onRestore }) {
  return (
    <article className="relative rounded-[8px] border border-dashed border-[var(--line)] bg-[var(--bg)] px-3 py-9">
      <h3 className="text-[13px] font-bold text-[var(--ink-soft)]">{unit.unit_number}</h3>

      <p className="mt-[5px] text-[10px] text-[var(--ink-faint)]">
        {[unitTypeLabel(unit.unit_type), unit.block_or_floor].filter(Boolean).join(' - ')}
      </p>

      <p className="mt-[3px] text-[10px] font-bold uppercase tracking-[0.04em] text-[var(--ink-faint)]">
        Not in use
      </p>

      <div className="font-mono mt-[10px] text-[12px] font-semibold text-[var(--ink-faint)]">
        {formatKES(unit.monthly_rent)}
      </div>

      <div className="mt-[12px]">
        <button
          onClick={onRestore}
          className="w-full rounded-[8px] border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-left text-[11px] font-bold text-[var(--ink)] transition hover:bg-[var(--line-soft)]"
        >
          Restore
        </button>
      </div>
    </article>
  )
}

function LegendDot({ color, label }) {
  return (
    <span className="inline-flex items-center gap-[4px]">
      <span className={`h-[5px] w-[5px] rounded-full ${color}`} />
      {label}
    </span>
  )
}

export default UnitsHousesPage
