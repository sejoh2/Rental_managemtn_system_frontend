import { Link, useLocation, useParams } from 'react-router-dom'
import { getAuditLog } from '../../api/admin'
import { DataState, EmptyState } from '../../components/common/DataState'
import StatusBadge from '../../components/common/StatusBadge'
import { useApi } from '../../hooks/useApi'
import { formatDateTime, formatPhone, humanize } from '../../utils/format'

const cardClass = 'overflow-hidden rounded-[10px] border border-[var(--line)] bg-[var(--surface)]'

function personName(person) {
  return person.full_name || formatPhone(person.phone)
}

// "MANUAL_PAYMENT_RECORDED" -> "Manual payment recorded"
function actionLabel(action) {
  return humanize(action.toLowerCase())
}

// "payment_method" -> "Payment method"
function fieldLabel(key) {
  return humanize(key)
}

// A value from the entry's details: text and numbers as they are, lists and nested values spelled out.
function DetailValue({ value }) {
  if (value === null || value === undefined || value === '') {
    return <span className="text-[var(--ink-faint)]">-</span>
  }

  if (typeof value === 'boolean') return value ? 'Yes' : 'No'

  if (Array.isArray(value)) {
    if (!value.length) return <span className="text-[var(--ink-faint)]">None</span>

    // A list of plain values reads best on one line.
    if (value.every((item) => typeof item !== 'object' || item === null)) {
      return value.map((item) => String(item).replace(/_/g, ' ')).join(', ')
    }

    return (
      <div className="grid gap-2">
        {value.map((item, index) => (
          <div key={index} className="rounded-[8px] border border-[var(--line-soft)] px-3 py-2">
            <DetailValue value={item} />
          </div>
        ))}
      </div>
    )
  }

  if (typeof value === 'object') {
    return (
      <div className="grid gap-[3px]">
        {Object.entries(value).map(([key, item]) => (
          <div key={key}>
            <span className="text-[var(--ink-faint)]">{fieldLabel(key)}: </span>
            <DetailValue value={item} />
          </div>
        ))}
      </div>
    )
  }

  return String(value)
}

function Row({ label, children }) {
  return (
    <div className="grid gap-1 border-b border-[var(--line-soft)] px-[18px] py-[11px] text-[12px] last:border-b-0 sm:grid-cols-[200px_1fr] sm:gap-4">
      <span className="text-[var(--ink-soft)]">{label}</span>
      <span className="min-w-0 break-words font-bold">{children}</span>
    </div>
  )
}

