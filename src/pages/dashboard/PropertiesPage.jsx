import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { archiveProperty } from '../../api/properties'
import { DataState, EmptyState } from '../../components/common/DataState'
import EditPropertyModal from '../../components/dashboard/EditPropertyModal'
import ConfirmDeleteModal from '../../components/dashboard/ConfirmDeleteModal'
import ServiceChargesSection from '../../components/dashboard/ServiceChargesSection'
import { useProperties } from '../../context/PropertiesContext'
import { formatKESCompact, humanize } from '../../utils/format'
import {
  MOVE_IN_BILLING,
  MOVE_OUT_BILLING,
  PROPERTY_TYPES,
  SERVICE_CHARGE_ACCOUNTS,
  optionLabel,
  paymentAccountTypeLabel,
  rentDueDayLabel,
  waterBillingLabel,
} from '../../utils/labels'

function PropertiesPage({ onAddProperty }) {
  const propertiesState = useProperties()
  const { propertyId } = useParams()
  const navigate = useNavigate()
  const [editingProperty, setEditingProperty] = useState(null)
  const [deletingProperty, setDeletingProperty] = useState(null)

  const properties = propertiesState.data || []
  const selectedProperty =
    properties.find((property) => String(property.id) === propertyId) || properties[0]
  const totalUnits = properties.reduce(
    (total, property) => total + property.summary.total_units,
    0
  )

  async function handleDeleteProperty() {
    await archiveProperty(deletingProperty.id)
    propertiesState.reload()
    navigate('/properties')
  }

  return (
    <>
      <div className="mb-7 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-[10px] text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--accent-ink)]">
            Property
          </div>
          <h1 className="font-display text-[20px] font-semibold tracking-[-0.01em]">
            Properties
          </h1>
          <p className="mt-2 text-[12px] text-[var(--ink-soft)]">
            {propertiesState.data
              ? `${properties.length} ${properties.length === 1 ? 'property' : 'properties'} - ${totalUnits} ${totalUnits === 1 ? 'unit' : 'units'} total`
              : 'Loading your properties...'}
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

      <DataState
        state={propertiesState}
        loadingLabel="Loading properties..."
        isEmpty={(data) => !data.length}
        empty={
          <section className="rounded-[10px] border border-[var(--line)] bg-[var(--surface)]">
            <EmptyState
              title="No properties yet"
              message="Add your first property to start managing its units, tenants and payments."
            >
              <button
                onClick={onAddProperty}
                className="mt-2 inline-flex items-center gap-2 rounded-[8px] border border-[var(--accent)] bg-[var(--accent)] px-4 py-[10px] text-[12px] font-bold text-white"
              >
                <Plus size={15} />
                Add property
              </button>
            </EmptyState>
          </section>
        }
      >
        {() => (
          <>
            <div className="mb-6 grid gap-[14px] lg:grid-cols-3">
              {properties.map((property) => (
                <PropertyCard
                  key={property.id}
                  property={property}
                  selected={property.id === selectedProperty.id}
                  onDelete={() => setDeletingProperty(property)}
                />
              ))}
            </div>

            <section className="overflow-hidden rounded-[10px] border border-[var(--line)] bg-[var(--surface)]">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--line)] px-[18px] py-4">
                <h3 className="text-[12px] font-bold">
                  {selectedProperty.name} - details
                </h3>

                <div className="flex flex-wrap gap-[8px]">
                  <button
                    onClick={() => setEditingProperty(selectedProperty)}
                    className="rounded-[8px] border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-[11px] font-bold"
                  >
                    Edit property
                  </button>

                  <button
                    onClick={() => setDeletingProperty(selectedProperty)}
                    className="rounded-[8px] border border-[var(--danger)] bg-[var(--surface)] px-3 py-2 text-[11px] font-bold text-[var(--danger)]"
                  >
                    Delete property
                  </button>
                </div>
              </div>

              <div className="grid gap-6 px-[18px] py-5 xl:grid-cols-[1.6fr_1fr]">
                <div>
                  {[
                    ['Property type', optionLabel(PROPERTY_TYPES, selectedProperty.property_type)],
                    ['Location', selectedProperty.location],
                    ['Rent due day', rentDueDayLabel(selectedProperty.rent_due_day)],
                    ['Mid-month move-in', optionLabel(MOVE_IN_BILLING, selectedProperty.move_in_billing)],
                    ['Mid-month move-out', optionLabel(MOVE_OUT_BILLING, selectedProperty.move_out_billing)],
                    ['Assigned caretaker', selectedProperty.caretaker?.full_name || 'Not assigned'],
                    ['Water billing', waterBillingLabel(selectedProperty)],
                    [
                      'Service charges paid into',
                      optionLabel(SERVICE_CHARGE_ACCOUNTS, selectedProperty.service_charge_account),
                    ],
                    ['SMS sender', selectedProperty.sms_sender_id || "Default (Africa's Talking)"],
                  ].map(([label, value]) => (
                    <div
                      key={label}
                      className="flex items-center justify-between gap-4 border-b border-[var(--line-soft)] py-[9px] text-[12px] last:border-b-0"
                    >
                      <span className="text-[var(--ink-soft)]">{label}</span>
                      <span className="text-right font-bold">{value}</span>
                    </div>
                  ))}
                </div>

                <div>
                  <div className="mb-[14px] flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--accent-ink)]">
                      Payment accounts
                    </span>
                    <span className="h-px flex-1 bg-[var(--line)]" />
                  </div>

                  <PaymentAccount account={selectedProperty.rent_account} badge="Rent" tone="rent" />
                  <PaymentAccount account={selectedProperty.water_account} badge="Water" tone="water" />
                  <PaymentAccount
                    account={selectedProperty.electricity_account}
                    badge="Electricity"
                    tone="water"
                  />
                  {selectedProperty.service_account ? (
                    <PaymentAccount
                      account={selectedProperty.service_account}
                      badge="Service charges"
                      tone="water"
                    />
                  ) : null}
                </div>
              </div>
            </section>

            <ServiceChargesSection key={selectedProperty.id} property={selectedProperty} />
          </>
        )}
      </DataState>

      <EditPropertyModal
        open={Boolean(editingProperty)}
        property={editingProperty}
        onClose={() => setEditingProperty(null)}
        onSaved={propertiesState.reload}
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

