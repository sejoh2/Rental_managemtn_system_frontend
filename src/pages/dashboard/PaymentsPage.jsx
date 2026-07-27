import { useState } from 'react'
import { Download, X } from 'lucide-react'
import StatCard from '../../components/dashboard/StatCard'
import { paymentStats, payments } from '../../data/paymentsData'

const unmatchedPayments = [
  {
    id: 'unmatched-001',
    title: 'M-Pesa from 0722 •• 019',
    amount: 'KES 3,000',
    meta: 'Received 2:41 PM - no tenant registered with this phone number',
  },
  {
    id: 'unmatched-002',
    title: 'Bank transfer - Ref "H12-KAMAU"',
    amount: 'KES 8,500',
    meta: "Received 11:15 AM - reference doesn't match any active tenant code",
  },
  {
    id: 'unmatched-003',
    title: 'M-Pesa from 0798 •• 442',
    amount: 'KES 12,000',
    meta: 'Received 9:50 AM - amount covers rent for two possible tenants',
  },
]

function PaymentsPage() {
  const [activeTab, setActiveTab] = useState('All payments')
  const [selectedPayment, setSelectedPayment] = useState(null)

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
            Rent and water payments, matched automatically from M-Pesa and bank feeds.
          </p>
        </div>

        <button
          onClick={() => window.alert('CSV export generated successfully.')}
          className="inline-flex items-center gap-2 rounded-[8px] border border-[var(--line)] bg-white px-4 py-[10px] text-[12px] font-bold"
        >
          <Download size={15} />
          Export CSV
        </button>
      </div>

      <div className="mb-[18px] flex gap-7 border-b border-[var(--line)]">
        {['All payments', 'Unmatched'].map((tab) => (
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
            {tab === 'Unmatched' ? (
              <span className="ml-2 rounded-full bg-[#FBF0DA] px-[9px] py-[3px] text-[9px] text-[#B8790E]">
                3
              </span>
            ) : null}
          </button>
        ))}
      </div>

      {activeTab === 'Unmatched' ? (
        <UnmatchedView onAssign={setSelectedPayment} />
      ) : (
        <AllPaymentsView />
      )}

      <AssignPaymentModal
        payment={selectedPayment}
        onClose={() => setSelectedPayment(null)}
      />
    </>
  )
}