// One audit entry in full, and what else happened to the same record.
function AdminAuditEntryPage() {
  const { logId } = useParams()
  // The filters the admin came from, so "back" returns to the same view.
  const filters = useLocation().state?.filters || ''
  const state = useApi(`admin-audit-entry-${logId}`, () => getAuditLog(logId))

  return (
    <DataState state={state} loadingLabel="Loading entry...">
      {({ log, related }) => {
        const details = Object.entries(log.metadata || {}).filter(([key]) => key !== 'by_admin')

        return (
          <>
            <div className="mb-7">
              <Link
                to={`/admin/audit-log${filters}`}
                className="mb-[10px] block text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--accent-ink)] hover:underline"
              >
                Audit log / Entry {log.id}
              </Link>
              <h1 className="flex flex-wrap items-center gap-3 font-display text-[20px] font-semibold tracking-[-0.01em]">
                {actionLabel(log.action)}
                {log.metadata?.by_admin ? (
                  <StatusBadge tone="info">Done by the admin in the owner&apos;s account</StatusBadge>
                ) : null}
              </h1>
              <p className="mt-2 text-[12px] text-[var(--ink-soft)]">
                {formatDateTime(log.created_at)} · {log.actor ? personName(log.actor) : 'System'}
                {log.account ? ` · in ${personName(log.account)}'s account` : ''}
              </p>
            </div>

            <div className="grid gap-4 xl:grid-cols-2">
              <section className={cardClass}>
                <div className="border-b border-[var(--line)] px-[18px] py-4">
                  <h3 className="text-[12px] font-bold">Who, when and where</h3>
                </div>

                <Row label="When">{formatDateTime(log.created_at)}</Row>
                <Row label="Done by">
                  {log.actor ? (
                    <>
                      <Link
                        to={`/admin/audit-log?user=${log.actor.user_id}`}
                        className="hover:text-[var(--accent-ink)] hover:underline"
                        title="Everything this person has done"
                      >
                        {personName(log.actor)}
                      </Link>
                      <span className="block text-[10px] font-normal text-[var(--ink-faint)]">
                        {log.actor.role === 'user' ? 'No role' : humanize(log.actor.role)} ·{' '}
                        {formatPhone(log.actor.phone)}
                      </span>
                    </>
                  ) : (
                    <>
                      System
                      <span className="block text-[10px] font-normal text-[var(--ink-faint)]">
                        Done automatically, such as monthly billing or an incoming payment
                      </span>
                    </>
                  )}
                </Row>
                <Row label="Owner account">
                  {log.account ? (
                    <>
                      <Link
                        to={`/admin/owners/${log.account.owner_id}`}
                        className="hover:text-[var(--accent-ink)] hover:underline"
                      >
                        {personName(log.account)}
                      </Link>
                      <span className="block text-[10px] font-normal text-[var(--ink-faint)]">
                        {formatPhone(log.account.phone)}
                      </span>
                    </>
                  ) : (
                    'None (not inside an owner account)'
                  )}
                </Row>
                <Row label="Action">
                  {actionLabel(log.action)}
                  <span className="block font-mono text-[10px] font-normal text-[var(--ink-faint)]">
                    {log.action}
                  </span>
                </Row>
                <Row label="Record">
                  {log.entity_type
                    ? `${humanize(log.entity_type)}${log.entity_id ? ` number ${log.entity_id}` : ''}`
                    : '-'}
                </Row>
                <Row label="IP address">
                  <span className="font-mono">{log.ip_address || '-'}</span>
                </Row>
              </section>

              <section className={cardClass}>
                <div className="border-b border-[var(--line)] px-[18px] py-4">
                  <h3 className="text-[12px] font-bold">Details recorded</h3>
                </div>

                {details.length ? (
                  details.map(([key, value]) => (
                    <Row key={key} label={fieldLabel(key)}>
                      <DetailValue value={value} />
                    </Row>
                  ))
                ) : (
                  <EmptyState title="No further details" message="This action was recorded without extra details." />
                )}
              </section>
            </div>

            <section className={`${cardClass} mt-4`}>
              <div className="border-b border-[var(--line)] px-[18px] py-4">
                <h3 className="text-[12px] font-bold">
                  {log.entity_type
                    ? `Other activity on this ${humanize(log.entity_type).toLowerCase()}`
                    : 'Other activity on this record'}
                </h3>
                <p className="mt-[3px] text-[10px] text-[var(--ink-faint)]">
                  Up to 30 other entries about the same record, newest first.
                </p>
              </div>

              {related.length ? (
                related.map((item) => (
                  <Link
                    key={item.id}
                    to={`/admin/audit-log/${item.id}`}
                    state={{ filters }}
                    className="flex items-start justify-between gap-3 border-b border-[var(--line-soft)] px-[18px] py-[11px] text-[12px] last:border-b-0 hover:bg-[var(--line-soft)]"
                  >
                    <span>
                      <span className="font-bold">{actionLabel(item.action)}</span>
                      <span className="block text-[10px] text-[var(--ink-faint)]">
                        {item.actor ? personName(item.actor) : 'System'}
                        {item.metadata?.by_admin ? ' (admin, in the owner’s account)' : ''}
                      </span>
                    </span>
                    <span className="shrink-0 text-[10px] text-[var(--ink-faint)]">
                      {formatDateTime(item.created_at)}
                    </span>
                  </Link>
                ))
              ) : (
                <EmptyState
                  title="Nothing else recorded"
                  message={
                    log.entity_type && log.entity_id
                      ? 'This is the only entry about this record.'
                      : 'This entry is not tied to one record.'
                  }
                />
              )}
            </section>
          </>
        )
      }}
    </DataState>
  )
}

export default AdminAuditEntryPage
