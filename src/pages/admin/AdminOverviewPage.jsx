import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Search } from 'lucide-react'
import { getAdminOverview } from '../../api/admin'
import { DataState, EmptyState, FormError } from '../../components/common/DataState'
import StatusBadge from '../../components/common/StatusBadge'
import StatCard from '../../components/dashboard/StatCard'
import { useAuth } from '../../context/AuthContext'
import { useApi } from '../../hooks/useApi'
import { formatDateTime, formatKES, formatNumber, formatPhone, humanize } from '../../utils/format'

const smallButtonClass =
  'rounded-[8px] border border-[var(--accent)] bg-[var(--accent)] px-3 py-2 text-[11px] font-bold text-white transition hover:border-[var(--accent-hover)] hover:bg-[var(--accent-hover)] disabled:opacity-50'

// The whole platform at a glance, and the way into any owner's account.
function AdminOverviewPage() {
  const navigate = useNavigate()
  const { openOwnerAccount } = useAuth()
  const overviewState = useApi('admin-overview', getAdminOverview)
  const [search, setSearch] = useState('')
  const [opening, setOpening] = useState(null)
  const [error, setError] = useState(null)

  const totals = overviewState.data?.totals
  const term = search.trim().toLowerCase()
  const owners = (overviewState.data?.owners || []).filter(
    (owner) =>
      !term ||
      owner.name.toLowerCase().includes(term) ||
      owner.phone.replace(/\s/g, '').includes(term.replace(/\s/g, ''))
  )

  // Opening is written to the audit log first; then the admin lands on that owner's dashboard.
  async function open(owner) {
    setOpening(owner.user_id)
    setError(null)

    try {
      await openOwnerAccount(owner.user_id)
      navigate('/dashboard')
    } catch (openError) {
      setError(openError)
      setOpening(null)
    }
  }

  return (
    <>
      <div className="mb-7">
        <div className="mb-[10px] text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--accent-ink)]">
          Administration
        </div>
        <h1 className="font-display text-[20px] font-semibold tracking-[-0.01em]">Overview</h1>
        <p className="mt-2 max-w-[640px] text-[12px] leading-[1.5] text-[var(--ink-soft)]">
          Every owner account on Kodi. Open an account to see and do
          everything its owner can: properties, tenants, payments, SMS,
          reports and settings. What you do there is recorded in the audit
          log under your name.
        </p>
      </div>

      <DataState state={overviewState} loadingLabel="Loading overview...">
        {() => (
          <>
            <div className="mb-[18px] grid gap-[14px] sm:grid-cols-2 xl:grid-cols-4">
              <StatCard
                label="Owners"
                value={formatNumber(totals.owners)}
                note={`${totals.joined_this_month} new ${totals.joined_this_month === 1 ? 'account' : 'accounts'} this month`}
              />
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
                note={`${formatNumber(totals.sms_this_month)} SMS sent, ${formatKES(totals.sms_cost_this_month)}`}
              />
            </div>

            {totals.waiting_for_access ? (
              <p className="mb-[18px] text-[11px] leading-[1.5] text-[var(--warning)]">
                {totals.waiting_for_access}{' '}
                {totals.waiting_for_access === 1 ? 'person has' : 'people have'} signed in and{' '}
                {totals.waiting_for_access === 1 ? 'is' : 'are'} waiting to be made an owner. See Users.
              </p>
            ) : null}

            {error ? (
              <div className="mb-[14px]">
                <FormError error={error} />
              </div>
            ) : null}

            <section className="overflow-hidden rounded-[10px] border border-[var(--line)] bg-[var(--surface)]">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--line)] px-[18px] py-4">
                <h3 className="text-[12px] font-bold">Owner accounts</h3>

                <div className="flex w-full max-w-[280px] items-center gap-2 rounded-[8px] border border-[var(--line)] bg-[var(--bg)] px-3 py-2 text-[12px] text-[var(--ink-faint)] focus-within:border-[var(--accent)]">
                  <Search size={15} />
                  <input
                    type="text"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search by name or phone..."
                    aria-label="Search owners"
                    className="w-full bg-transparent text-[var(--ink)] outline-none placeholder:text-[var(--ink-faint)]"
                  />
                </div>
              </div>

              {owners.length ? (
                <div className="overflow-x-auto">
                  <table className="min-w-[1040px] w-full border-collapse">
                    <thead>
                      <tr className="bg-[var(--bg)] text-left text-[9px] uppercase tracking-[0.05em] text-[var(--ink-faint)]">
                        <th className="px-[18px] py-[10px] font-bold">Owner</th>
                        <th className="px-[18px] py-[10px] font-bold">Status</th>
                        <th className="px-[18px] py-[10px] font-bold">Properties</th>
                        <th className="px-[18px] py-[10px] font-bold">Units</th>
                        <th className="px-[18px] py-[10px] font-bold">Tenants</th>
                        <th className="px-[18px] py-[10px] font-bold">Collected this month</th>
                        <th className="px-[18px] py-[10px] font-bold">SMS this month</th>
                        <th className="px-[18px] py-[10px] font-bold">Last sign-in</th>
                        <th className="px-[18px] py-[10px] font-bold"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {owners.map((owner) => (
                        <tr key={owner.user_id} className="border-b border-[var(--line-soft)] text-[12px] last:border-b-0">
                          <td className="px-[18px] py-[13px]">
                            <Link
                              to={`/admin/owners/${owner.user_id}`}
                              className="font-bold hover:text-[var(--accent-ink)] hover:underline"
                            >
                              {owner.name || 'Unnamed owner'}
                            </Link>
                            <span className="block font-mono text-[10px] text-[var(--ink-faint)]">
                              {formatPhone(owner.phone)}
                            </span>
                          </td>
                          <td className="px-[18px] py-[13px]">
                            <StatusBadge tone={owner.status === 'active' ? 'success' : 'neutral'}>
                              {humanize(owner.status)}
                            </StatusBadge>
                          </td>
                          <td className="font-mono px-[18px] py-[13px]">{owner.properties}</td>
                          <td className="font-mono px-[18px] py-[13px]">{owner.units}</td>
                          <td className="font-mono px-[18px] py-[13px]">
                            {owner.tenants}
                            {owner.caretakers ? (
                              <span className="block text-[10px] text-[var(--ink-faint)]">
                                {owner.caretakers} {owner.caretakers === 1 ? 'caretaker' : 'caretakers'}
                              </span>
                            ) : null}
                          </td>
                          <td className="font-mono px-[18px] py-[13px]">
                            {formatKES(owner.collected_this_month)}
                          </td>
                          <td className="font-mono px-[18px] py-[13px]">
                            {owner.sms_this_month}
                            {owner.sms_this_month ? (
                              <span className="block text-[10px] text-[var(--ink-faint)]">
                                {formatKES(owner.sms_cost_this_month)}
                              </span>
                            ) : null}
                          </td>
                          <td className="px-[18px] py-[13px]">{formatDateTime(owner.last_login_at, 'Never')}</td>
                          <td className="px-[18px] py-[13px] text-right">
                            <button
                              type="button"
                              onClick={() => open(owner)}
                              disabled={opening !== null}
                              className={smallButtonClass}
                            >
                              {opening === owner.user_id ? 'Opening...' : 'Open account'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <EmptyState
                  title={term ? 'No owner matches' : 'No owner accounts yet'}
                  message={
                    term
                      ? 'Try another name or phone number.'
                      : 'Make someone an owner on the Users page and they appear here.'
                  }
                />
              )}
            </section>
          </>
        )}
      </DataState>
    </>
  )
}

export default AdminOverviewPage
