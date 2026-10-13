import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Download } from 'lucide-react'
import { exportAuditLog, listAuditActions, listAuditLogs, listUsers } from '../../api/admin'
import { DataState, EmptyState, FormError } from '../../components/common/DataState'
import StatusBadge from '../../components/common/StatusBadge'
import { inputClass, labelClass } from '../../components/common/Modal'
import { useApi } from '../../hooks/useApi'
import { formatDateTime, formatPhone, humanize } from '../../utils/format'

const PAGE_SIZE = 50

function personName(person) {
  return person.full_name || formatPhone(person.phone)
}

// "MANUAL_PAYMENT_RECORDED" -> "Manual payment recorded"
function actionLabel(action) {
  return humanize(action.toLowerCase())
}

// "amount: 5000 · payment_method: cash"
function detailsText(log) {
  const parts = []

  if (log.entity_type) {
    parts.push(`${humanize(log.entity_type)}${log.entity_id ? ` #${log.entity_id}` : ''}`)
  }

  Object.entries(log.metadata || {}).forEach(([key, value]) => {
    if (value === null || value === undefined || value === '') return
    // Shown as a badge next to the person instead.
    if (key === 'by_admin') return

    parts.push(`${key.replace(/_/g, ' ')}: ${typeof value === 'object' ? JSON.stringify(value) : value}`)
  })

  return parts.join(' · ')
}

function AdminAuditLogPage() {
  // Filters live in the URL so a filtered view can be linked to and survives a refresh.
  const [searchParams, setSearchParams] = useSearchParams()
  const filters = {
    account: searchParams.get('account') || '',
    user: searchParams.get('user') || '',
    action: searchParams.get('action') || '',
    from: searchParams.get('from') || '',
    to: searchParams.get('to') || '',
  }
  const page = Math.max(Number(searchParams.get('page')) || 1, 1)

  const usersState = useApi('admin-users', listUsers)
  const actionsState = useApi('admin-audit-actions', listAuditActions)
  const logsState = useApi(`admin-audit-${searchParams.toString()}`, () =>
    listAuditLogs({
      owner_id: filters.account,
      user_id: filters.user,
      action: filters.action,
      from_date: filters.from,
      to_date: filters.to,
      limit: PAGE_SIZE,
      offset: (page - 1) * PAGE_SIZE,
    })
  )

  const users = usersState.data || []
  const owners = users.filter((user) => user.role === 'owner')
  const total = logsState.data?.total || 0
  const lastPage = Math.max(Math.ceil(total / PAGE_SIZE), 1)
  const hasFilters = Object.values(filters).some(Boolean)
  // Passed to an entry's page so its back link returns to this same view.
  const entryFilters = searchParams.toString() ? `?${searchParams.toString()}` : ''
  const [exporting, setExporting] = useState(false)
  const [exportError, setExportError] = useState(null)

  // Downloads what the filters show, not just this page. The download is itself audited.
  async function handleExport() {
    setExporting(true)
    setExportError(null)

    try {
      await exportAuditLog({
        owner_id: filters.account,
        user_id: filters.user,
        action: filters.action,
        from_date: filters.from,
        to_date: filters.to,
      })
    } catch (downloadError) {
      setExportError(downloadError)
    } finally {
      setExporting(false)
    }
  }

  function setFilter(name, value) {
    const next = new URLSearchParams(searchParams)

    if (value) next.set(name, value)
    else next.delete(name)

    // A changed filter starts again from the first page.
    if (name !== 'page') next.delete('page')

    setSearchParams(next)
  }

  function userLabel(user) {
    const name = [user.first_name, user.last_name].filter(Boolean).join(' ') || 'Unnamed user'

    return `${name} · ${formatPhone(user.phone)}`
  }

  return (
    <>
      <div className="mb-7">
        <div className="mb-[10px] text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--accent-ink)]">
          Administration
        </div>
        <h1 className="font-display text-[20px] font-semibold tracking-[-0.01em]">Audit log</h1>
        <p className="mt-2 max-w-[640px] text-[12px] leading-[1.5] text-[var(--ink-soft)]">
          Every recorded action across all owner accounts: who did it, in
          which account, and when. Entries marked System were done
          automatically, such as monthly billing or an incoming M-Pesa payment.
        </p>
      </div>

      <section className="mb-4 rounded-[10px] border border-[var(--line)] bg-[var(--surface)] p-[18px]">
        <div className="grid gap-[14px] sm:grid-cols-2 xl:grid-cols-5">
          <div>
            <label className={labelClass}>Owner account</label>
            <select
              value={filters.account}
              onChange={(event) => setFilter('account', event.target.value)}
              className={inputClass}
            >
              <option value="">All accounts</option>
              {owners.map((owner) => (
                <option key={owner.user_id} value={owner.user_id}>{userLabel(owner)}</option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelClass}>Done by</label>
            <select
              value={filters.user}
              onChange={(event) => setFilter('user', event.target.value)}
              className={inputClass}
            >
              <option value="">Anyone</option>
              {users.map((user) => (
                <option key={user.user_id} value={user.user_id}>
                  {userLabel(user)} ({user.role === 'user' ? 'no role' : user.role})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelClass}>Action</label>
            <select
              value={filters.action}
              onChange={(event) => setFilter('action', event.target.value)}
              className={inputClass}
            >
              <option value="">All actions</option>
              {(actionsState.data || []).map((action) => (
                <option key={action} value={action}>{actionLabel(action)}</option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelClass}>From</label>
            <input
              type="date"
              value={filters.from}
              max={filters.to || undefined}
              onChange={(event) => setFilter('from', event.target.value)}
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>To</label>
            <input
              type="date"
              value={filters.to}
              min={filters.from || undefined}
              onChange={(event) => setFilter('to', event.target.value)}
              className={inputClass}
            />
          </div>
        </div>

        {hasFilters ? (
          <button
            type="button"
            onClick={() => setSearchParams({})}
            className="mt-3 text-[11px] font-bold text-[var(--accent-ink)] hover:underline"
          >
            Clear filters
          </button>
        ) : null}
      </section>

      <section className="overflow-hidden rounded-[10px] border border-[var(--line)] bg-[var(--surface)]">
        {exportError ? (
          <div className="border-b border-[var(--line)] px-[18px] py-3">
            <FormError error={exportError} />
          </div>
        ) : null}

        <div className="flex items-center justify-between border-b border-[var(--line)] px-[18px] py-4">
          <h3 className="flex items-center gap-3 text-[12px] font-bold">
            Activity
            <button
              type="button"
              onClick={handleExport}
              disabled={exporting || !total}
              title="Downloads up to 5,000 entries matching the filters"
              className="inline-flex items-center gap-2 rounded-[8px] border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-[11px] font-bold disabled:opacity-50"
            >
              <Download size={13} />
              {exporting ? 'Preparing...' : 'Export CSV'}
            </button>
          </h3>
          <span className="text-[10px] text-[var(--ink-faint)]">
            {logsState.data
              ? total
                ? `${(page - 1) * PAGE_SIZE + 1}-${Math.min(page * PAGE_SIZE, total)} of ${total}`
                : '0 entries'
              : ''}
          </span>
        </div>

        <DataState
          state={logsState}
          loadingLabel="Loading activity..."
          isEmpty={(data) => !data.logs.length}
          empty={
            <EmptyState
              title="No activity found"
              message={hasFilters ? 'Nothing matches these filters.' : 'Actions appear here as people use the system.'}
            />
          }
        >
          {(data) => (
            <div className="overflow-x-auto">
              <table className="min-w-[1160px] w-full border-collapse">
                <thead>
                  <tr className="bg-[var(--bg)] text-left text-[9px] uppercase tracking-[0.05em] text-[var(--ink-faint)]">
                    <th className="px-[18px] py-[10px] font-bold">When</th>
                    <th className="px-[18px] py-[10px] font-bold">Done by</th>
                    <th className="px-[18px] py-[10px] font-bold">Account</th>
                    <th className="px-[18px] py-[10px] font-bold">Action</th>
                    <th className="px-[18px] py-[10px] font-bold">Details</th>
                    <th className="px-[18px] py-[10px] font-bold">IP address</th>
                    <th className="px-[18px] py-[10px] font-bold"></th>
                  </tr>
                </thead>
                <tbody>
                  {data.logs.map((log) => (
                    <tr key={log.id} className="border-b border-[var(--line-soft)] align-top last:border-b-0">
                      <td className="whitespace-nowrap px-[18px] py-[13px] text-[12px]">
                        {formatDateTime(log.created_at)}
                      </td>
                      <td className="px-[18px] py-[13px]">
                        {log.actor ? (
                          <>
                            <div className="text-[12px] font-bold">{personName(log.actor)}</div>
                            <div className="mt-[3px] text-[10px] text-[var(--ink-faint)]">
                              {log.actor.role === 'user' ? 'No role' : humanize(log.actor.role)}
                            </div>
                            {/* Done by the admin while working inside the owner's account. */}
                            {log.metadata?.by_admin ? (
                              <div className="mt-[5px]">
                                <StatusBadge tone="info">In owner&apos;s account</StatusBadge>
                              </div>
                            ) : null}
                          </>
                        ) : (
                          <div className="text-[12px] font-bold text-[var(--ink-soft)]">System</div>
                        )}
                      </td>
                      <td className="px-[18px] py-[13px] text-[12px]">
                        {log.account ? personName(log.account) : '-'}
                      </td>
                      <td className="px-[18px] py-[13px] text-[12px] font-bold">
                        <Link
                          to={`/admin/audit-log/${log.id}`}
                          state={{ filters: entryFilters }}
                          className="hover:text-[var(--accent-ink)] hover:underline"
                        >
                          {actionLabel(log.action)}
                        </Link>
                      </td>
                      <td className="max-w-[340px] px-[18px] py-[13px] text-[11px] leading-[1.5] text-[var(--ink-soft)]">
                        <div className="line-clamp-3 break-words" title={detailsText(log)}>
                          {detailsText(log) || '-'}
                        </div>
                      </td>
                      <td className="font-mono whitespace-nowrap px-[18px] py-[13px] text-[11px] text-[var(--ink-faint)]">
                        {log.ip_address || '-'}
                      </td>
                      <td className="px-[18px] py-[13px] text-right">
                        <Link
                          to={`/admin/audit-log/${log.id}`}
                          state={{ filters: entryFilters }}
                          className="rounded-[8px] border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-[11px] font-bold"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </DataState>

        {total > PAGE_SIZE ? (
          <div className="flex items-center justify-end gap-2 border-t border-[var(--line)] px-[18px] py-3">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setFilter('page', page > 2 ? String(page - 1) : '')}
              className="rounded-[8px] border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-[11px] font-bold disabled:opacity-50"
            >
              Previous
            </button>
            <span className="text-[11px] text-[var(--ink-faint)]">
              Page {page} of {lastPage}
            </span>
            <button
              type="button"
              disabled={page >= lastPage}
              onClick={() => setFilter('page', String(page + 1))}
              className="rounded-[8px] border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-[11px] font-bold disabled:opacity-50"
            >
              Next
            </button>
          </div>
        ) : null}
      </section>
    </>
  )
}

export default AdminAuditLogPage
