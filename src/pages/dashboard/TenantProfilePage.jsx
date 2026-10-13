import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Download, FileText } from 'lucide-react'
import {
  downloadTenantAgreement,
  generateTenantAgreement,
  getTenant,
  getTenantAgreement,
  getTenantStatement,
  listTenantPayments,
  moveOutTenant,
  undoMoveOut,
  updateTenant,
} from '../../api/tenants'
import { listWaterReadings } from '../../api/water'
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
import Attachments from '../../components/common/Attachments'
import DepositReconciliation from '../../components/dashboard/DepositReconciliation'
import RecordPaymentModal from '../../components/dashboard/RecordPaymentModal'
import { useProperties } from '../../context/PropertiesContext'
import { useApi } from '../../hooks/useApi'
import { chargeLabel, moveOutEstimate } from '../../utils/billing'
import {
  formatDate,
  formatDateTime,
  formatKES,
  formatMonth,
  formatPhone,
  humanize,
  initials,
  toDateInput,
} from '../../utils/format'
import { appliedToLabel, paymentMethodLabel, paymentStatus } from '../../utils/payments'
import { isCurrentTenant, tenantStatus } from '../../utils/tenantStatus'

const tabs = ['Overview', 'Payment history', 'Water bills', 'Documents']

const cardClass = 'overflow-hidden rounded-[10px] border border-[var(--line)] bg-[var(--surface)]'
const cardHeaderClass =
  'flex items-center justify-between gap-3 border-b border-[var(--line)] px-[18px] py-4'
const headRowClass =
  'bg-[var(--bg)] text-left text-[9px] uppercase tracking-[0.05em] text-[var(--ink-faint)]'
const smallButtonClass =
  'rounded-[8px] border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-[11px] font-bold'

function TenantProfilePage() {
  const { tenantId } = useParams()
  const tenantState = useApi(`tenant-${tenantId}`, () => getTenant(tenantId))

  return (
    <>
      <Link
        to="/tenants"
        className="mb-5 inline-flex items-center gap-2 text-[11px] font-bold text-[var(--ink-soft)] hover:text-[var(--accent-ink)]"
      >
        <ArrowLeft size={14} />
        Back to tenants
      </Link>

      <DataState state={tenantState} loadingLabel="Loading tenant...">
        {(tenant) => <TenantProfile key={tenant.id} tenant={tenant} onTenantChanged={tenantState.reload} />}
      </DataState>
    </>
  )
}

