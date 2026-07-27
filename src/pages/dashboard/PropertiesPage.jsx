import { useState } from 'react'
import { Plus } from 'lucide-react'
import { properties as initialProperties, propertyDetails } from '../../data/propertiesData'
import EditPropertyModal from '../../components/dashboard/EditPropertyModal'
import ConfirmDeleteModal from '../../components/dashboard/ConfirmDeleteModal'

function PropertiesPage({ onAddProperty }) {
  const [properties, setProperties] = useState(initialProperties)
  const [editingProperty, setEditingProperty] = useState(null)
  const [deletingProperty, setDeletingProperty] = useState(null)

  const selectedProperty = properties[0]

  function handleDeleteProperty() {
    setProperties((currentProperties) =>
      currentProperties.filter((property) => property.id !== deletingProperty.id)
    )
  }

  return (
    <>
      <div className="mb-7 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-[10px] text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--accent)]">
            Property
          </div>
          <h1 className="font-display text-[20px] font-semibold tracking-[-0.01em]">
            Properties
          </h1>
          <p className="mt-2 text-[12px] text-[var(--ink-soft)]">
            3 properties - 128 units total
          </p>
        </div>

        <button
          onClick={onAddProperty}
          className="inline-flex items-center justify-center gap-2 rounded-[8px] border border-[var(--accent)] bg-[var(--accent)] px-4 py-[10px] text-[12px] font-bold text-white"
        >
          <Plus size={15} />
          Add property
        </button>
      </div>

      <div className="mb-6 grid gap-[14px] lg:grid-cols-3">
        {properties.map((property) => (
          <PropertyCard
            key={property.id}
            property={property}
            onDelete={() => setDeletingProperty(property)}
          />
        ))}
      </div>

      {selectedProperty ? (
        <section className="overflow-hidden rounded-[10px] border border-[var(--line)] bg-white">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--line)] px-[18px] py-4">
            <h3 className="text-[12px] font-bold">
              {selectedProperty.name} - details
            </h3>

            <div className="flex flex-wrap gap-[8px]">
              <button
                onClick={() => setEditingProperty(selectedProperty)}
                className="rounded-[8px] border border-[var(--line)] bg-white px-3 py-2 text-[11px] font-bold"
              >
                Edit property
              </button>

              <button
                onClick={() => setDeletingProperty(selectedProperty)}
                className="rounded-[8px] border border-red-500 bg-white px-3 py-2 text-[11px] font-bold text-red-600"
              >
                Delete property
              </button>
            </div>
          </div>

          <div className="grid gap-6 px-[18px] py-5 xl:grid-cols-[1.6fr_1fr]">
            <div>
              {propertyDetails.map(([label, value]) => (
                <div
                  key={label}
                  className="flex items-center justify-between border-b border-[var(--line-soft)] py-[9px] text-[12px] last:border-b-0"
                >
                  <span className="text-[var(--ink-soft)]">{label}</span>
                  <span className="font-bold">{value}</span>
                </div>
              ))}
            </div>

            <div>
              <div className="mb-[14px] flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--accent)]">
                  Payment accounts
                </span>
                <span className="h-px flex-1 bg-[var(--line)]" />
              </div>

              <PaymentAccount
                title="Rent - M-Pesa Paybill"
                subtitle="Paybill 400 200 - Green View Rent"
                badge="Rent"
                tone="rent"
              />

              <PaymentAccount
                title="Water - Bank account"
                subtitle="Equity ** 4471 - Green View Water"
                badge="Water"
                tone="water"
              />
            </div>
          </div>
        </section>
      ) : null}

      <EditPropertyModal
        open={Boolean(editingProperty)}
        property={editingProperty}
        onClose={() => setEditingProperty(null)}
      />

      <ConfirmDeleteModal
        open={Boolean(deletingProperty)}
        title="Delete property"
        message={`Deleting ${deletingProperty?.name || 'this property'} will archive it from the active property list. Existing tenants, units, payments and reports should stay saved for records.`}
        confirmLabel="Delete property"
        onClose={() => setDeletingProperty(null)}
        onConfirm={handleDeleteProperty}
      />
    </>
  )
}

function PropertyCard({ property, onDelete }) {
  return (
    <article className="overflow-hidden rounded-[10px] border border-[var(--line)] bg-white">
      <div className="property-thumb">
        <span className="absolute left-[10px] top-[10px] rounded-full bg-[rgba(28,23,18,.85)] px-[9px] py-[3px] text-[10px] font-bold text-white">
          {property.type}
        </span>
      </div>

      <div className="p-4">
        <h3 className="text-[12px] font-bold">{property.name}</h3>
        <p className="mt-[3px] text-[10px] text-[var(--ink-faint)]">
          {property.location}
        </p>

        <div className="mt-4 grid grid-cols-3 border-t border-[var(--line-soft)] pt-4">
          <MiniStat value={property.units} label="Units" />
          <MiniStat value={property.occupied} label="Occupied" />
          <MiniStat value={property.collected} label="Collected" />
        </div>

        <button
          onClick={onDelete}
          className="mt-[12px] w-full rounded-[8px] border border-red-500 bg-white px-3 py-2 text-left text-[11px] font-bold text-red-600 transition hover:bg-red-50"
        >
          Delete property
        </button>
      </div>
    </article>
  )
}

function MiniStat({ value, label }) {
  return (
    <div>
      <div className="font-mono text-[12px] font-semibold">{value}</div>
      <div className="mt-[3px] text-[9px] uppercase tracking-[0.04em] text-[var(--ink-faint)]">
        {label}
      </div>
    </div>
  )
}

function PaymentAccount({ title, subtitle, badge, tone }) {
  const badgeClass =
    tone === 'water'
      ? 'bg-[#E6EDF4] text-[#3C5C82]'
      : 'bg-[var(--accent-soft)] text-[var(--accent-hover)]'

  return (
    <div className="mb-[10px] rounded-[8px] border border-[var(--line)] border-l-2 border-l-[var(--accent-soft-line)] bg-white px-4 py-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h4 className="text-[13px] font-bold">{title}</h4>
          <p className="mt-[4px] text-[10px] text-[var(--ink-faint)]">
            {subtitle}
          </p>
        </div>

        <span className={`rounded-full px-[9px] py-[3px] text-[9px] font-bold uppercase ${badgeClass}`}>
          {badge}
        </span>
      </div>
    </div>
  )
}

export default PropertiesPage