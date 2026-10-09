import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { MoreVertical, Plus } from 'lucide-react'
import { listTenants } from '../../api/tenants'
import { DataState, EmptyState } from '../../components/common/DataState'
import StatusBadge from '../../components/common/StatusBadge'
import { useProperties } from '../../context/PropertiesContext'
import { useApi } from '../../hooks/useApi'
import { formatKES, formatPhone } from '../../utils/format'
import { isCurrentTenant, tenantBalance, tenantStatus } from '../../utils/tenantStatus'

const tenantFilters = [
  { key: 'all', label: 'All', matches: isCurrentTenant },
  {
    key: 'arrears',
    label: 'In arrears',
    matches: (tenant) => isCurrentTenant(tenant) && tenant.balance > 0,
  },
  {
    key: 'credit',
    label: 'Credit balance',
    matches: (tenant) => isCurrentTenant(tenant) && tenant.credit_balance > 0,
  },
  { key: 'moving', label: 'Moving out', matches: (tenant) => tenant.status === 'notice_given' },
  { key: 'moved_out', label: 'Moved out', matches: (tenant) => !isCurrentTenant(tenant) },
]

function TenantsPage({ onAddTenant }) {
  const navigate = useNavigate()
  const properties = useProperties().data
  const tenantsState = useApi('tenants', () => listTenants())
  const [activeFilter, setActiveFilter] = useState('all')

  const tenants = tenantsState.data || []
  const currentCount = tenants.filter(isCurrentTenant).length
  const filteredTenants = tenants.filter(
    tenantFilters.find((filter) => filter.key === activeFilter).matches
  )

  return (
    <>
      <div className="mb-7 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-[10px] text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--accent)]">
            Property
          </div>
          <h1 className="font-display text-[20px] font-semibold tracking-[-0.01em]">
            Tenants
          </h1>
          <p className="mt-2 text-[12px] text-[var(--ink-soft)]">
            {tenantsState.data
              ? `${currentCount} active ${currentCount === 1 ? 'tenant' : 'tenants'}${
                  properties
                    ? ` across ${properties.length} ${properties.length === 1 ? 'property' : 'properties'}`
                    : ''
                }`
              : 'Loading tenants...'}
          </p>
        </div>

        <button
          onClick={onAddTenant}
          className="inline-flex items-center gap-2 rounded-[8px] border border-[var(--accent)] bg-[var(--accent)] px-4 py-[10px] text-[12px] font-bold text-white"
        >
          <Plus size={15} />
          Add tenant
        </button>
      </div>

      <div className="mb-[18px] flex flex-wrap gap-7 border-b border-[var(--line)]">
        {tenantFilters.map((filter) => (
          <button
            key={filter.key}
            onClick={() => setActiveFilter(filter.key)}
            className={`pb-[12px] text-[11px] font-bold transition ${
              activeFilter === filter.key
                ? 'border-b-2 border-[var(--accent)] text-[var(--accent)]'
                : 'text-[var(--ink-faint)] hover:text-[var(--accent)]'
            }`}
          >
            {filter.label}
            {tenantsState.data ? ` (${tenants.filter(filter.matches).length})` : ''}
          </button>
        ))}
      </div>

      <section className="overflow-hidden rounded-[10px] border border-[var(--line)] bg-white">
        <DataState
          state={tenantsState}
          loadingLabel="Loading tenants..."
          isEmpty={() => !filteredTenants.length}
          empty={
            <EmptyState
              title={tenants.length ? 'No tenants match this filter' : 'No tenants yet'}
              message={
                tenants.length
                  ? 'Choose another filter to see more tenants.'
                  : 'Add a tenant to a vacant unit and they will appear here with their balance.'
              }
            />
          }
        >
          {() => (
            <div className="overflow-x-auto">
              <table className="min-w-[980px] w-full border-collapse">
                <thead>
                  <tr className="bg-[var(--bg)] text-left text-[9px] uppercase tracking-[0.05em] text-[var(--ink-faint)]">
                    <th className="px-[18px] py-[10px] font-bold">Tenant</th>
                    <th className="px-[18px] py-[10px] font-bold">Unit</th>
                    <th className="px-[18px] py-[10px] font-bold">Monthly rent</th>
                    <th className="px-[18px] py-[10px] font-bold">Balance</th>
                    <th className="px-[18px] py-[10px] font-bold">Status</th>
                    <th className="px-[18px] py-[10px] font-bold"></th>
                  </tr>
                </thead>

                <tbody>
                  {filteredTenants.map((tenant) => {
                    const status = tenantStatus(tenant)
                    const balance = tenantBalance(tenant)

                    return (
                      <tr
                        key={tenant.id}
                        onClick={() => navigate(`/tenants/${tenant.id}`)}
                        className="cursor-pointer border-b border-[var(--line-soft)] transition hover:bg-[var(--bg)] last:border-b-0"
                      >
                        <td className="px-[18px] py-[18px]">
                          <Link
                            to={`/tenants/${tenant.id}`}
                            onClick={(event) => event.stopPropagation()}
                            className="text-[12px] font-bold hover:text-[var(--accent)]"
                          >
                            {tenant.full_name}
                          </Link>
                          <div className="mt-[3px] text-[10px] text-[var(--ink-faint)]">
                            {formatPhone(tenant.phone)}
                          </div>
                        </td>

                        <td className="px-[18px] py-[18px] text-[12px]">
                          {tenant.property_name} · {tenant.unit_number}
                        </td>
                        <td className="font-mono px-[18px] py-[18px] text-[12px]">
                          {formatKES(tenant.monthly_rent)}
                        </td>

                        <td
                          className={`font-mono px-[18px] py-[18px] text-[12px] ${
                            balance.tone === 'danger' ? 'text-[#B3261E]' : 'text-[#2E7D4F]'
                          }`}
                        >
                          {balance.text}
                        </td>

                        <td className="px-[18px] py-[18px]">
                          <StatusBadge tone={status.tone}>{status.label}</StatusBadge>
                        </td>

                        <td className="px-[18px] py-[18px] text-[var(--ink-faint)]">
                          <MoreVertical size={17} />
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
  )
}

export default TenantsPage