function TenantProfile({ tenant, onTenantChanged }) {
  const property = useProperties().data?.find((item) => item.id === tenant.property_id)
  const statementState = useApi(`tenant-statement-${tenant.id}`, () => getTenantStatement(tenant.id))
  const paymentsState = useApi(`tenant-payments-${tenant.id}`, () => listTenantPayments(tenant.id))
  const agreementState = useApi(`tenant-agreement-${tenant.id}`, () => getTenantAgreement(tenant.id))

  const [activeTab, setActiveTab] = useState('Overview')
  // agreement | moveOut | undoMoveOut | payment | edit | notice
  const [openModal, setOpenModal] = useState(null)
  const [actionError, setActionError] = useState(null)

  const current = isCurrentTenant(tenant)
  const status = tenantStatus(tenant)

  function reloadMoney() {
    onTenantChanged()
    statementState.reload()
    paymentsState.reload()
  }

  async function cancelNotice() {
    setActionError(null)

    try {
      await updateTenant(tenant.id, { status: 'active', notice_date: null })
      onTenantChanged()
    } catch (error) {
      setActionError(error)
    }
  }

  // A tenant who has moved out can still pay off what they owe.
  const recordPaymentButton = current || tenant.balance > 0 ? (
    <button onClick={() => setOpenModal('payment')} className={smallButtonClass}>
      Record manual payment
    </button>
  ) : null

  return (
    <>
      <div className="mb-7 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-full bg-[var(--accent-soft)] font-display text-[18px] font-bold text-[var(--accent-ink)]">
            {initials(tenant.full_name)}
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="font-display text-[20px] font-semibold tracking-[-0.01em]">
                {tenant.full_name}
              </h1>
              <StatusBadge tone={status.tone}>{status.label}</StatusBadge>
            </div>
            <p className="mt-1 text-[12px] text-[var(--ink-soft)]">
              {tenant.property_name} - House {tenant.unit_number} - Tenant since{' '}
              {formatMonth(tenant.move_in_date)}
              {tenant.status === 'notice_given' && tenant.notice_date
                ? ` - Notice given ${formatDate(tenant.notice_date)}`
                : ''}
              {!current && tenant.move_out_date
                ? ` - Moved out ${formatDate(tenant.move_out_date)}`
                : ''}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-[10px]">
          <button
            onClick={() => setOpenModal('agreement')}
            className="inline-flex items-center gap-2 rounded-[8px] border border-[var(--line)] bg-[var(--surface)] px-4 py-[10px] text-[12px] font-bold"
          >
            <FileText size={15} />
            View agreement
          </button>

          {current ? (
            <>
              <button
                onClick={() => setOpenModal('edit')}
                className="rounded-[8px] border border-[var(--line)] bg-[var(--surface)] px-4 py-[10px] text-[12px] font-bold"
              >
                Edit details
              </button>

              <button
                onClick={tenant.status === 'notice_given' ? cancelNotice : () => setOpenModal('notice')}
                className="rounded-[8px] border border-[var(--line)] bg-[var(--surface)] px-4 py-[10px] text-[12px] font-bold"
              >
                {tenant.status === 'notice_given' ? 'Cancel notice' : 'Mark notice given'}
              </button>

              <button
                onClick={() => setOpenModal('moveOut')}
                className="rounded-[8px] border border-[var(--line)] bg-[var(--surface)] px-4 py-[10px] text-[12px] font-bold text-[var(--danger)]"
              >
                Move out / archive
              </button>
            </>
          ) : null}

          {tenant.status === 'moved_out' ? (
            <button
              onClick={() => setOpenModal('undoMoveOut')}
              className="rounded-[8px] border border-[var(--line)] bg-[var(--surface)] px-4 py-[10px] text-[12px] font-bold"
            >
              Undo move-out
            </button>
          ) : null}
        </div>
      </div>

      {actionError ? (
        <div className="mb-[18px]">
          <FormError error={actionError} />
        </div>
      ) : null}

      <div className="mb-[18px] flex flex-wrap gap-7 border-b border-[var(--line)]">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-[12px] text-[11px] font-bold ${
              activeTab === tab
                ? 'border-b-2 border-[var(--accent)] text-[var(--accent-ink)]'
                : 'text-[var(--ink-faint)] hover:text-[var(--accent-ink)]'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'Overview' ? (
        <TenantOverview
          tenant={tenant}
          statementState={statementState}
          paymentsState={paymentsState}
          recordPaymentButton={recordPaymentButton}
          onMoneyChanged={reloadMoney}
        />
      ) : activeTab === 'Payment history' ? (
        <PaymentsTable
          title="Full payment history"
          paymentsState={paymentsState}
          action={recordPaymentButton}
          showStatus
        />
      ) : activeTab === 'Water bills' ? (
        <TenantWaterBills tenant={tenant} statementState={statementState} />
      ) : (
        <TenantDocuments
          tenant={tenant}
          agreementState={agreementState}
          onView={() => setOpenModal('agreement')}
        />
      )}

      {openModal === 'agreement' ? (
        <AgreementModal
          tenant={tenant}
          agreementState={agreementState}
          onClose={() => setOpenModal(null)}
        />
      ) : null}

      {openModal === 'moveOut' ? (
        <MoveOutModal
          tenant={tenant}
          property={property}
          onClose={() => setOpenModal(null)}
          onDone={reloadMoney}
        />
      ) : null}

      {openModal === 'undoMoveOut' ? (
        <UndoMoveOutModal tenant={tenant} onClose={() => setOpenModal(null)} onDone={reloadMoney} />
      ) : null}

      {openModal === 'payment' ? (
        <RecordPaymentModal
          tenant={tenant}
          onClose={() => setOpenModal(null)}
          onDone={reloadMoney}
        />
      ) : null}

      {openModal === 'edit' ? (
        <EditTenantModal tenant={tenant} onClose={() => setOpenModal(null)} onDone={onTenantChanged} />
      ) : null}

      {openModal === 'notice' ? (
        <NoticeModal tenant={tenant} onClose={() => setOpenModal(null)} onDone={onTenantChanged} />
      ) : null}
    </>
  )
}