function PropertyCard({ property, selected, onDelete }) {
  return (
    <article
      className={`overflow-hidden rounded-[10px] border bg-[var(--surface)] transition ${
        selected ? 'border-[var(--accent)]' : 'border-[var(--line)] hover:border-[var(--ink-faint)]'
      }`}
    >
      <Link to={`/properties/${property.id}`} className="block">
        <div className="property-thumb">
          <span className="absolute left-[10px] top-[10px] z-10 rounded-full bg-[rgba(28,23,18,.85)] px-[9px] py-[3px] text-[10px] font-bold text-white">
            {optionLabel(PROPERTY_TYPES, property.property_type, humanize(property.property_type))}
          </span>
        </div>

        <div className="px-4 pt-4">
          <h3 className="text-[12px] font-bold">{property.name}</h3>
          <p className="mt-[3px] text-[10px] text-[var(--ink-faint)]">
            {property.location}
          </p>

          <div className="mt-4 grid grid-cols-3 border-t border-[var(--line-soft)] pt-4">
            <MiniStat value={property.summary.total_units} label="Units" />
            <MiniStat value={property.summary.occupied_units} label="Occupied" />
            <MiniStat
              value={formatKESCompact(property.summary.rent_collected_this_month)}
              label="Collected"
            />
          </div>
        </div>
      </Link>

      <div className="px-4 pb-4">
        <button
          onClick={onDelete}
          className="mt-[12px] w-full rounded-[8px] border border-[var(--danger)] bg-[var(--surface)] px-3 py-2 text-left text-[11px] font-bold text-[var(--danger)] transition hover:bg-[var(--danger-soft)]"
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

function PaymentAccount({ account, badge, tone }) {
  const badgeClass =
    tone === 'water'
      ? 'bg-[var(--info-soft)] text-[var(--info)]'
      : 'bg-[var(--accent-soft)] text-[var(--accent-hover)]'

  const numberLabel = account?.account_type === 'till' ? 'Till' : 'Paybill'

  return (
    <div className="mb-[10px] rounded-[8px] border border-[var(--line)] bg-[var(--surface)] px-4 py-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h4 className="text-[13px] font-bold">
            {badge} - {account ? paymentAccountTypeLabel(account) : badge === 'Rent' ? 'Not connected' : 'No separate account'}
          </h4>
          <p className="mt-[4px] text-[10px] text-[var(--ink-faint)]">
            {account
              ? [
                  `${numberLabel} ${account.business_number}`,
                  account.display_name || account.account_name,
                  humanize(account.environment, ''),
                ]
                  .filter(Boolean)
                  .join(' - ')
              : badge === 'Rent'
                ? 'No active payment account for this property.'
                : 'Paid through the rent account.'}
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
