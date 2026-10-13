import { useState } from 'react'
import { Link } from 'react-router-dom'
import { getSmsUsage, listSenderIds, reviewSenderId } from '../../api/admin'
import { DataState, EmptyState, FormError } from '../../components/common/DataState'
import {
  Field,
  ModalBody,
  ModalFooter,
  ModalShell,
  primaryButtonClass,
  secondaryButtonClass,
} from '../../components/common/Modal'
import StatusBadge from '../../components/common/StatusBadge'
import { useApi } from '../../hooks/useApi'
import { formatDateTime, formatKES, formatMonth, formatNumber, formatPhone, toDateInput } from '../../utils/format'
import { SENDER_STATUS } from '../../utils/labels'

const cardClass = 'overflow-hidden rounded-[10px] border border-[var(--line)] bg-[var(--surface)]'
const headRowClass = 'bg-[var(--bg)] text-left text-[9px] uppercase tracking-[0.05em] text-[var(--ink-faint)]'
const smallButtonClass =
  'rounded-[8px] border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-[11px] font-bold transition hover:text-[var(--accent-ink)]'

// Sender IDs owners want to use, and what owners send through the platform's own sender.
function AdminSmsPage() {
  const sendersState = useApi('admin-sender-ids', listSenderIds)
  const usageState = useApi('admin-sms-usage', getSmsUsage)
  // { request, decision } while the admin confirms a decision.
  const [reviewing, setReviewing] = useState(null)

  return (
    <>
      <div className="mb-7">
        <div className="mb-[10px] text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--accent-ink)]">
          Administration
        </div>
        <h1 className="font-display text-[20px] font-semibold tracking-[-0.01em]">SMS</h1>
        <p className="mt-2 max-w-[640px] text-[12px] leading-[1.5] text-[var(--ink-soft)]">
          An owner&apos;s own sender ID is used only after you approve it
          here. Until then, and if you reject it, their messages go out from
          the platform&apos;s default sender.
        </p>
      </div>

      <section className={`${cardClass} mb-4`}>
        <div className="border-b border-[var(--line)] px-[18px] py-4">
          <h3 className="text-[12px] font-bold">Sender IDs</h3>
          <p className="mt-[3px] text-[10px] leading-[1.5] text-[var(--ink-faint)]">
            Approve a sender ID only once it is registered with Africa&apos;s
            Talking, otherwise every message sent with it fails. One decision
            covers all of that owner&apos;s properties using it, and you can
            change it later.
          </p>
        </div>

        <DataState
          state={sendersState}
          loadingLabel="Loading sender IDs..."
          isEmpty={(data) => !data.length}
          empty={
            <EmptyState
              title="No sender IDs"
              message="When an owner enters their own sender ID on a property, it appears here for approval."
            />
          }
        >
          {(requests) => (
            <div className="overflow-x-auto">
              <table className="min-w-[900px] w-full border-collapse">
                <thead>
                  <tr className={headRowClass}>
                    <th className="px-[18px] py-[10px] font-bold">Sender ID</th>
                    <th className="px-[18px] py-[10px] font-bold">Owner</th>
                    <th className="px-[18px] py-[10px] font-bold">Used on</th>
                    <th className="px-[18px] py-[10px] font-bold">Requested</th>
                    <th className="px-[18px] py-[10px] font-bold">Status</th>
                    <th className="px-[18px] py-[10px] font-bold"></th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map((request) => (
                    <tr key={request.id} className="border-b border-[var(--line-soft)] text-[12px] last:border-b-0">
                      <td className="font-mono px-[18px] py-[13px] font-bold">{request.sender_id}</td>
                      <td className="px-[18px] py-[13px]">
                        <Link
                          to={`/admin/owners/${request.owner_id}`}
                          className="font-bold hover:text-[var(--accent-ink)] hover:underline"
                        >
                          {request.owner_name || 'Unnamed owner'}
                        </Link>
                        <span className="block text-[10px] text-[var(--ink-faint)]">
                          {formatPhone(request.owner_phone)}
                        </span>
                      </td>
                      <td className="px-[18px] py-[13px]">
                        {request.property_names.length ? request.property_names.join(', ') : 'No property now'}
                      </td>
                      <td className="px-[18px] py-[13px]">{formatDateTime(request.requested_at)}</td>
                      <td className="px-[18px] py-[13px]">
                        <StatusBadge tone={SENDER_STATUS[request.status][1]}>
                          {SENDER_STATUS[request.status][0]}
                        </StatusBadge>
                        {request.note ? (
                          <span className="mt-1 block text-[10px] text-[var(--ink-faint)]">{request.note}</span>
                        ) : null}
                      </td>
                      <td className="px-[18px] py-[13px]">
                        <div className="flex justify-end gap-2">
                          {request.status === 'approved' ? null : (
                            <button
                              onClick={() => setReviewing({ request, decision: 'approved' })}
                              className={smallButtonClass}
                            >
                              Approve
                            </button>
                          )}
                          {request.status === 'rejected' ? null : (
                            <button
                              onClick={() => setReviewing({ request, decision: 'rejected' })}
                              className="rounded-[8px] border border-[var(--danger)] bg-[var(--surface)] px-3 py-2 text-[11px] font-bold text-[var(--danger)] transition hover:bg-[var(--danger-soft)]"
                            >
                              Reject
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </DataState>
      </section>

      <section className={cardClass}>
        <div className="border-b border-[var(--line)] px-[18px] py-4">
          <h3 className="text-[12px] font-bold">
            Sent through the platform&apos;s sender - {formatMonth(toDateInput())}
          </h3>
          <p className="mt-[3px] text-[10px] leading-[1.5] text-[var(--ink-faint)]">
            Messages the platform pays for. Messages an owner sends with their
            own approved sender ID are on their own account and are not
            counted here.
          </p>
        </div>

        <DataState
          state={usageState}
          loadingLabel="Loading SMS usage..."
          isEmpty={(data) => !data.owners.length}
          empty={
            <EmptyState
              title="Nothing sent this month"
              message="No owner has sent a message through the platform's sender this month."
            />
          }
        >
          {(usage) => (
            <div className="overflow-x-auto">
              <table className="min-w-[680px] w-full border-collapse">
                <thead>
                  <tr className={headRowClass}>
                    <th className="px-[18px] py-[10px] font-bold">Owner</th>
                    <th className="px-[18px] py-[10px] font-bold">Messages</th>
                    <th className="px-[18px] py-[10px] font-bold">Accepted</th>
                    <th className="px-[18px] py-[10px] font-bold">Failed</th>
                    <th className="px-[18px] py-[10px] font-bold">Cost</th>
                  </tr>
                </thead>
                <tbody>
                  {[...usage.owners, { ...usage.totals, owner_id: 'total' }].map((row) => (
                    <tr
                      key={row.owner_id}
                      className={`border-b border-[var(--line-soft)] text-[12px] last:border-b-0 ${
                        row.owner_id === 'total' ? 'font-bold' : ''
                      }`}
                    >
                      <td className="px-[18px] py-[13px]">
                        {row.owner_id === 'total' ? (
                          'Total'
                        ) : (
                          <Link
                            to={`/admin/owners/${row.owner_id}`}
                            className="font-bold hover:text-[var(--accent-ink)] hover:underline"
                          >
                            {row.name || formatPhone(row.phone)}
                          </Link>
                        )}
                      </td>
                      <td className="font-mono px-[18px] py-[13px]">{formatNumber(row.messages)}</td>
                      <td className="font-mono px-[18px] py-[13px]">{formatNumber(row.accepted)}</td>
                      <td className={`font-mono px-[18px] py-[13px] ${row.failed > 0 ? 'text-[var(--danger)]' : ''}`}>
                        {formatNumber(row.failed)}
                      </td>
                      <td className="font-mono px-[18px] py-[13px]">{formatKES(row.cost)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </DataState>
      </section>

      {reviewing ? (
        <ReviewSenderModal
          request={reviewing.request}
          decision={reviewing.decision}
          onClose={() => setReviewing(null)}
          onDone={sendersState.reload}
        />
      ) : null}
    </>
  )
}

function ReviewSenderModal({ request, decision, onClose, onDone }) {
  const approving = decision === 'approved'
  const [note, setNote] = useState('')
  const [working, setWorking] = useState(false)
  const [error, setError] = useState(null)

  async function handleSubmit(event) {
    event.preventDefault()
    setWorking(true)
    setError(null)

    try {
      await reviewSenderId(request.id, decision, note.trim())
      onDone()
      onClose()
    } catch (reviewError) {
      setError(reviewError)
      setWorking(false)
    }
  }

  return (
    <ModalShell title={`${approving ? 'Approve' : 'Reject'} sender ID - ${request.sender_id}`} onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-hidden">
        <ModalBody>
          <div className="rounded-[8px] border border-[var(--line)] bg-[var(--surface)] px-4 py-4">
            <h3 className="text-[13px] font-bold">
              {request.sender_id} · {request.owner_name}
            </h3>
            <p className="mt-1 text-[11px] leading-[1.5] text-[var(--ink-faint)]">
              {approving
                ? `From now on, messages for ${request.owner_name}'s properties that use this sender ID go out as "${request.sender_id}". Approve only if it is registered with Africa's Talking; otherwise those messages will fail.`
                : `Messages for ${request.owner_name}'s properties keep going out from the platform's default sender. The owner sees that the sender ID was not approved.`}
            </p>
          </div>

          <div className="mt-[14px]">
            <Field
              label={approving ? 'Note (optional)' : 'Reason (optional, for your records)'}
              placeholder={approving ? 'e.g. Registered on 13 Oct' : 'e.g. Not registered with the provider'}
              value={note}
              onChange={(event) => setNote(event.target.value)}
              maxLength={500}
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
          <button
            type="submit"
            disabled={working}
            className={
              approving
                ? primaryButtonClass
                : 'rounded-[8px] border border-[var(--danger-solid)] bg-[var(--danger-solid)] px-5 py-[10px] text-[12px] font-bold text-white disabled:opacity-50'
            }
          >
            {working ? 'Saving...' : approving ? 'Approve' : 'Reject'}
          </button>
        </ModalFooter>
      </form>
    </ModalShell>
  )
}

export default AdminSmsPage