function AllPaymentsView() {
  return (
    <>
      <div className="mb-6 grid gap-[14px] md:grid-cols-3">
        {paymentStats.map((item) => (
          <StatCard key={item.label} {...item} />
        ))}
      </div>

      <section className="overflow-hidden rounded-[10px] border border-[var(--line)] bg-white">
        <div className="overflow-x-auto">
          <table className="min-w-[900px] w-full border-collapse">
            <thead>
              <tr className="bg-[var(--bg)] text-left text-[9px] uppercase tracking-[0.05em] text-[var(--ink-faint)]">
                <th className="px-[18px] py-[10px] font-bold">Tenant</th>
                <th className="px-[18px] py-[10px] font-bold">Amount</th>
                <th className="px-[18px] py-[10px] font-bold">Method</th>
                <th className="px-[18px] py-[10px] font-bold">Applied to</th>
                <th className="px-[18px] py-[10px] font-bold">Date</th>
                <th className="px-[18px] py-[10px] font-bold">Status</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((item) => (
                <tr key={`${item.tenant}-${item.date}`} className="border-b border-[var(--line-soft)] last:border-b-0">
                  <td className="px-[18px] py-[13px] text-[12px] font-bold">{item.tenant}</td>
                  <td className="font-mono px-[18px] py-[13px] text-[12px]">{item.amount}</td>
                  <td className="px-[18px] py-[13px] text-[12px]">{item.method}</td>
                  <td className="px-[18px] py-[13px] text-[12px]">{item.appliedTo}</td>
                  <td className="px-[18px] py-[13px] text-[12px]">{item.date}</td>
                  <td className="px-[18px] py-[13px]">
                    <StatusBadge tone="success">{item.status}</StatusBadge>
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

function UnmatchedView({ onAssign }) {
  return (
    <section className="overflow-hidden rounded-[10px] border border-[var(--line)] bg-white">
      <div className="flex items-center justify-between border-b border-[var(--line)] px-[18px] py-4">
        <h3 className="text-[12px] font-bold">Needs manual review</h3>
        <span className="text-[10px] text-[var(--ink-faint)]">3 transactions</span>
      </div>

      <div className="space-y-[12px] p-[18px]">
        {unmatchedPayments.map((payment) => (
          <div
            key={payment.id}
            className="flex flex-col gap-4 rounded-[8px] border border-[var(--line)] border-l-2 border-l-[var(--accent-soft-line)] bg-white px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-[14px] font-bold">{payment.title}</h3>
                <StatusBadge tone="warning">Unmatched</StatusBadge>
              </div>
              <p className="mt-[5px] text-[11px] text-[var(--ink-faint)]">
                {payment.amount} {payment.meta}
              </p>
            </div>

            <button
              onClick={() => onAssign(payment)}
              className="rounded-[8px] border border-[var(--accent)] bg-[var(--accent)] px-4 py-[10px] text-[12px] font-bold text-white"
            >
              Assign to tenant
            </button>
          </div>
        ))}
      </div>
    </section>
  )
}

function AssignPaymentModal({ payment, onClose }) {
  if (!payment) return null

  function confirmMatch() {
    window.alert('Payment matched to tenant successfully.')
    onClose()
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/45 px-4 py-8">
      <div className="w-full max-w-[640px] overflow-hidden rounded-[14px] bg-white shadow-[0_24px_80px_rgba(0,0,0,0.28)]">
        <div className="flex items-center justify-between border-b border-[var(--line)] px-[22px] py-[18px]">
          <h2 className="font-display text-[15px] font-semibold">
            Assign payment to tenant
          </h2>

          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--line-soft)] text-[var(--ink-soft)]"
          >
            <X size={15} />
          </button>
        </div>

        <div className="px-[22px] py-[22px]">
          <div className="mb-[18px] rounded-[8px] border border-[var(--line)] border-l-2 border-l-[var(--accent-soft-line)] bg-white px-4 py-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-[14px] font-bold">{payment.title}</h3>
                <p className="mt-[4px] text-[11px] text-[var(--ink-faint)]">
                  {payment.meta}
                </p>
              </div>
              <div className="font-mono text-[14px] font-bold">{payment.amount}</div>
            </div>
          </div>

          <label className="mb-2 block text-[11px] font-bold text-[var(--ink)]">
            Match to tenant
          </label>
          <select className="mb-[18px] h-10 w-full rounded-[8px] border border-[var(--line)] bg-white px-3 text-[12px] outline-none">
            <option>John Otieno - H44</option>
            <option>Faith Njeri - H12</option>
            <option>David Kamau - A7</option>
            <option>Grace Achieng - B3</option>
          </select>

          <div className="grid gap-[14px] sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-[11px] font-bold text-[var(--ink)]">
                Apply to
              </label>
              <select className="h-10 w-full rounded-[8px] border border-[var(--line)] bg-white px-3 text-[12px] outline-none">
                <option>Rent balance</option>
                <option>Water bill</option>
                <option>Deposit</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-[11px] font-bold text-[var(--ink)]">
                Also save as tenant's payment number?
              </label>
              <select className="h-10 w-full rounded-[8px] border border-[var(--line)] bg-white px-3 text-[12px] outline-none">
                <option>Yes, remember this number</option>
                <option>No, only match this payment</option>
              </select>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-[10px] border-t border-[var(--line)] px-[22px] py-[16px]">
          <button
            onClick={onClose}
            className="rounded-[8px] border border-[var(--line)] bg-white px-5 py-[10px] text-[12px] font-bold"
          >
            Cancel
          </button>

          <button
            onClick={confirmMatch}
            className="rounded-[8px] border border-[var(--accent)] bg-[var(--accent)] px-5 py-[10px] text-[12px] font-bold text-white"
          >
            Confirm match
          </button>
        </div>
      </div>
    </div>
  )
}

function StatusBadge({ tone, children }) {
  const tones = {
    success: 'bg-[#E3F1E8] text-[#2E7D4F]',
    warning: 'bg-[#FBF0DA] text-[#B8790E]',
  }

  return (
    <span className={`inline-flex items-center gap-[6px] rounded-full px-[9px] py-[3px] text-[9px] font-bold ${tones[tone]}`}>
      <span className="h-[6px] w-[6px] rounded-full bg-current" />
      {children}
    </span>
  )
}

export default PaymentsPage