import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { getOwnerDetail } from '../../api/admin'
import { DataState, EmptyState, FormError } from '../../components/common/DataState'
import { primaryButtonClass } from '../../components/common/Modal'
import StatusBadge from '../../components/common/StatusBadge'
import StatCard from '../../components/dashboard/StatCard'
import { useAuth } from '../../context/AuthContext'
import { useApi } from '../../hooks/useApi'
import { formatDate, formatDateTime, formatKES, formatNumber, formatPhone, humanize } from '../../utils/format'
import { SENDER_STATUS } from '../../utils/labels'

const cardClass = 'overflow-hidden rounded-[10px] border border-[var(--line)] bg-[var(--surface)]'
const headRowClass = 'bg-[var(--bg)] text-left text-[9px] uppercase tracking-[0.05em] text-[var(--ink-faint)]'

// One owner account, read-only. "Open account" is the way to change anything in it.
function AdminOwnerPage() {
  const { ownerId } = useParams()
  const navigate = useNavigate()
  const { openOwnerAccount } = useAuth()
  const state = useApi(`admin-owner-${ownerId}`, () => getOwnerDetail(ownerId))
  const [opening, setOpening] = useState(false)
  const [error, setError] = useState(null)

  async function open() {
    setOpening(true)
    setError(null)

    try {
      await openOwnerAccount(ownerId)
      navigate('/dashboard')
    } catch (openError) {
      setError(openError)
      setOpening(false)
    }
  }

  return (
    <DataState state={state} loadingLabel="Loading owner account...">
      {({ owner, totals, properties, caretakers, recent_activity: activity }) => (
        <>
          <div className="mb-7 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <Link
                to="/admin/overview"
                className="mb-[10px] block text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--accent-ink)] hover:underline"
              >
                Overview / Owner account
              </Link>
              <h1 className="flex flex-wrap items-center gap-3 font-display text-[20px] font-semibold tracking-[-0.01em]">
                {owner.name || 'Unnamed owner'}
                <StatusBadge tone={owner.status === 'active' ? 'success' : 'danger'}>
                  {humanize(owner.status)}
                </StatusBadge>
              </h1>
              <p className="mt-2 text-[12px] text-[var(--ink-soft)]">
                {formatPhone(owner.phone)}
                {owner.email ? ` · ${owner.email}` : ''} · joined {formatDate(owner.created_at)} · last
                signed in {formatDateTime(owner.last_login_at, 'never')}
              </p>
            </div>

            <div className="flex flex-wrap gap-[10px]">
              <Link
                to={`/admin/audit-log?account=${owner.user_id}`}
                className="rounded-[8px] border border-[var(--line)] bg-[var(--surface)] px-4 py-[10px] text-[12px] font-bold"
              >
                Full activity
              </Link>
              <button type="button" onClick={open} disabled={opening} className={primaryButtonClass}>
                {opening ? 'Opening...' : 'Open account'}
              </button>
            </div>
          </div>

          {error ? (
            <div className="mb-[14px]">
              <FormError error={error} />
            </div>
          ) : null}

          <div className="mb-[18px] grid gap-[14px] sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Properties"
              value={formatNumber(totals.properties)}
              note={`${formatNumber(totals.units)} ${totals.units === 1 ? 'unit' : 'units'}`}
            />
            <StatCard
              label="Tenants"
              value={formatNumber(totals.tenants)}
              note={`${totals.caretakers} ${totals.caretakers === 1 ? 'caretaker' : 'caretakers'}`}
            />
            <StatCard
              label="Collected this month"
              value={formatKES(totals.collected_this_month)}
              note={`${formatNumber(totals.sms_this_month)} SMS this month`}
            />
            <StatCard
              label="Owed by tenants"
              value={formatKES(totals.owed_by_tenants)}
              note="Unpaid bills, all tenants"
              tone={totals.owed_by_tenants > 0 ? 'danger' : 'muted'}
            />
          </div>

          <section className={`${cardClass} mb-4`}>
            <div className="border-b border-[var(--line)] px-[18px] py-4">
              <h3 className="text-[12px] font-bold">Properties</h3>
            </div>

            {properties.length ? (
              <div className="overflow-x-auto">
                <table className="min-w-[760px] w-full border-collapse">
                  <thead>
                    <tr className={headRowClass}>
                      <th className="px-[18px] py-[10px] font-bold">Property</th>
                      <th className="px-[18px] py-[10px] font-bold">Units</th>
                      <th className="px-[18px] py-[10px] font-bold">Tenants</th>
                      <th className="px-[18px] py-[10px] font-bold">Caretaker</th>
                      <th className="px-[18px] py-[10px] font-bold">SMS sender</th>
                    </tr>
                  </thead>
                  <tbody>
                    {properties.map((property) => (
                      <tr key={property.id} className="border-b border-[var(--line-soft)] text-[12px] last:border-b-0">
                        <td className="px-[18px] py-[13px]">
                          <span className="font-bold">{property.name}</span>
                          {property.status === 'archived' ? ' (archived)' : ''}
                          <span className="block text-[10px] text-[var(--ink-faint)]">{property.location}</span>
                        </td>
                        <td className="font-mono px-[18px] py-[13px]">{property.units}</td>
                        <td className="font-mono px-[18px] py-[13px]">{property.tenants}</td>
                        <td className="px-[18px] py-[13px]">{property.caretaker_name || '-'}</td>
                        <td className="px-[18px] py-[13px]">
                          {property.sms_sender_id ? (
                            <>
                              <span className="font-mono">{property.sms_sender_id}</span>{' '}
                              <StatusBadge tone={SENDER_STATUS[property.sms_sender_status || 'pending'][1]}>
                                {SENDER_STATUS[property.sms_sender_status || 'pending'][0]}
                              </StatusBadge>
                            </>
                          ) : (
                            'Default'
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState title="No properties yet" message="This owner has not added a property." />
            )}
          </section>

          <div className="grid gap-4 xl:grid-cols-2">
            <section className={cardClass}>
              <div className="border-b border-[var(--line)] px-[18px] py-4">
                <h3 className="text-[12px] font-bold">Caretakers</h3>
              </div>

              {caretakers.length ? (
                caretakers.map((caretaker) => (
                  <div
                    key={caretaker.user_id}
                    className="flex items-center justify-between gap-3 border-b border-[var(--line-soft)] px-[18px] py-[11px] text-[12px] last:border-b-0"
                  >
                    <span>
                      <span className="font-bold">{caretaker.name}</span>
                      <span className="block text-[10px] text-[var(--ink-faint)]">
                        {formatPhone(caretaker.phone)} · last signed in{' '}
                        {formatDateTime(caretaker.last_login_at, 'never')}
                      </span>
                    </span>
                    <StatusBadge tone={caretaker.status === 'active' ? 'success' : 'neutral'}>
                      {humanize(caretaker.status)}
                    </StatusBadge>
                  </div>
                ))
              ) : (
                <EmptyState title="No caretakers" message="This owner has not added a caretaker." />
              )}
            </section>

            <section className={cardClass}>
              <div className="border-b border-[var(--line)] px-[18px] py-4">
                <h3 className="text-[12px] font-bold">Recent activity</h3>
              </div>

              {activity.length ? (
                activity.map((log) => (
                  <Link
                    key={log.id}
                    to={`/admin/audit-log/${log.id}`}
                    state={{ filters: `?account=${owner.user_id}` }}
                    className="flex items-start justify-between gap-3 border-b border-[var(--line-soft)] px-[18px] py-[11px] text-[12px] last:border-b-0 hover:bg-[var(--line-soft)]"
                  >
                    <span>
                      <span className="font-bold">{humanize(log.action.toLowerCase())}</span>
                      <span className="block text-[10px] text-[var(--ink-faint)]">
                        {log.actor ? log.actor.full_name || formatPhone(log.actor.phone) : 'System'}
                        {log.metadata?.by_admin ? ' (admin, in this account)' : ''}
                      </span>
                    </span>
                    <span className="shrink-0 text-[10px] text-[var(--ink-faint)]">
                      {formatDateTime(log.created_at)}
                    </span>
                  </Link>
                ))
              ) : (
                <EmptyState title="No activity yet" message="Nothing has been recorded in this account." />
              )}
            </section>
          </div>
        </>
      )}
    </DataState>
  )
}

export default AdminOwnerPage
