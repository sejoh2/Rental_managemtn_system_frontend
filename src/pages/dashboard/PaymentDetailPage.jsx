import { Link, useParams } from 'react-router-dom'
import { getPayment } from '../../api/payments'
import { DataState, EmptyState } from '../../components/common/DataState'
import StatusBadge from '../../components/common/StatusBadge'
import { useProperties } from '../../context/PropertiesContext'
import { useApi } from '../../hooks/useApi'
import { alsoCollectsText } from '../../utils/accountSharing'
import { chargeLabel } from '../../utils/billing'
import { formatDateTime, formatKES, formatPhone, humanize } from '../../utils/format'
import { paymentMethodLabel, paymentStatus } from '../../utils/payments'

const cardClass = 'overflow-hidden rounded-[10px] border border-[var(--line)] bg-[var(--surface)]'

function Row({ label, children }) {
  return (
    <div className="grid gap-1 border-b border-[var(--line-soft)] px-[18px] py-[11px] text-[12px] last:border-b-0 sm:grid-cols-[180px_1fr] sm:gap-4">
      <span className="text-[var(--ink-soft)]">{label}</span>
      <span className="min-w-0 break-words font-bold">{children}</span>
    </div>
  )
}

// One payment in full: where it came from, who it is for and what it paid. Read-only;
// assigning and reversing are done from the Payments list.
function PaymentDetailPage() {
  const { paymentId } = useParams()
  const state = useApi(`payment-${paymentId}`, () => getPayment(paymentId))
  const properties = useProperties()?.data

  return (
    <DataState state={state} loadingLabel="Loading payment...">
      {(payment) => {
        const status = paymentStatus(payment)
        const applied = payment.applied_to.reduce((total, item) => total + item.amount, 0)
        // What was paid over the tenant's bills is kept as credit on their account.
        const credit = payment.status === 'matched' ? Math.max(payment.amount - applied, 0) : 0
        // Other bills this account collects at the property, e.g. "Also collects service charges."
        const alsoCollects = alsoCollectsText(
          payment.account_for,
          properties?.find((item) => item.id === payment.property_id)?.charge_accounts
        )

        return (
          <>
            <div className="mb-7">
              <Link
                to="/payments"
                className="mb-[10px] block text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--accent-ink)] hover:underline"
              >
                Payments / Payment {payment.id}
              </Link>
              <h1 className="flex flex-wrap items-center gap-3 font-display text-[20px] font-semibold tracking-[-0.01em]">
                <span className="font-mono">{formatKES(payment.amount)}</span>
                <StatusBadge tone={status.tone}>{status.label}</StatusBadge>
              </h1>
              <p className="mt-2 text-[12px] text-[var(--ink-soft)]">
                {paymentMethodLabel(payment)} · received {formatDateTime(payment.received_at)}
                {payment.tenant_name ? ` · ${payment.tenant_name}` : ''}
              </p>
            </div>

            <div className="grid gap-4 xl:grid-cols-2">
              <section className={cardClass}>
                <div className="border-b border-[var(--line)] px-[18px] py-4">
                  <h3 className="text-[12px] font-bold">Payment</h3>
                </div>

                <Row label="Amount">
                  <span className="font-mono">{formatKES(payment.amount)}</span>
                </Row>
                <Row label={payment.notified_at ? 'Paid (M-Pesa time)' : 'Received'}>
                  {formatDateTime(payment.received_at)}
                  {/* The notice can arrive later; the payment counts on the day it was paid. */}
                  {payment.notified_at &&
                  Math.abs(new Date(payment.notified_at) - new Date(payment.received_at)) > 60 * 1000 ? (
                    <span className="block text-[10px] font-medium text-[var(--ink-faint)]">
                      Safaricom's notice reached Kodi {formatDateTime(payment.notified_at)}
                    </span>
                  ) : null}
                </Row>
                <Row label="Method">{paymentMethodLabel(payment)}</Row>
                <Row label="How it arrived">
                  {payment.payment_source === 'manual'
                    ? `Recorded by hand${payment.recorded_by_name ? ` by ${payment.recorded_by_name}` : ''}`
                    : humanize(payment.payment_source)}
                </Row>
                <Row label="Reference">
                  <span className="font-mono">{payment.reference || '-'}</span>
                </Row>
                {payment.provider_transaction_id ? (
                  <Row label="M-Pesa code">
                    <span className="font-mono">{payment.provider_transaction_id}</span>
                  </Row>
                ) : null}
                <Row label="Paid from">
                  <span className="font-mono">{formatPhone(payment.payer_phone)}</span>
                </Row>
                <Row label="Paid into">
                  {humanize(payment.account_for)} account
                  {alsoCollects ? (
                    <span className="block text-[10px] font-medium text-[var(--ink-faint)]">{alsoCollects}</span>
                  ) : null}
                </Row>
                {payment.notes ? <Row label="Notes">{payment.notes}</Row> : null}
                {payment.duplicate_override_reason ? (
                  <Row label="Recorded although it looked like an unmatched M-Pesa payment">
                    {payment.duplicate_override_reason}
                  </Row>
                ) : null}
              </section>

              <section className={cardClass}>
                <div className="border-b border-[var(--line)] px-[18px] py-4">
                  <h3 className="text-[12px] font-bold">Who it is for</h3>
                </div>

                <Row label="Tenant">
                  {payment.tenant_id ? (
                    <Link
                      to={`/tenants/${payment.tenant_id}`}
                      className="hover:text-[var(--accent-ink)] hover:underline"
                    >
                      {payment.tenant_name}
                    </Link>
                  ) : (
                    'Not matched to a tenant'
                  )}
                </Row>
                <Row label="Property">{payment.property_name || '-'}</Row>
                <Row label="House">{payment.unit_number || '-'}</Row>
                <Row label="Status">
                  <StatusBadge tone={status.tone}>{status.label}</StatusBadge>
                </Row>
                <Row label="How it was matched">
                  {payment.match_type ? humanize(payment.match_type) : '-'}
                  {payment.matched_at ? (
                    <span className="block text-[10px] font-normal text-[var(--ink-faint)]">
                      {formatDateTime(payment.matched_at)}
                    </span>
                  ) : null}
                </Row>
                {payment.unmatched_reason && payment.status === 'unmatched' ? (
                  <Row label="Why it is unmatched">{humanize(payment.unmatched_reason)}</Row>
                ) : null}
                {payment.status === 'dismissed' ? (
                  <Row label="Not a tenant payment">
                    {formatDateTime(payment.dismissed_at)}
                    <span className="block text-[10px] font-normal text-[var(--ink-faint)]">
                      {payment.dismiss_reason}
                    </span>
                  </Row>
                ) : null}
                {payment.added_to_refund > 0 ? (
                  <Row label="Added to the deposit refund">
                    <span className="font-mono">{formatKES(payment.added_to_refund)}</span>
                    <span className="block text-[10px] font-normal text-[var(--ink-faint)]">
                      Paid after the deposits were settled, above what was owed: it is owed back to the tenant.
                    </span>
                  </Row>
                ) : null}
                {payment.reversed_at ? (
                  <Row label="Reversed">
                    {formatDateTime(payment.reversed_at)}
                    <span className="block text-[10px] font-normal text-[var(--ink-faint)]">
                      {payment.reverse_reason}
                    </span>
                  </Row>
                ) : null}
              </section>
            </div>

            <section className={`${cardClass} mt-4`}>
              <div className="border-b border-[var(--line)] px-[18px] py-4">
                <h3 className="text-[12px] font-bold">What it paid</h3>
                <p className="mt-[3px] text-[10px] text-[var(--ink-faint)]">
                  The bills this payment was applied to, in the order they were settled.
                </p>
              </div>

              {payment.applied_to.length ? (
                <>
                  {payment.applied_to.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between gap-4 border-b border-[var(--line-soft)] px-[18px] py-[11px] text-[12px]"
                    >
                      <span>{chargeLabel(item)}</span>
                      <span className="font-mono font-bold">{formatKES(item.amount)}</span>
                    </div>
                  ))}

                  {credit > 0 ? (
                    <div className="flex items-center justify-between gap-4 border-b border-[var(--line-soft)] px-[18px] py-[11px] text-[12px]">
                      <span>Kept as credit on the tenant&apos;s account</span>
                      <span className="font-mono font-bold">{formatKES(credit)}</span>
                    </div>
                  ) : null}

                  <div className="flex items-center justify-between gap-4 px-[18px] py-[11px] text-[12px] font-bold">
                    <span>Total</span>
                    <span className="font-mono">{formatKES(payment.amount)}</span>
                  </div>
                </>
              ) : (
                <EmptyState
                  title="Not applied to any bill"
                  message={
                    payment.status === 'matched'
                      ? 'The whole amount is kept as credit on the tenant’s account, for their next bill.'
                      : 'A payment is applied to bills once it is matched to a tenant.'
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

export default PaymentDetailPage
