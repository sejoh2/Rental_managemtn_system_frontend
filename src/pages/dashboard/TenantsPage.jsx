import { useMemo, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Download, FileText, MoreVertical, Plus, X } from 'lucide-react'
import { tenantFilters, tenants } from '../../data/tenantsData'

function TenantsPage({ onAddTenant }) {
  const [activeFilter, setActiveFilter] = useState('All')
  const { tenantId } = useParams()
  const navigate = useNavigate()
  const selectedTenant = tenantId ? tenants.find((tenant) => tenant.id === tenantId) : null
  const onSelectTenant = (tenant) => navigate(`/tenants/${tenant.id}`)

  const filteredTenants = useMemo(() => {
    if (activeFilter === 'All') return tenants

    const filterMap = {
      'In arrears': 'arrears',
      'Credit balance': 'credit',
      'Moving out': 'moving',
    }

    return tenants.filter((tenant) => tenant.filter === filterMap[activeFilter])
  }, [activeFilter])

  if (tenantId && !selectedTenant) {
    return <Navigate to="/tenants" replace />
  }

  if (selectedTenant) {
    return <TenantProfile tenant={selectedTenant} onBack={() => navigate('/tenants')} />
  }

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
            123 active tenants across 3 properties
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
            key={filter.label}
            onClick={() => setActiveFilter(filter.label)}
            className={`pb-[12px] text-[11px] font-bold transition ${
              activeFilter === filter.label
                ? 'border-b-2 border-[var(--accent)] text-[var(--accent)]'
                : 'text-[var(--ink-faint)] hover:text-[var(--accent)]'
            }`}
          >
            {filter.label}
            {filter.count ? ` (${filter.count})` : ''}
          </button>
        ))}
      </div>

      <section className="overflow-hidden rounded-[10px] border border-[var(--line)] bg-white">
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
              {filteredTenants.map((tenant) => (
                <tr
                  key={tenant.id}
                  onClick={() => onSelectTenant(tenant)}
                  className="cursor-pointer border-b border-[var(--line-soft)] transition hover:bg-[var(--bg)] last:border-b-0"
                >
                  <td className="px-[18px] py-[34px]">
                    <div className="text-[12px] font-bold">{tenant.name}</div>
                    <div className="mt-[3px] text-[10px] text-[var(--ink-faint)]">
                      {tenant.phone}
                    </div>
                  </td>

                  <td className="px-[18px] py-[34px] text-[12px]">{tenant.unit}</td>
                  <td className="font-mono px-[18px] py-[34px] text-[12px]">{tenant.rent}</td>

                  <td
                    className={`font-mono px-[18px] py-[34px] text-[12px] ${
                      tenant.balanceTone === 'danger' ? 'text-[#B3261E]' : 'text-[#2E7D4F]'
                    }`}
                  >
                    {tenant.balance}
                  </td>

                  <td className="px-[18px] py-[34px]">
                    <StatusBadge tone={tenant.statusTone}>{tenant.status}</StatusBadge>
                  </td>

                  <td className="px-[18px] py-[34px]">
                    <button
                      onClick={(event) => {
                        event.stopPropagation()
                        onSelectTenant(tenant)
                      }}
                      className="text-[var(--ink-faint)] transition hover:text-[var(--accent)]"
                    >
                      <MoreVertical size={17} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  )
}

function TenantProfile({ tenant, onBack }) {
  const [activeTab, setActiveTab] = useState('Overview')
  const [agreementOpen, setAgreementOpen] = useState(false)
  const [moveOutOpen, setMoveOutOpen] = useState(false)
  const [manualPaymentOpen, setManualPaymentOpen] = useState(false)

  return (
    <>
      <button
        onClick={onBack}
        className="mb-5 inline-flex items-center gap-2 text-[11px] font-bold text-[var(--ink-soft)] hover:text-[var(--accent)]"
      >
        <ArrowLeft size={14} />
        Back to tenants
      </button>

      <div className="mb-7 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-[52px] w-[52px] items-center justify-center rounded-full bg-[var(--accent-soft)] font-display text-[18px] font-bold text-[var(--accent)]">
            {tenant.initials}
          </div>

          <div>
            <h1 className="font-display text-[20px] font-semibold tracking-[-0.01em]">
              {tenant.name}
            </h1>
            <p className="mt-1 text-[12px] text-[var(--ink-soft)]">
              {tenant.property} - House {tenant.house} - Tenant since Jan 2025
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-[10px]">
          <button
            onClick={() => setAgreementOpen(true)}
            className="inline-flex items-center gap-2 rounded-[8px] border border-[var(--line)] bg-white px-4 py-[10px] text-[12px] font-bold"
          >
            <FileText size={15} />
            View agreement
          </button>

          <button
            onClick={() => setMoveOutOpen(true)}
            className="rounded-[8px] border border-[var(--line)] bg-white px-4 py-[10px] text-[12px] font-bold text-[#B3261E]"
          >
            Move out / archive
          </button>
        </div>
      </div>

      <div className="mb-[18px] flex flex-wrap gap-7 border-b border-[var(--line)]">
        {['Overview', 'Payment history', 'Water bills', 'Documents'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-[12px] text-[11px] font-bold ${
              activeTab === tab
                ? 'border-b-2 border-[var(--accent)] text-[var(--accent)]'
                : 'text-[var(--ink-faint)] hover:text-[var(--accent)]'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'Overview' ? (
        <TenantOverview
          tenant={tenant}
          onRecordManualPayment={() => setManualPaymentOpen(true)}
        />
      ) : activeTab === 'Payment history' ? (
        <TenantPaymentHistory
          tenant={tenant}
          onRecordManualPayment={() => setManualPaymentOpen(true)}
        />
      ) : activeTab === 'Water bills' ? (
        <TenantWaterBills />
      ) : (
        <TenantDocuments />
      )}

      <AgreementModal
        open={agreementOpen}
        tenant={tenant}
        onClose={() => setAgreementOpen(false)}
      />

      <MoveOutModal
        open={moveOutOpen}
        tenant={tenant}
        onClose={() => setMoveOutOpen(false)}
      />

      <RecordManualPaymentModal
        open={manualPaymentOpen}
        tenant={tenant}
        onClose={() => setManualPaymentOpen(false)}
      />
    </>
  )
}

function TenantOverview({ tenant, onRecordManualPayment }) {
  return (
    <div className="grid gap-4 xl:grid-cols-[1.6fr_1fr]">
      <div className="space-y-4">
        <section className="overflow-hidden rounded-[10px] border border-[var(--line)] bg-white">
          <div className="flex items-center justify-between border-b border-[var(--line)] px-[18px] py-4">
            <h3 className="text-[12px] font-bold">Rent status</h3>
            <StatusBadge tone="danger">Partial - Balance KES 3,000</StatusBadge>
          </div>

          <div className="px-[18px] py-4 text-[12px]">
            <DetailRow label="July rent due" value="KES 10,000" />
            <DetailRow label="Paid so far" value="KES 7,000" />
            <DetailRow label="Balance" value="KES 3,000" danger />
            <div className="mt-3 h-[5px] rounded-full bg-[var(--line-soft)]">
              <div className="h-full w-[70%] rounded-full bg-[var(--accent)]" />
            </div>
          </div>
        </section>

        <TenantRecentPayments
          tenant={tenant}
          onRecordManualPayment={onRecordManualPayment}
        />
      </div>

      <aside>
        <SectionLine title="Tenant details" />
        <DetailRow label="Phone" value={tenant.phone} />
        <DetailRow label="ID number" value={tenant.idNumber} />
        <DetailRow label="Deposit paid" value={tenant.deposit} />

        <div className="mt-6">
          <SectionLine title="Payment identity" />
          <IdentityCard title="Rent payment" value={tenant.rentPhone} badge="M-Pesa" />
          <IdentityCard title="Water payment" value={tenant.waterReference} badge="Bank ref" blue />
        </div>
      </aside>
    </div>
  )
}

function TenantRecentPayments({ tenant, onRecordManualPayment }) {
  const payments = tenant.payments || []

  return (
    <section className="overflow-hidden rounded-[10px] border border-[var(--line)] bg-white">
      <div className="flex items-center justify-between border-b border-[var(--line)] px-[18px] py-4">
        <h3 className="text-[12px] font-bold">Recent payments</h3>
        <button
          onClick={onRecordManualPayment}
          className="rounded-[8px] border border-[var(--line)] bg-white px-3 py-2 text-[11px] font-bold"
        >
          Record manual payment
        </button>
      </div>

      <table className="w-full min-w-[640px] border-collapse text-[12px]">
        <thead>
          <tr className="bg-[var(--bg)] text-left text-[9px] uppercase tracking-[0.05em] text-[var(--ink-faint)]">
            <th className="px-[18px] py-[10px]">Date</th>
            <th className="px-[18px] py-[10px]">Amount</th>
            <th className="px-[18px] py-[10px]">Method</th>
            <th className="px-[18px] py-[10px]">Applied to</th>
          </tr>
        </thead>
        <tbody>
          {payments.map((payment) => (
            <tr key={payment.date} className="border-b border-[var(--line-soft)] last:border-b-0">
              <td className="px-[18px] py-[13px]">{payment.date}</td>
              <td className="font-mono px-[18px] py-[13px]">{payment.amount}</td>
              <td className="px-[18px] py-[13px]">{payment.method}</td>
              <td className="px-[18px] py-[13px]">{payment.appliedTo}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}

function TenantPaymentHistory({ tenant, onRecordManualPayment }) {
  const rows = [
    ...(tenant.payments || []),
    { date: '3 Apr 2026', amount: 'KES 10,000', method: 'M-Pesa - auto-matched', appliedTo: 'April rent', status: 'Matched' },
    { date: '5 Mar 2026', amount: 'KES 8,000', method: 'M-Pesa - auto-matched', appliedTo: 'March rent', status: 'Partial' },
    { date: '1 Mar 2026', amount: 'KES 2,000', method: 'Cash - recorded by owner', appliedTo: 'March rent', status: 'Matched' },
    { date: '4 Feb 2026', amount: 'KES 10,000', method: 'M-Pesa - auto-matched', appliedTo: 'February rent', status: 'Matched' },
  ]

  return (
    <section className="overflow-hidden rounded-[10px] border border-[var(--line)] bg-white">
      <div className="flex items-center justify-between border-b border-[var(--line)] px-[18px] py-4">
        <h3 className="text-[12px] font-bold">Full payment history</h3>
        <button
          onClick={onRecordManualPayment}
          className="rounded-[8px] border border-[var(--line)] bg-white px-3 py-2 text-[11px] font-bold"
        >
          Record manual payment
        </button>
      </div>

      <table className="w-full min-w-[900px] border-collapse text-[12px]">
        <thead>
          <tr className="bg-[var(--bg)] text-left text-[9px] uppercase tracking-[0.05em] text-[var(--ink-faint)]">
            <th className="px-[18px] py-[10px]">Date</th>
            <th className="px-[18px] py-[10px]">Amount</th>
            <th className="px-[18px] py-[10px]">Method</th>
            <th className="px-[18px] py-[10px]">Applied to</th>
            <th className="px-[18px] py-[10px]">Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((payment) => (
            <tr key={`${payment.date}-${payment.amount}`} className="border-b border-[var(--line-soft)] last:border-b-0">
              <td className="px-[18px] py-[13px]">{payment.date}</td>
              <td className="font-mono px-[18px] py-[13px]">{payment.amount}</td>
              <td className="px-[18px] py-[13px]">{payment.method}</td>
              <td className="px-[18px] py-[13px]">{payment.appliedTo}</td>
              <td className="px-[18px] py-[13px]">
                <StatusBadge tone={payment.status === 'Partial' ? 'danger' : 'success'}>
                  {payment.status || 'Matched'}
                </StatusBadge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}

function TenantWaterBills() {
  const rows = [
    { month: 'Jul 2026', previous: '88', current: '102', units: '14', bill: 'KES 1,400', status: 'Unpaid', tone: 'warning' },
    { month: 'Jun 2026', previous: '76', current: '88', units: '12', bill: 'KES 1,200', status: 'Paid', tone: 'success' },
    { month: 'May 2026', previous: '65', current: '76', units: '11', bill: 'KES 1,100', status: 'Paid', tone: 'success' },
    { month: 'Apr 2026', previous: '52', current: '65', units: '13', bill: 'KES 1,300', status: 'Paid', tone: 'success' },
  ]

  return (
    <div className="space-y-4">
      <section className="overflow-hidden rounded-[10px] border border-[var(--line)] bg-white">
        <div className="flex items-center justify-between border-b border-[var(--line)] px-[18px] py-4">
          <h3 className="text-[12px] font-bold">Water balance</h3>
          <StatusBadge tone="warning">Unpaid - KES 1,400</StatusBadge>
        </div>

        <div className="px-[18px] py-4 text-[12px]">
          <DetailRow label="July water bill" value="KES 1,400" />
          <DetailRow label="Paid so far" value="KES 0" />
          <DetailRow label="Balance" value="KES 1,400" warning />
        </div>
      </section>

      <section className="overflow-hidden rounded-[10px] border border-[var(--line)] bg-white">
        <div className="flex items-center justify-between border-b border-[var(--line)] px-[18px] py-4">
          <h3 className="text-[12px] font-bold">Meter reading history</h3>
          <span className="text-[10px] text-[var(--ink-faint)]">Meter no. GV-H44-02</span>
        </div>

        <table className="w-full min-w-[900px] border-collapse text-[12px]">
          <thead>
            <tr className="bg-[var(--bg)] text-left text-[9px] uppercase tracking-[0.05em] text-[var(--ink-faint)]">
              <th className="px-[18px] py-[10px]">Month</th>
              <th className="px-[18px] py-[10px]">Previous</th>
              <th className="px-[18px] py-[10px]">Current</th>
              <th className="px-[18px] py-[10px]">Units used</th>
              <th className="px-[18px] py-[10px]">Bill</th>
              <th className="px-[18px] py-[10px]">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.month} className="border-b border-[var(--line-soft)] last:border-b-0">
                <td className="px-[18px] py-[13px]">{row.month}</td>
                <td className="px-[18px] py-[13px]">{row.previous}</td>
                <td className="px-[18px] py-[13px]">{row.current}</td>
                <td className="px-[18px] py-[13px]">{row.units}</td>
                <td className="font-mono px-[18px] py-[13px]">{row.bill}</td>
                <td className="px-[18px] py-[13px]">
                  <StatusBadge tone={row.tone}>{row.status}</StatusBadge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  )
}

function TenantDocuments() {
  const documents = [
    { name: 'Signed tenancy agreement', type: 'PDF', uploaded: '2 Jan 2025' },
    { name: 'National ID - front & back', type: 'Image', uploaded: '2 Jan 2025' },
    { name: 'Deposit receipt', type: 'PDF', uploaded: '2 Jan 2025' },
  ]

  function showSuccess() {
    window.alert('Document download prepared successfully.')
  }

  return (
    <section className="overflow-hidden rounded-[10px] border border-[var(--line)] bg-white">
      <div className="flex items-center justify-between border-b border-[var(--line)] px-[18px] py-4">
        <h3 className="text-[12px] font-bold">Documents</h3>
        <button className="inline-flex items-center gap-2 rounded-[8px] border border-[var(--line)] bg-white px-3 py-2 text-[11px] font-bold">
          <Plus size={14} />
          Upload document
        </button>
      </div>

      <table className="w-full min-w-[780px] border-collapse text-[12px]">
        <thead>
          <tr className="bg-[var(--bg)] text-left text-[9px] uppercase tracking-[0.05em] text-[var(--ink-faint)]">
            <th className="px-[18px] py-[10px]">Document</th>
            <th className="px-[18px] py-[10px]">Type</th>
            <th className="px-[18px] py-[10px]">Uploaded</th>
            <th className="px-[18px] py-[10px]"></th>
          </tr>
        </thead>
        <tbody>
          {documents.map((doc) => (
            <tr key={doc.name} className="border-b border-[var(--line-soft)] last:border-b-0">
              <td className="px-[18px] py-[13px] font-bold">{doc.name}</td>
              <td className="px-[18px] py-[13px]">{doc.type}</td>
              <td className="px-[18px] py-[13px]">{doc.uploaded}</td>
              <td className="px-[18px] py-[13px]">
                <button
                  onClick={showSuccess}
                  className="inline-flex items-center gap-2 rounded-[8px] border border-[var(--line)] bg-white px-3 py-2 text-[11px] font-bold"
                >
                  <Download size={14} />
                  Download
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}

function buildAgreementText(tenant) {
  return `TENANCY AGREEMENT

Landlord: Mary Wanjiru
Tenant: ${tenant.name}
Property: ${tenant.property}, House ${tenant.house}
Monthly rent: ${tenant.rent}
Deposit: ${tenant.deposit}
Rent due: 5th of every month
Water: billed separately per meter reading
Notice period: 30 days

Signature: ______________________`
}

function AgreementModal({ open, tenant, onClose }) {
  if (!open) return null

  function downloadPdf() {
    window.alert('Tenancy agreement PDF downloaded successfully.')
    onClose()
  }

  return (
    <ModalShell title={`Tenancy agreement - ${tenant.name}`} onClose={onClose}>
      <div className="px-[22px] py-[22px]">
        <div className="mb-[14px] flex items-center justify-between border-b border-[var(--line)] pb-3">
          <span className="text-[12px] text-[var(--ink-soft)]">Status</span>
          <StatusBadge tone="success">Signed - 2 Jan 2025</StatusBadge>
        </div>

        <pre className="font-mono whitespace-pre-wrap rounded-[8px] bg-[var(--bg)] p-[18px] text-[11px] leading-[1.8] text-[var(--ink-soft)]">
          {buildAgreementText(tenant)}
        </pre>
      </div>

      <ModalFooter>
        <button
          onClick={onClose}
          className="rounded-[8px] border border-[var(--line)] bg-white px-5 py-[10px] text-[12px] font-bold"
        >
          Close
        </button>
        <button
          onClick={downloadPdf}
          className="inline-flex items-center gap-2 rounded-[8px] border border-[var(--accent)] bg-[var(--accent)] px-5 py-[10px] text-[12px] font-bold text-white"
        >
          <Download size={15} />
          Download PDF
        </button>
      </ModalFooter>
    </ModalShell>
  )
}

function RecordManualPaymentModal({ open, tenant, onClose }) {
  if (!open) return null

  function recordPayment(event) {
    event.preventDefault()
    window.alert(`Manual payment recorded for ${tenant.name}.`)
    onClose()
  }

  return (
    <ModalShell title="Record manual payment" onClose={onClose}>
      <form onSubmit={recordPayment}>
        <div className="px-[22px] py-[22px]">
          <p className="mb-[18px] text-[11px] leading-[1.5] text-[var(--ink-faint)]">
            For cash, or any payment that didn't come through M-Pesa or bank
            auto-matching. This is applied straight to {tenant.name}'s balance
            for House {tenant.house}.
          </p>

          <div className="grid gap-[14px] sm:grid-cols-2">
            <Field label="Amount (KES)" placeholder="e.g. 5000" />
            <Field label="Date received" placeholder="e.g. 11 Jul 2026" />

            <div>
              <label className="mb-2 block text-[11px] font-bold text-[var(--ink)]">
                Payment method
              </label>
              <select className="h-10 w-full rounded-[8px] border border-[var(--line)] bg-white px-3 text-[12px] outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)]">
                <option>Cash</option>
                <option>M-Pesa</option>
                <option>Bank transfer</option>
                <option>Other</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-[11px] font-bold text-[var(--ink)]">
                Apply to
              </label>
              <select className="h-10 w-full rounded-[8px] border border-[var(--line)] bg-white px-3 text-[12px] outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)]">
                <option>Rent balance</option>
                <option>Water bill</option>
                <option>Rent deposit</option>
                <option>Electricity deposit</option>
              </select>
            </div>
          </div>

          <div className="mt-[18px]">
            <Field label="Notes (optional)" placeholder="e.g. Paid in person at the office" />
          </div>
        </div>

        <ModalFooter>
          <button
            type="button"
            onClick={onClose}
            className="rounded-[8px] border border-[var(--line)] bg-white px-5 py-[10px] text-[12px] font-bold"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="rounded-[8px] border border-[var(--accent)] bg-[var(--accent)] px-5 py-[10px] text-[12px] font-bold text-white"
          >
            Record payment
          </button>
        </ModalFooter>
      </form>
    </ModalShell>
  )
}

function MoveOutModal({ open, tenant, onClose }) {
  if (!open) return null

  function confirmMoveOut() {
    window.alert(`${tenant.name} has been archived and House ${tenant.house} is now marked vacant.`)
    onClose()
  }

  return (
    <ModalShell title="Move out / archive tenant" onClose={onClose}>
      <div className="px-[22px] py-[22px]">
        <div className="mb-[18px] rounded-[8px] border border-[var(--line)] border-l-2 border-l-[#B3261E] bg-white px-4 py-4">
          <h3 className="text-[15px] font-bold text-[#B3261E]">
            This will archive {tenant.name} and mark House {tenant.house} vacant
          </h3>
          <p className="mt-1 text-[11px] leading-[1.5] text-[var(--ink-faint)]">
            Their payment history, agreement and documents stay on record. Nothing is deleted.
          </p>
        </div>

        <div className="grid gap-[14px] sm:grid-cols-2">
          <Field label="Move-out date" placeholder="e.g. 31 Jul 2026" />
          <div>
            <label className="mb-2 block text-[11px] font-bold text-[var(--ink)]">
              Deposit refund
            </label>
            <select className="h-10 w-full rounded-[8px] border border-[var(--line)] bg-white px-3 text-[12px] outline-none">
              <option>Full refund</option>
              <option>Partial refund</option>
              <option>No refund</option>
            </select>
          </div>
        </div>

        <div className="mt-[18px]">
          <Field label="Reason (optional)" placeholder="e.g. End of lease, relocating" />
        </div>
      </div>

      <ModalFooter>
        <button
          onClick={onClose}
          className="rounded-[8px] border border-[var(--line)] bg-white px-5 py-[10px] text-[12px] font-bold"
        >
          Cancel
        </button>
        <button
          onClick={confirmMoveOut}
          className="rounded-[8px] border border-[#B3261E] bg-[#B3261E] px-5 py-[10px] text-[12px] font-bold text-white"
        >
          Confirm move-out
        </button>
      </ModalFooter>
    </ModalShell>
  )
}

function Field({ label, placeholder }) {
  return (
    <div>
      <label className="mb-2 block text-[11px] font-bold text-[var(--ink)]">{label}</label>
      <input
        placeholder={placeholder}
        className="h-10 w-full rounded-[8px] border border-[var(--line)] bg-white px-3 text-[12px] outline-none placeholder:text-[var(--ink-faint)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)]"
      />
    </div>
  )
}

function ModalShell({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/45 px-4 py-8">
      <div className="w-full max-w-[640px] overflow-hidden rounded-[14px] bg-white shadow-[0_24px_80px_rgba(0,0,0,0.28)]">
        <div className="flex items-center justify-between border-b border-[var(--line)] px-[22px] py-[18px]">
          <h2 className="font-display text-[15px] font-semibold">{title}</h2>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--line-soft)] text-[var(--ink-soft)] transition hover:bg-[var(--line)] hover:text-[var(--ink)]"
          >
            <X size={15} />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

function ModalFooter({ children }) {
  return (
    <div className="flex justify-end gap-[10px] border-t border-[var(--line)] px-[22px] py-[16px]">
      {children}
    </div>
  )
}

function DetailRow({ label, value, danger, warning }) {
  return (
    <div className="flex items-center justify-between border-b border-[var(--line-soft)] py-[9px]">
      <span className="text-[12px] text-[var(--ink-soft)]">{label}</span>
      <span className={`font-mono text-[12px] font-bold ${danger ? 'text-[#B3261E]' : warning ? 'text-[#B8790E]' : ''}`}>
        {value}
      </span>
    </div>
  )
}

function SectionLine({ title }) {
  return (
    <div className="mb-[10px] flex items-center gap-2">
      <span className="text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--accent)]">
        {title}
      </span>
      <span className="h-px flex-1 bg-[var(--line)]" />
    </div>
  )
}

function IdentityCard({ title, value, badge, blue }) {
  return (
    <div className="mb-[10px] rounded-[8px] border border-[var(--line)] border-l-2 border-l-[var(--accent-soft-line)] bg-white px-4 py-4">
      <div className="flex justify-between gap-4">
        <div>
          <h4 className="text-[13px] font-bold">{title}</h4>
          <p className="mt-[4px] text-[10px] text-[var(--ink-faint)]">{value}</p>
        </div>
        <span className={`rounded-full px-[9px] py-[3px] text-[9px] font-bold ${blue ? 'bg-[#E6EDF4] text-[#3C5C82]' : 'bg-[var(--accent-soft)] text-[var(--accent-hover)]'}`}>
          {badge}
        </span>
      </div>
    </div>
  )
}

function StatusBadge({ tone, children }) {
  const tones = {
    success: 'bg-[#E3F1E8] text-[#2E7D4F]',
    danger: 'bg-[#FBE4E2] text-[#B3261E]',
    info: 'bg-[#E6EDF4] text-[#3C5C82]',
    warning: 'bg-[#FBF0DA] text-[#B8790E]',
  }

  return (
    <span className={`inline-flex items-center gap-[6px] rounded-full px-[9px] py-[3px] text-[9px] font-bold ${tones[tone]}`}>
      <span className="h-[6px] w-[6px] rounded-full bg-current" />
      {children}
    </span>
  )
}

export default TenantsPage