function TenantOverview({
  tenant,
  statementState,
  paymentsState,
  recordPaymentButton,
  onMoneyChanged,
}) {
  return (
    <div className="grid gap-4 xl:grid-cols-[1.6fr_1fr]">
      <div className="space-y-4">
        {tenant.status === 'moved_out' ? (
          <DepositReconciliation tenant={tenant} onChanged={onMoneyChanged} />
        ) : null}

        <section className={cardClass}>
          <div className={cardHeaderClass}>
            <h3 className="text-[12px] font-bold">Account status</h3>
            {tenant.balance > 0 ? (
              <StatusBadge tone="danger">Owes {formatKES(tenant.balance)}</StatusBadge>
            ) : tenant.credit_balance > 0 ? (
              <StatusBadge tone="info">Credit {formatKES(tenant.credit_balance)}</StatusBadge>
            ) : (
              <StatusBadge tone="success">Paid up</StatusBadge>
            )}
          </div>

          <DataState state={statementState} loadingLabel="Loading charges...">
            {(statement) => <ChargesSummary charges={statement.charges} tenant={tenant} />}
          </DataState>
        </section>

        <PaymentsTable
          title="Recent payments"
          paymentsState={paymentsState}
          action={recordPaymentButton}
          limit={3}
        />

        <section className={cardClass}>
          <div className={cardHeaderClass}>
            <h3 className="text-[12px] font-bold">Documents</h3>
          </div>

          <div className="px-[18px] py-4">
            <Attachments
              kind="tenant_document"
              targetId={tenant.id}
              labelHint="ID copy"
              emptyText="No documents yet. Keep a copy of the tenant's ID, the signed agreement or anything else about this tenancy here."
            />
          </div>
        </section>
      </div>

      <aside>
        <SectionLine title="Tenant details" />
        <DetailRow label="Phone" value={formatPhone(tenant.phone)} />
        <DetailRow label="ID number" value={tenant.national_id || '-'} />
        <DetailRow label="Email" value={tenant.email || '-'} />
        <DetailRow label="Move-in date" value={formatDate(tenant.move_in_date)} />
        <DetailRow label="Monthly rent" value={formatKES(tenant.monthly_rent)} />
        <DetailRow label="Rent deposit" value={formatKES(tenant.rent_deposit_due)} />
        <DetailRow label="Water deposit" value={formatKES(tenant.water_deposit_due)} />

        <div className="mt-6">
          <SectionLine title="Payment identity" />
          <IdentityCard title="Rent payment" value={formatPhone(tenant.payment_phone)} badge="M-Pesa" />
          <IdentityCard title="Water reference" value={tenant.water_payment_reference} badge="Reference" blue />
        </div>
      </aside>
    </div>
  )
}

