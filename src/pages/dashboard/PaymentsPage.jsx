import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Download, Plus } from 'lucide-react'
import { listPayments, matchPayment, reversePayment } from '../../api/payments'
import { listTenants } from '../../api/tenants'
import { DataState, EmptyState, FormError } from '../../components/common/DataState'
import {
  Field,
  ModalBody,
  ModalFooter,
  ModalShell,
  inputClass,
  labelClass,
  primaryButtonClass,
  secondaryButtonClass,
} from '../../components/common/Modal'
import StatusBadge from '../../components/common/StatusBadge'
import RecordPaymentModal from '../../components/dashboard/RecordPaymentModal'
import StatCard from '../../components/dashboard/StatCard'
import { usePaymentStats } from '../../context/PaymentStatsContext'
import { useApi } from '../../hooks/useApi'
import { downloadCsv } from '../../utils/csv'
import {
  formatDateTime,
  formatKES,
  formatPercent,
  formatPhone,
  humanize,
  toDateInput,
} from '../../utils/format'
import { appliedToLabel, paymentMethodLabel, paymentStatus } from '../../utils/payments'
import { isCurrentTenant } from '../../utils/tenantStatus'

function payerLabel(payment) {
  if (payment.tenant_name) {
    return `${payment.tenant_name}${payment.unit_number ? ` - ${payment.unit_number}` : ''}`
  }

  return payment.payer_phone ? formatPhone(payment.payer_phone) : 'Unknown payer'
}

function PaymentsPage() {
  const paymentsState = useApi('payments', listPayments)
  const statsState = usePaymentStats()
  const [searchParams, setSearchParams] = useSearchParams()
  const [assigning, setAssigning] = useState(null)
  const [reversing, setReversing] = useState(null)
  const [recordOpen, setRecordOpen] = useState(false)

  // The tab lives in the URL so other pages can link straight to /payments?tab=unmatched.
  const activeTab = searchParams.get('tab') === 'unmatched' ? 'unmatched' : 'all'
  const payments = paymentsState.data || []
  const unmatched = payments.filter((payment) => payment.status === 'unmatched')

  function reloadAll() {
    paymentsState.reload()
    statsState.reload()
  }

  function exportCsv() {
    downloadCsv(
      `payments-${toDateInput()}.csv`,
      ['Date', 'Tenant / payer', 'Unit', 'Amount (KES)', 'Method', 'For', 'Applied to', 'Reference', 'Status'],
      payments.map((payment) => [
        formatDateTime(payment.received_at),
        payment.tenant_name || formatPhone(payment.payer_phone, ''),
        payment.unit_number || '',
        payment.amount,
        paymentMethodLabel(payment),
        humanize(payment.account_for, ''),
        appliedToLabel(payment),
        payment.provider_transaction_id || payment.reference || '',
        paymentStatus(payment).label,
      ])
    )
  }

  return (
    <>
      <div className="mb-7 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-[10px] text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--accent)]">
            Money
          </div>
          <h1 className="font-display text-[20px] font-semibold tracking-[-0.01em]">
            Payments
          </h1>
          <p className="mt-2 text-[12px] text-[var(--ink-soft)]">
            Rent, water and electricity payments. M-Pesa is matched to tenants
            automatically; cash and bank payments are recorded by hand.
          </p>
        </div>

        <div className="flex flex-wrap gap-[10px]">
          <button
            onClick={exportCsv}
            disabled={!payments.length}
            className="inline-flex items-center gap-2 rounded-[8px] border border-[var(--line)] bg-white px-4 py-[10px] text-[12px] font-bold disabled:opacity-50"
          >
            <Download size={15} />
            Export CSV
          </button>

          <button
            onClick={() => setRecordOpen(true)}
            className="inline-flex items-center gap-2 rounded-[8px] border border-[var(--accent)] bg-[var(--accent)] px-4 py-[10px] text-[12px] font-bold text-white"
          >
            <Plus size={15} />
            Record payment
          </button>
        </div>
      </div>

      <div className="mb-[18px] flex gap-7 border-b border-[var(--line)]">
        {[
          ['all', 'All payments'],
          ['unmatched', 'Unmatched'],
        ].map(([key, label]) => (
          <button
            key={key}
            onClick={() => setSearchParams(key === 'all' ? {} : { tab: key })}
            className={`pb-[12px] text-[11px] font-bold ${
              activeTab === key
                ? 'border-b-2 border-[var(--accent)] text-[var(--accent)]'
                : 'text-[var(--ink-faint)] hover:text-[var(--accent)]'
            }`}
          >
            {label}
            {key === 'unmatched' && unmatched.length ? (
              <span className="ml-2 rounded-full bg-[#FBF0DA] px-[9px] py-[3px] text-[9px] text-[#B8790E]">
                {unmatched.length}
              </span>
            ) : null}
          </button>
        ))}
      </div>

      {activeTab === 'unmatched' ? (
        <UnmatchedView paymentsState={paymentsState} unmatched={unmatched} onAssign={setAssigning} />
      ) : (
        <AllPaymentsView
          paymentsState={paymentsState}
          stats={statsState.data}
          onReverse={setReversing}
        />
      )}

      {assigning ? (
        <AssignPaymentModal
          payment={assigning}
          onClose={() => setAssigning(null)}
          onDone={reloadAll}
        />
      ) : null}

      {reversing ? (
        <ReversePaymentModal
          payment={reversing}
          onClose={() => setReversing(null)}
          onDone={reloadAll}
        />
      ) : null}

      {recordOpen ? (
        <RecordPaymentModal onClose={() => setRecordOpen(false)} onDone={reloadAll} />
      ) : null}
    </>
  )
}

