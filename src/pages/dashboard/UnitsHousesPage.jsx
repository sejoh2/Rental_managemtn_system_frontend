import { useMemo, useState } from 'react'
import { Plus } from 'lucide-react'
import {
  unitFilters,
  unitsByProperty,
  unitStatusColors,
  unitLegend,
} from '../../data/unitsHousesData'
import EditUnitModal from '../../components/dashboard/EditUnitModal'
import ConfirmDeleteModal from '../../components/dashboard/ConfirmDeleteModal'

function UnitsHousesPage({ onAddUnit }) {
  const [activeFilter, setActiveFilter] = useState('All')
  const [selectedProperty, setSelectedProperty] = useState('Green View Apartments')
  const [unitsByPropertyState, setUnitsByPropertyState] = useState(unitsByProperty)
  const [editingUnit, setEditingUnit] = useState(null)
  const [deletingUnit, setDeletingUnit] = useState(null)

  const propertyUnits = unitsByPropertyState[selectedProperty] || []

  const filteredUnits = useMemo(() => {
    if (activeFilter === 'All') return propertyUnits

    const statusMap = {
      Occupied: 'occupied',
      Vacant: 'vacant',
      'Under maintenance': 'maintenance',
      'In arrears': 'arrears',
    }

    return propertyUnits.filter((unit) => unit.status === statusMap[activeFilter])
  }, [activeFilter, propertyUnits])

  function handleDeleteUnit() {
    setUnitsByPropertyState((currentUnitsByProperty) => ({
      ...currentUnitsByProperty,
      [selectedProperty]: currentUnitsByProperty[selectedProperty].filter(
        (unit) => unit.number !== deletingUnit.number
      ),
    }))
  }

  return (
    <>
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-[10px] text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--accent)]">
            Property
          </div>

          <h1 className="font-display text-[20px] font-semibold tracking-[-0.01em]">
            Units / Houses
          </h1>

          <p className="mt-2 text-[12px] text-[var(--ink-soft)]">
            {selectedProperty} - {propertyUnits.length} units
          </p>
        </div>

        <div className="flex flex-wrap gap-[10px]">
          <select
            value={selectedProperty}
            onChange={(event) => {
              setSelectedProperty(event.target.value)
              setActiveFilter('All')
            }}
            className="min-w-[200px] rounded-[8px] border border-[var(--line)] bg-white px-3 py-[10px] text-[12px] font-bold"
          >
            {Object.keys(unitsByPropertyState).map((property) => (
              <option key={property}>{property}</option>
            ))}
          </select>

          <button
            onClick={onAddUnit}
            className="inline-flex items-center justify-center gap-2 rounded-[8px] border border-[var(--accent)] bg-[var(--accent)] px-4 py-[10px] text-[12px] font-bold text-white"
          >
            <Plus size={15} />
            Add unit
          </button>
        </div>
      </div>

      <div className="mb-[18px] flex flex-wrap gap-[10px]">
        {unitFilters.map((filter) => (
          <button
            key={filter.label}
            onClick={() => setActiveFilter(filter.label)}
            className={`rounded-full border px-3 py-[7px] text-[11px] font-medium transition ${
              activeFilter === filter.label
                ? 'border-transparent bg-[var(--accent-soft)] text-[var(--accent-hover)]'
                : 'border-[var(--line)] bg-white text-[var(--ink-soft)] hover:border-[var(--accent-soft-line)] hover:text-[var(--accent)]'
            }`}
          >
            {filter.label} ({filter.count})
          </button>
        ))}
      </div>

      <div className="grid gap-[10px] sm:grid-cols-2 xl:grid-cols-4">
        {filteredUnits.map((unit) => (
          <UnitTile
            key={`${selectedProperty}-${unit.number}`}
            unit={unit}
            onEdit={() => setEditingUnit(unit)}
            onDelete={() => setDeletingUnit(unit)}
          />
        ))}

        <button
          onClick={onAddUnit}
          className="flex min-h-[200px] flex-col items-center justify-between rounded-[8px] border border-dashed border-[var(--line)] bg-white px-4 py-4 text-[var(--ink-faint)] transition hover:border-[var(--accent-soft-line)] hover:bg-[var(--accent-soft)] hover:text-[var(--accent)]"
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

      <EditUnitModal
        open={Boolean(editingUnit)}
        unit={editingUnit}
        onClose={() => setEditingUnit(null)}
      />

      <ConfirmDeleteModal
        open={Boolean(deletingUnit)}
        title="Delete unit / house"
        message={`Deleting ${deletingUnit?.number || 'this unit'} will archive it from the active unit list. Existing rent history, tenant history and water readings should stay saved for records.`}
        confirmLabel="Delete unit"
        onClose={() => setDeletingUnit(null)}
        onConfirm={handleDeleteUnit}
      />
    </>
  )
}

function UnitTile({ unit, onEdit, onDelete }) {
  return (
    <article className="relative rounded-[8px] border border-[var(--line)] bg-white px-3 py-9 transition hover:-translate-y-[1px] hover:border-[var(--ink-faint)] hover:shadow-[0_10px_24px_rgba(32,28,24,0.06)]">
      <span
        className={`absolute right-[10px] top-[10px] h-2 w-2 rounded-full ${
          unitStatusColors[unit.status]
        }`}
      />

      <h3 className="text-[13px] font-bold">{unit.number}</h3>

      <p className="mt-[5px] text-[10px] text-[var(--ink-faint)]">
        {unit.type} - {unit.floor}
      </p>

      <div className="font-mono mt-[10px] text-[12px] font-semibold">
        {unit.rent}
      </div>

      <div className="mt-[12px] grid grid-cols-2 gap-[8px]">
        <button
          onClick={onEdit}
          className="rounded-[8px] border border-[var(--line)] bg-white px-3 py-2 text-left text-[11px] font-bold text-[var(--ink)] transition hover:bg-[var(--line-soft)]"
        >
          Edit
        </button>

        <button
          onClick={onDelete}
          className="rounded-[8px] border border-red-500 bg-white px-3 py-2 text-left text-[11px] font-bold text-red-600 transition hover:bg-red-50"
        >
          Delete
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