// Everything billed to the tenant that is still owed, plus what was billed this year.
function ChargesSummary({ charges, tenant }) {
  const liveCharges = charges.filter((charge) => charge.status !== 'void')
  const billed = liveCharges.reduce((total, charge) => total + charge.amount_due, 0)
  const paid = liveCharges.reduce((total, charge) => total + charge.amount_paid, 0)
  // Repairs kept for move-out are owed but not due, so they are not in the balance.
  const heldAtMoveOut = liveCharges
    .filter((charge) => charge.status === 'held')
    .reduce((total, charge) => total + charge.amount_due, 0)

  if (!liveCharges.length) {
    return <EmptyState title="Nothing billed yet" message="Charges appear here once the tenant is billed." />
  }

  return (
    <>
      <div className="px-[18px] py-4 text-[12px]">
        <DetailRow label="Billed" value={formatKES(billed)} />
        <DetailRow label="Paid so far" value={formatKES(paid)} />
        <DetailRow label="Balance" value={formatKES(tenant.balance)} danger={tenant.balance > 0} />
        {heldAtMoveOut > 0 ? (
          <DetailRow label="Repairs to deduct at move-out" value={formatKES(heldAtMoveOut)} />
        ) : null}
        {tenant.credit_balance > 0 ? (
          <DetailRow label="Credit held" value={formatKES(tenant.credit_balance)} />
        ) : null}
        <div className="mt-3 h-[5px] rounded-full bg-[var(--line-soft)]">
          <div
            className="h-full rounded-full bg-[var(--accent)]"
            style={{ width: `${billed ? Math.min((paid / billed) * 100, 100) : 0}%` }}
          />
        </div>

        {tenant.balance > 0 && tenant.credit_balance > 0 ? (
          <p className="mt-3 text-[11px] leading-[1.5] text-[var(--warning)]">
            This tenant owes money and also holds credit. The credit was
            paid into a different account (for example water), so it can
            only settle that kind of bill. If the payment was meant for
            what is owed, reverse it on the Payments page and record it
            against the right account.
          </p>
        ) : null}
      </div>

      <div className="overflow-x-auto border-t border-[var(--line)]">
        <table className="w-full min-w-[640px] border-collapse text-[12px]">
          <thead>
            <tr className={headRowClass}>
              <th className="px-[18px] py-[10px]">Charge</th>
              <th className="px-[18px] py-[10px]">Due</th>
              <th className="px-[18px] py-[10px]">Amount</th>
              <th className="px-[18px] py-[10px]">Paid</th>
              <th className="px-[18px] py-[10px]">Status</th>
            </tr>
          </thead>
          <tbody>
            {liveCharges.map((charge) => (
              <tr key={charge.id} className="border-b border-[var(--line-soft)] last:border-b-0">
                <td className="px-[18px] py-[13px] font-bold">{chargeLabel(charge)}</td>
                <td className="px-[18px] py-[13px]">{formatDate(charge.due_date)}</td>
                <td className="font-mono px-[18px] py-[13px]">{formatKES(charge.amount_due)}</td>
                <td className="font-mono px-[18px] py-[13px]">{formatKES(charge.amount_paid)}</td>
                <td className="px-[18px] py-[13px]">
                  {/* held: a repair that waits for move-out; it is not arrears. */}
                  <StatusBadge
                    tone={
                      charge.status === 'paid'
                        ? 'success'
                        : charge.status === 'partial'
                          ? 'warning'
                          : charge.status === 'held'
                            ? 'info'
                            : 'danger'
                    }
                  >
                    {charge.status === 'open'
                      ? 'Unpaid'
                      : charge.status === 'held'
                        ? 'Deduct at move-out'
                        : humanize(charge.status)}
                  </StatusBadge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}

function PaymentsTable({ title, paymentsState, action, limit, showStatus }) {
  return (
    <section className={cardClass}>
      <div className={cardHeaderClass}>
        <h3 className="text-[12px] font-bold">{title}</h3>
        {action}
      </div>

      <DataState
        state={paymentsState}
        loadingLabel="Loading payments..."
        isEmpty={(payments) => !payments.length}
        empty={
          <EmptyState
            title="No payments yet"
            message="M-Pesa payments from this tenant's phone appear here automatically."
          />
        }
      >
        {(payments) => (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse text-[12px]">
              <thead>
                <tr className={headRowClass}>
                  <th className="px-[18px] py-[10px]">Date</th>
                  <th className="px-[18px] py-[10px]">Amount</th>
                  <th className="px-[18px] py-[10px]">Method</th>
                  <th className="px-[18px] py-[10px]">Applied to</th>
                  {showStatus ? <th className="px-[18px] py-[10px]">Status</th> : null}
                </tr>
              </thead>
              <tbody>
                {(limit ? payments.slice(0, limit) : payments).map((payment) => (
                  <tr key={payment.id} className="border-b border-[var(--line-soft)] last:border-b-0">
                    <td className="px-[18px] py-[13px]">{formatDateTime(payment.received_at)}</td>
                    <td className="font-mono px-[18px] py-[13px]">{formatKES(payment.amount)}</td>
                    <td className="px-[18px] py-[13px]">{paymentMethodLabel(payment)}</td>
                    <td className="px-[18px] py-[13px]">{appliedToLabel(payment)}</td>
                    {showStatus ? (
                      <td className="px-[18px] py-[13px]">
                        <StatusBadge tone={paymentStatus(payment).tone}>
                          {paymentStatus(payment).label}
                        </StatusBadge>
                      </td>
                    ) : null}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </DataState>
    </section>
  )
}

function TenantWaterBills({ tenant, statementState }) {
  const readingsState = useApi(`water-readings-${tenant.property_id}`, () =>
    listWaterReadings(tenant.property_id)
  )

  return (
    <div className="space-y-4">
      <section className={cardClass}>
        <DataState state={statementState} loadingLabel="Loading water bills...">
          {(statement) => {
            const waterCharges = statement.charges.filter(
              (charge) => charge.charge_type === 'water' && charge.status !== 'void'
            )
            const billed = waterCharges.reduce((total, charge) => total + charge.amount_due, 0)
            const paid = waterCharges.reduce((total, charge) => total + charge.amount_paid, 0)

            return (
              <>
                <div className={cardHeaderClass}>
                  <h3 className="text-[12px] font-bold">Water balance</h3>
                  {billed - paid > 0 ? (
                    <StatusBadge tone="warning">Unpaid - {formatKES(billed - paid)}</StatusBadge>
                  ) : (
                    <StatusBadge tone="success">{billed ? 'Paid up' : 'No water bills'}</StatusBadge>
                  )}
                </div>

                <div className="px-[18px] py-4 text-[12px]">
                  <DetailRow label="Water billed this year" value={formatKES(billed)} />
                  <DetailRow label="Paid so far" value={formatKES(paid)} />
                  <DetailRow label="Balance" value={formatKES(billed - paid)} warning={billed - paid > 0} />
                </div>
              </>
            )
          }}
        </DataState>
      </section>

      <section className={cardClass}>
        <div className={cardHeaderClass}>
          <h3 className="text-[12px] font-bold">Meter reading history</h3>
        </div>

        <DataState
          state={readingsState}
          loadingLabel="Loading readings..."
          isEmpty={(readings) => !readings.some((reading) => reading.tenant_id === tenant.id)}
          empty={
            <EmptyState
              title="No meter readings"
              message="Readings appear here once they are submitted for this tenant's unit."
            />
          }
        >
          {(readings) => (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] border-collapse text-[12px]">
                <thead>
                  <tr className={headRowClass}>
                    <th className="px-[18px] py-[10px]">Month</th>
                    <th className="px-[18px] py-[10px]">Previous</th>
                    <th className="px-[18px] py-[10px]">Current</th>
                    <th className="px-[18px] py-[10px]">Units used</th>
                    <th className="px-[18px] py-[10px]">Bill</th>
                    <th className="px-[18px] py-[10px]">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {readings
                    .filter((reading) => reading.tenant_id === tenant.id)
                    .map((reading) => (
                      <tr key={reading.id} className="border-b border-[var(--line-soft)] last:border-b-0">
                        <td className="px-[18px] py-[13px]">{formatMonth(reading.billing_period)}</td>
                        <td className="px-[18px] py-[13px]">{reading.previous_reading}</td>
                        <td className="px-[18px] py-[13px]">{reading.current_reading}</td>
                        <td className="px-[18px] py-[13px]">{reading.units_used ?? '-'}</td>
                        <td className="font-mono px-[18px] py-[13px]">
                          {reading.bill_amount === null ? '-' : formatKES(reading.bill_amount)}
                        </td>
                        <td className="px-[18px] py-[13px]">
                          <StatusBadge
                            tone={
                              reading.status === 'flagged'
                                ? 'danger'
                                : reading.status === 'rejected'
                                  ? 'neutral'
                                  : 'success'
                            }
                          >
                            {reading.status === 'submitted' ? 'Billed' : humanize(reading.status)}
                          </StatusBadge>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </DataState>
      </section>
    </div>
  )
}

function TenantDocuments({ tenant, agreementState, onView }) {
  const [working, setWorking] = useState(false)
  const [error, setError] = useState(null)

  async function run(action) {
    setWorking(true)
    setError(null)

    try {
      await action()
    } catch (actionError) {
      setError(actionError)
    } finally {
      setWorking(false)
    }
  }

  return (
    <section className={cardClass}>
      <div className={cardHeaderClass}>
        <h3 className="text-[12px] font-bold">Documents</h3>
      </div>

      {error ? (
        <div className="px-[18px] pt-4">
          <FormError error={error} />
        </div>
      ) : null}

      <DataState
        state={agreementState}
        loadingLabel="Loading documents..."
        isEmpty={(agreement) => !agreement}
        empty={
          <EmptyState
            title="No tenancy agreement yet"
            message="Generate one from your agreement template for this tenant."
          >
            <button
              onClick={() =>
                run(async () => {
                  await generateTenantAgreement(tenant.id)
                  agreementState.reload()
                })
              }
              disabled={working}
              className={`mt-2 ${primaryButtonClass}`}
            >
              {working ? 'Generating...' : 'Generate agreement'}
            </button>
          </EmptyState>
        }
      >
        {(agreement) => (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[780px] border-collapse text-[12px]">
              <thead>
                <tr className={headRowClass}>
                  <th className="px-[18px] py-[10px]">Document</th>
                  <th className="px-[18px] py-[10px]">Type</th>
                  <th className="px-[18px] py-[10px]">Created</th>
                  <th className="px-[18px] py-[10px]">Status</th>
                  <th className="px-[18px] py-[10px]"></th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="px-[18px] py-[13px] font-bold">Tenancy agreement</td>
                  <td className="px-[18px] py-[13px]">PDF</td>
                  <td className="px-[18px] py-[13px]">{formatDate(agreement.generated_at)}</td>
                  <td className="px-[18px] py-[13px]">
                    <AgreementStatus agreement={agreement} />
                  </td>
                  <td className="px-[18px] py-[13px]">
                    <div className="flex justify-end gap-2">
                      <button onClick={onView} className={smallButtonClass}>
                        View
                      </button>
                      <button
                        onClick={() => run(() => downloadTenantAgreement(tenant.id))}
                        disabled={working}
                        className={`inline-flex items-center gap-2 ${smallButtonClass}`}
                      >
                        <Download size={14} />
                        Download
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </DataState>
    </section>
  )
}

function AgreementStatus({ agreement }) {
  return agreement.status === 'signed' ? (
    <StatusBadge tone="success">Signed - {formatDate(agreement.signed_at)}</StatusBadge>
  ) : (
    <StatusBadge tone="warning">Awaiting signature</StatusBadge>
  )
}

function AgreementModal({ tenant, agreementState, onClose }) {
  const [downloading, setDownloading] = useState(false)
  const [error, setError] = useState(null)

  async function downloadPdf() {
    setDownloading(true)
    setError(null)

    try {
      await downloadTenantAgreement(tenant.id)
    } catch (downloadError) {
      setError(downloadError)
    } finally {
      setDownloading(false)
    }
  }

  return (
    <ModalShell title={`Tenancy agreement - ${tenant.full_name}`} onClose={onClose}>
      <ModalBody>
        <DataState
          state={agreementState}
          loadingLabel="Loading agreement..."
          isEmpty={(agreement) => !agreement}
          empty={
            <EmptyState
              title="No tenancy agreement yet"
              message="Generate one from the Documents tab."
            />
          }
        >
          {(agreement) => (
            <>
              <div className="mb-[14px] flex items-center justify-between border-b border-[var(--line)] pb-3">
                <span className="text-[12px] text-[var(--ink-soft)]">Status</span>
                <AgreementStatus agreement={agreement} />
              </div>

              <pre className="font-mono whitespace-pre-wrap rounded-[8px] bg-[var(--bg)] p-[18px] text-[11px] leading-[1.8] text-[var(--ink-soft)]">
                {agreement.rendered_content}
              </pre>
            </>
          )}
        </DataState>

        {error ? (
          <div className="mt-[14px]">
            <FormError error={error} />
          </div>
        ) : null}
      </ModalBody>

      <ModalFooter>
        <button onClick={onClose} className={secondaryButtonClass}>
          Close
        </button>
        {agreementState.data ? (
          <button
            onClick={downloadPdf}
            disabled={downloading}
            className={`inline-flex items-center gap-2 ${primaryButtonClass}`}
          >
            <Download size={15} />
            {downloading ? 'Preparing...' : 'Download PDF'}
          </button>
        ) : null}
      </ModalFooter>
    </ModalShell>
  )
}

// Shared submit handling for the small forms below.
function useSubmit(action, { onClose, onDone }) {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  async function submit(event) {
    event.preventDefault()
    setSaving(true)
    setError(null)

    try {
      await action()
      onDone()
      onClose()
    } catch (submitError) {
      setError(submitError)
      setSaving(false)
    }
  }

  return { saving, error, submit }
}

function MoveOutModal({ tenant, property, onClose, onDone }) {
  const [form, setForm] = useState({
    move_out_date: toDateInput(),
    move_out_reason: '',
  })

  function setField(field) {
    return (event) => setForm((current) => ({ ...current, [field]: event.target.value }))
  }

  const { saving, error, submit } = useSubmit(
    () =>
      moveOutTenant(tenant.id, {
        move_out_date: form.move_out_date,
        move_out_reason: form.move_out_reason.trim() || null,
      }),
    { onClose, onDone }
  )

  const estimate =
    property && form.move_out_date
      ? moveOutEstimate(property, tenant, form.move_out_date, tenant.monthly_rent)
      : null

  return (
    <ModalShell title="Move out / archive tenant" onClose={onClose}>
      <form onSubmit={submit} className="flex flex-1 flex-col overflow-hidden">
        <ModalBody>
          <div className="mb-[18px] rounded-[8px] border border-[var(--line)] bg-[var(--surface)] px-4 py-4">
            <h3 className="text-[15px] font-bold text-[var(--danger)]">
              This will archive {tenant.full_name} and mark House {tenant.unit_number} vacant
            </h3>
            <p className="mt-1 text-[11px] leading-[1.5] text-[var(--ink-faint)]">
              Their payment history, agreement and documents stay on record. Nothing is deleted.
            </p>
          </div>

          <div className="grid gap-[14px] sm:grid-cols-2">
            <Field
              label="Move-out date"
              type="date"
              value={form.move_out_date}
              onChange={setField('move_out_date')}
              required
            />
            <Field
              label="Reason (optional)"
              placeholder="e.g. End of lease, relocating"
              value={form.move_out_reason}
              onChange={setField('move_out_reason')}
            />
          </div>

          <div className="mt-[18px] rounded-[8px] border border-[var(--line)] bg-[var(--surface)] px-4 py-4">
            <h3 className="text-[13px] font-bold text-[var(--ink)]">Deposits</h3>
            <p className="mt-1 text-[11px] leading-[1.5] text-[var(--ink-faint)]">
              Nothing is refunded or deducted at this step. After the
              move-out, a deposit reconciliation appears on this tenant&apos;s
              profile: each deposit covers its own unpaid bills, you add any
              deductions such as repainting, and Calculate gives the final
              amount to refund or still owed.
            </p>
          </div>

          {estimate ? (
            <div className="mt-[18px] rounded-[8px] border border-[var(--line)] bg-[var(--surface)] px-4 py-4">
              <h3 className="text-[13px] font-bold text-[var(--ink)]">Final month</h3>
              <p className="mt-1 text-[11px] leading-[1.5] text-[var(--ink-faint)]">
                {estimate.prorated
                  ? `${formatMonth(form.move_out_date)} rent is reduced to ${estimate.days} of ${estimate.daysInMonth} days: ${formatKES(estimate.amount)} instead of ${formatKES(tenant.monthly_rent)}. Electricity and fixed water bills are reduced the same way, and anything already paid above that returns to the tenant as credit.`
                  : `${formatMonth(form.move_out_date)} is charged in full under this property's move-out rule.`}{' '}
                Charges for any later month are cancelled.
              </p>
            </div>
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
          <button
            type="submit"
            disabled={saving}
            className="rounded-[8px] border border-[var(--danger-solid)] bg-[var(--danger-solid)] px-5 py-[10px] text-[12px] font-bold text-white disabled:opacity-50"
          >
            {saving ? 'Moving out...' : 'Confirm move-out'}
          </button>
        </ModalFooter>
      </form>
    </ModalShell>
  )
}

function EditTenantModal({ tenant, onClose, onDone }) {
  const [form, setForm] = useState({
    full_name: tenant.full_name,
    phone: formatPhone(tenant.phone, ''),
    email: tenant.email || '',
    national_id: tenant.national_id || '',
  })

  function setField(field) {
    return (event) => setForm((current) => ({ ...current, [field]: event.target.value }))
  }

  const { saving, error, submit } = useSubmit(
    () =>
      updateTenant(tenant.id, {
        full_name: form.full_name.trim(),
        phone: form.phone.replace(/\s/g, ''),
        email: form.email.trim() || null,
        national_id: form.national_id.trim() || null,
      }),
    { onClose, onDone }
  )

  return (
    <ModalShell title={`Edit details - ${tenant.full_name}`} onClose={onClose}>
      <form onSubmit={submit} className="flex flex-1 flex-col overflow-hidden">
        <ModalBody>
          <div className="grid gap-[14px] sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Field
                label="Full name"
                value={form.full_name}
                onChange={setField('full_name')}
                required
                minLength={2}
              />
            </div>
            <Field
              label="Phone number"
              inputMode="tel"
              value={form.phone}
              onChange={setField('phone')}
              required
              hint="Changing this changes which M-Pesa number is matched to this tenant."
            />
            <Field label="ID number" value={form.national_id} onChange={setField('national_id')} />
            <div className="sm:col-span-2">
              <Field label="Email" type="email" value={form.email} onChange={setField('email')} />
            </div>
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
          <button type="submit" disabled={saving} className={primaryButtonClass}>
            {saving ? 'Saving...' : 'Save changes'}
          </button>
        </ModalFooter>
      </form>
    </ModalShell>
  )
}

function NoticeModal({ tenant, onClose, onDone }) {
  const [noticeDate, setNoticeDate] = useState(toDateInput())

  const { saving, error, submit } = useSubmit(
    () => updateTenant(tenant.id, { status: 'notice_given', notice_date: noticeDate }),
    { onClose, onDone }
  )

  return (
    <ModalShell title="Mark notice given" onClose={onClose}>
      <form onSubmit={submit} className="flex flex-1 flex-col overflow-hidden">
        <ModalBody>
          <p className="mb-[18px] text-[11px] leading-[1.5] text-[var(--ink-faint)]">
            Records that {tenant.full_name} has given notice to leave House{' '}
            {tenant.unit_number}. They stay a tenant and keep being billed
            until you move them out.
          </p>

          <div className="max-w-[292px]">
            <Field
              label="Date notice was given"
              type="date"
              max={toDateInput()}
              value={noticeDate}
              onChange={(event) => setNoticeDate(event.target.value)}
              required
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
          <button type="submit" disabled={saving} className={primaryButtonClass}>
            {saving ? 'Saving...' : 'Mark notice given'}
          </button>
        </ModalFooter>
      </form>
    </ModalShell>
  )
}

// Puts back a tenant who was moved out by mistake.
function UndoMoveOutModal({ tenant, onClose, onDone }) {
  const [reason, setReason] = useState('')

  const { saving, error, submit } = useSubmit(() => undoMoveOut(tenant.id, reason.trim()), {
    onClose,
    onDone,
  })

  return (
    <ModalShell title="Undo move-out" onClose={onClose}>
      <form onSubmit={submit} className="flex flex-1 flex-col overflow-hidden">
        <ModalBody>
          <p className="mb-[18px] text-[11px] leading-[1.5] text-[var(--ink-faint)]">
            {tenant.full_name} becomes the tenant of House {tenant.unit_number} again, and their
            bills go back to what they were just before the move-out: a last month that was reduced
            is charged in full again, and repairs that were waiting for move-out wait again. Months
            that passed while they were moved out are not billed afterwards.
          </p>

          <p className="mb-[18px] text-[11px] leading-[1.5] text-[var(--ink-faint)]">
            It is not possible once their deposits have been reconciled (reopen the reconciliation
            first), or once the house has another tenant.
          </p>

          <Field
            label="Why is the move-out being undone"
            placeholder="e.g. Moved out the wrong tenant"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            required
            minLength={3}
            maxLength={500}
            autoFocus
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
          <button type="submit" disabled={saving || reason.trim().length < 3} className={primaryButtonClass}>
            {saving ? 'Undoing...' : 'Undo move-out'}
          </button>
        </ModalFooter>
      </form>
    </ModalShell>
  )
}

function DetailRow({ label, value, danger, warning }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-[var(--line-soft)] py-[9px]">
      <span className="text-[12px] text-[var(--ink-soft)]">{label}</span>
      <span className={`font-mono text-right text-[12px] font-bold ${danger ? 'text-[var(--danger)]' : warning ? 'text-[var(--warning)]' : ''}`}>
        {value}
      </span>
    </div>
  )
}

function SectionLine({ title }) {
  return (
    <div className="mb-[10px] flex items-center gap-2">
      <span className="text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--accent-ink)]">
        {title}
      </span>
      <span className="h-px flex-1 bg-[var(--line)]" />
    </div>
  )
}

function IdentityCard({ title, value, badge, blue }) {
  return (
    <div className="mb-[10px] rounded-[8px] border border-[var(--line)] bg-[var(--surface)] px-4 py-4">
      <div className="flex justify-between gap-4">
        <div>
          <h4 className="text-[13px] font-bold">{title}</h4>
          <p className="mt-[4px] text-[10px] text-[var(--ink-faint)]">{value}</p>
        </div>
        <span className={`h-fit rounded-full px-[9px] py-[3px] text-[9px] font-bold ${blue ? 'bg-[var(--info-soft)] text-[var(--info)]' : 'bg-[var(--accent-soft)] text-[var(--accent-hover)]'}`}>
          {badge}
        </span>
      </div>
    </div>
  )
}

export default TenantProfilePage