function AllPaymentsView({ paymentsState, stats, onReverse }) {
  const statCards = [
    {
      label: 'Received today',
      value: stats ? formatKES(stats.received_today) : '-',
      note: stats
        ? `${stats.received_today_count} ${stats.received_today_count === 1 ? 'transaction' : 'transactions'}`
        : 'Loading...',
      tone: 'muted',
    },
    {
      label: 'Auto-matched',
      value: stats ? formatPercent(stats.auto_match_rate) : '-',
      note: 'of all payments',
      tone: 'success',
    },
    {
      label: 'Pending review',
      value: stats ? String(stats.unmatched_count) : '-',
      note: stats?.unmatched_count ? 'needs attention' : 'nothing to review',
      tone: stats?.unmatched_count ? 'danger' : 'muted',
    },
  ]

  return (
    <>
      <div className="mb-6 grid gap-[14px] md:grid-cols-3">
        {statCards.map((item) => (
          <StatCard key={item.label} {...item} />
        ))}
      </div>

      <section className="overflow-hidden rounded-[10px] border border-[var(--line)] bg-white">
        <DataState
          state={paymentsState}
          loadingLabel="Loading payments..."
          isEmpty={(payments) => !payments.length}
          empty={
            <EmptyState
              title="No payments yet"
              message="M-Pesa payments to your property accounts appear here automatically. Use Record payment for cash or bank payments."
            />
          }
        >
          {(payments) => (
            <div className="overflow-x-auto">
              <table className="min-w-[1040px] w-full border-collapse">
                <thead>
                  <tr className="bg-[var(--bg)] text-left text-[9px] uppercase tracking-[0.05em] text-[var(--ink-faint)]">
                    <th className="px-[18px] py-[10px] font-bold">Tenant</th>
                    <th className="px-[18px] py-[10px] font-bold">Amount</th>
                    <th className="px-[18px] py-[10px] font-bold">Method</th>
                    <th className="px-[18px] py-[10px] font-bold">Applied to</th>
                    <th className="px-[18px] py-[10px] font-bold">Date</th>
                    <th className="px-[18px] py-[10px] font-bold">Status</th>
                    <th className="px-[18px] py-[10px] font-bold"></th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((payment) => {
                    const status = paymentStatus(payment)

                    return (
                      <tr key={payment.id} className="border-b border-[var(--line-soft)] last:border-b-0">
                        <td className="px-[18px] py-[13px] text-[12px] font-bold">
                          {payment.tenant_id ? (
                            <Link to={`/tenants/${payment.tenant_id}`} className="hover:text-[var(--accent)]">
                              {payerLabel(payment)}
                            </Link>
                          ) : (
                            payerLabel(payment)
                          )}
                        </td>
                        <td className="font-mono px-[18px] py-[13px] text-[12px]">
                          {formatKES(payment.amount)}
                        </td>
                        <td className="px-[18px] py-[13px] text-[12px]">{paymentMethodLabel(payment)}</td>
                        <td className="px-[18px] py-[13px] text-[12px]">
                          {payment.status === 'reversed'
                            ? payment.reverse_reason || '-'
                            : appliedToLabel(payment)}
                        </td>
                        <td className="px-[18px] py-[13px] text-[12px]">
                          {formatDateTime(payment.received_at)}
                        </td>
                        <td className="px-[18px] py-[13px]">
                          <StatusBadge tone={status.tone}>{status.label}</StatusBadge>
                        </td>
                        <td className="px-[18px] py-[13px] text-right">
                          {payment.status === 'matched' ? (
                            <button
                              onClick={() => onReverse(payment)}
                              className="rounded-[8px] border border-[var(--line)] bg-white px-3 py-2 text-[11px] font-bold"
                            >
                              {payment.payment_source === 'manual' ? 'Reverse' : 'Unassign'}
                            </button>
                          ) : null}
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

function UnmatchedView({ paymentsState, unmatched, onAssign }) {
  return (
    <section className="overflow-hidden rounded-[10px] border border-[var(--line)] bg-white">
      <div className="flex items-center justify-between border-b border-[var(--line)] px-[18px] py-4">
        <h3 className="text-[12px] font-bold">Needs manual review</h3>
        <span className="text-[10px] text-[var(--ink-faint)]">
          {paymentsState.data
            ? `${unmatched.length} ${unmatched.length === 1 ? 'transaction' : 'transactions'}`
            : ''}
        </span>
      </div>

      <DataState
        state={paymentsState}
        loadingLabel="Loading payments..."
        isEmpty={() => !unmatched.length}
        empty={
          <EmptyState
            title="Nothing to review"
            message="Every payment received has been matched to a tenant."
          />
        }
      >
        {() => (
          <div className="space-y-[12px] p-[18px]">
            {unmatched.map((payment) => (
              <div
                key={payment.id}
                className="flex flex-col gap-4 rounded-[8px] border border-[var(--line)] border-l-2 border-l-[var(--accent-soft-line)] bg-white px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-[14px] font-bold">
                      {formatKES(payment.amount)} from {payerLabel(payment)}
                    </h3>
                    <StatusBadge tone="warning">Unmatched</StatusBadge>
                  </div>
                  <p className="mt-[5px] text-[11px] text-[var(--ink-faint)]">
                    Received {formatDateTime(payment.received_at)} into the{' '}
                    {humanize(payment.account_for, 'property').toLowerCase()} account
                    {payment.reference ? ` - reference "${payment.reference}"` : ''}
                  </p>
                  {payment.unmatched_reason ? (
                    <p className="mt-[3px] text-[11px] text-[var(--ink-faint)]">
                      {payment.unmatched_reason}
                    </p>
                  ) : null}
                </div>

                <button
                  onClick={() => onAssign(payment)}
                  className="shrink-0 rounded-[8px] border border-[var(--accent)] bg-[var(--accent)] px-4 py-[10px] text-[12px] font-bold text-white"
                >
                  Assign to tenant
                </button>
              </div>
            ))}
          </div>
        )}
      </DataState>
    </section>
  )
}

function AssignPaymentModal({ payment, onClose, onDone }) {
  // A payment can only go to a tenant of the property whose account received it.
  const tenantsState = useApi(`tenants-property-${payment.property_id}`, () =>
    listTenants({ property_id: payment.property_id })
  )
  const tenants = (tenantsState.data || []).filter(isCurrentTenant)

  const [tenantId, setTenantId] = useState('')
  const [rememberPhone, setRememberPhone] = useState(Boolean(payment.payer_phone))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  async function handleSubmit(event) {
    event.preventDefault()
    setSaving(true)
    setError(null)

    try {
      await matchPayment(payment.id, {
        tenant_id: Number(tenantId),
        remember_payment_phone: rememberPhone,
      })
      onDone()
      onClose()
    } catch (saveError) {
      setError(saveError)
      setSaving(false)
    }
  }

  return (
    <ModalShell title="Assign payment to tenant" onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-hidden">
        <ModalBody>
          <div className="mb-[18px] rounded-[8px] border border-[var(--line)] border-l-2 border-l-[var(--accent-soft-line)] bg-white px-4 py-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-[14px] font-bold">{paymentMethodLabel(payment)} from {payerLabel(payment)}</h3>
                <p className="mt-[4px] text-[11px] text-[var(--ink-faint)]">
                  Received {formatDateTime(payment.received_at)} into the{' '}
                  {humanize(payment.account_for, 'property').toLowerCase()} account
                </p>
              </div>
              <div className="font-mono text-[14px] font-bold">{formatKES(payment.amount)}</div>
            </div>
          </div>

          <label className={labelClass}>Match to tenant</label>
          <select
            value={tenantId}
            onChange={(event) => setTenantId(event.target.value)}
            required
            className={inputClass}
          >
            <option value="">
              {tenantsState.loading ? 'Loading tenants...' : 'Choose a tenant'}
            </option>
            {tenants.map((tenant) => (
              <option key={tenant.id} value={tenant.id}>
                {tenant.full_name} - {tenant.unit_number}
                {tenant.balance > 0 ? ` (owes ${formatKES(tenant.balance)})` : ''}
              </option>
            ))}
          </select>

          <p className="mt-2 text-[10px] leading-[1.5] text-[var(--ink-faint)]">
            The money is applied to the tenant's oldest unpaid{' '}
            {payment.account_for === 'rent' ? 'deposits and rent' : `${payment.account_for} charges`}{' '}
            first, because it arrived in the {payment.account_for} account.
          </p>

          {payment.payer_phone ? (
            <label className="mt-[18px] flex items-start gap-3 text-[12px] font-medium">
              <input
                type="checkbox"
                checked={rememberPhone}
                onChange={(event) => setRememberPhone(event.target.checked)}
                className="mt-[2px] h-[13px] w-[13px]"
              />
              <span>
                Also save {formatPhone(payment.payer_phone)} as this tenant's payment number
                <span className="mt-[2px] block text-[10px] font-normal text-[var(--ink-faint)]">
                  Future payments from this number will then match automatically. It replaces the number currently on the tenant's record.
                </span>
              </span>
            </label>
          ) : null}

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

          <button type="submit" disabled={saving || !tenantId} className={primaryButtonClass}>
            {saving ? 'Matching...' : 'Confirm match'}
          </button>
        </ModalFooter>
      </form>
    </ModalShell>
  )
}

function ReversePaymentModal({ payment, onClose, onDone }) {
  const manual = payment.payment_source === 'manual'
  const [reason, setReason] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  async function handleSubmit(event) {
    event.preventDefault()
    setSaving(true)
    setError(null)

    try {
      await reversePayment(payment.id, reason.trim())
      onDone()
      onClose()
    } catch (saveError) {
      setError(saveError)
      setSaving(false)
    }
  }

  return (
    <ModalShell title={manual ? 'Reverse payment' : 'Unassign payment'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-hidden">
        <ModalBody>
          <div className="mb-[18px] rounded-[8px] border border-[var(--line)] border-l-2 border-l-[#B3261E] bg-white px-4 py-4">
            <h3 className="text-[14px] font-bold text-[#B3261E]">
              {formatKES(payment.amount)} will be taken off {payment.tenant_name || 'the tenant'}'s account
            </h3>
            <p className="mt-1 text-[11px] leading-[1.5] text-[var(--ink-faint)]">
              Every charge this payment settled goes back to unpaid, and any
              credit it left is removed.{' '}
              {manual
                ? 'The payment stays on record, marked as reversed.'
                : 'Because this is real M-Pesa money, it returns to Unmatched so you can assign it to the right tenant.'}
            </p>
          </div>

          <Field
            label="Reason"
            placeholder={manual ? 'e.g. Entered the wrong amount' : 'e.g. Assigned to the wrong tenant'}
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            required
            minLength={2}
          />

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
            disabled={saving}
            className="rounded-[8px] border border-[#B3261E] bg-[#B3261E] px-5 py-[10px] text-[12px] font-bold text-white disabled:opacity-50"
          >
            {saving ? 'Working...' : manual ? 'Reverse payment' : 'Unassign payment'}
          </button>
        </ModalFooter>
      </form>
    </ModalShell>
  )
}

export default PaymentsPage
