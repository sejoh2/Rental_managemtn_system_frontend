import { useState } from 'react'
import { Plus, X } from 'lucide-react'
import { expenses, profitSummary } from '../../data/expensesData'

function ExpensesPage() {
  const [expenseOpen, setExpenseOpen] = useState(false)

  return (
    <>
      <div className="mb-7 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-[10px] text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--accent)]">
            Money
          </div>
          <h1 className="font-display text-[20px] font-semibold tracking-[-0.01em]">
            Expenses
          </h1>
          <p className="mt-2 text-[12px] text-[var(--ink-soft)]">
            Track running costs to see real profit per property.
          </p>
        </div>

        <button
          onClick={() => setExpenseOpen(true)}
          className="inline-flex items-center gap-2 rounded-[8px] border border-[var(--accent)] bg-[var(--accent)] px-4 py-[10px] text-[12px] font-bold text-white"
        >
          <Plus size={15} />
          Add expense
        </button>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.6fr_1fr]">
        <section className="overflow-hidden rounded-[10px] border border-[var(--line)] bg-white">
          <div className="overflow-x-auto">
            <table className="min-w-[760px] w-full border-collapse">
              <thead>
                <tr className="bg-[var(--bg)] text-left text-[9px] uppercase tracking-[0.05em] text-[var(--ink-faint)]">
                  <th className="px-[18px] py-[10px] font-bold">Date</th>
                  <th className="px-[18px] py-[10px] font-bold">Category</th>
                  <th className="px-[18px] py-[10px] font-bold">Property</th>
                  <th className="px-[18px] py-[10px] font-bold">Amount</th>
                  <th className="px-[18px] py-[10px] font-bold">Notes</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((item) => (
                  <tr key={`${item.date}-${item.category}`} className="border-b border-[var(--line-soft)] last:border-b-0">
                    <td className="px-[18px] py-[13px] text-[12px]">{item.date}</td>
                    <td className="px-[18px] py-[13px]">
                      <span className="inline-flex items-center gap-[6px] rounded-full bg-[var(--line-soft)] px-[9px] py-[3px] text-[9px] font-bold text-[var(--ink-soft)]">
                        <span className="h-[6px] w-[6px] rounded-full bg-current" />
                        {item.category}
                      </span>
                    </td>
                    <td className="px-[18px] py-[13px] text-[12px]">{item.property}</td>
                    <td className="font-mono px-[18px] py-[13px] text-[12px]">{item.amount}</td>
                    <td className="px-[18px] py-[13px] text-[12px]">{item.notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="overflow-hidden rounded-[10px] border border-[var(--line)] bg-white">
          <div className="border-b border-[var(--line)] px-[18px] py-4">
            <h3 className="text-[12px] font-bold">This month</h3>
          </div>

          <div className="px-[18px] py-4">
            {profitSummary.map((item) => (
              <div key={item.label} className="flex items-center justify-between border-b border-[var(--line-soft)] py-[10px] text-[12px] last:border-b-0">
                <span className="text-[var(--ink-soft)]">{item.label}</span>
                <span className={`font-mono font-semibold ${item.danger ? 'text-[#B3261E]' : ''}`}>
                  {item.value}
                </span>
              </div>
            ))}

            <div className="mt-5 flex items-center justify-between border-t border-[var(--line)] pt-5">
              <span className="text-[12px] font-bold">Net profit</span>
              <span className="font-mono text-[16px] font-semibold">KES 1,376,700</span>
            </div>
          </div>
        </section>
      </div>

      <AddExpenseModal
        open={expenseOpen}
        onClose={() => setExpenseOpen(false)}
      />
    </>
  )
}

function AddExpenseModal({ open, onClose }) {
  if (!open) return null

  function handleSubmit(event) {
    event.preventDefault()
    window.alert('Expense added successfully.')
    onClose()
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/45 px-4 py-8">
      <div className="w-full max-w-[640px] overflow-hidden rounded-[14px] bg-white shadow-[0_24px_80px_rgba(0,0,0,0.28)]">
        <div className="flex items-center justify-between border-b border-[var(--line)] px-[22px] py-[18px]">
          <h2 className="font-display text-[15px] font-semibold text-[var(--ink)]">
            Add expense
          </h2>

          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--line-soft)] text-[var(--ink-soft)] transition hover:bg-[var(--line)] hover:text-[var(--ink)]"
          >
            <X size={15} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="px-[22px] py-[22px]">
            <div className="mb-[18px] grid gap-[14px] sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-[11px] font-bold text-[var(--ink)]">
                  Property
                </label>
                <select className="h-10 w-full rounded-[8px] border border-[var(--line)] bg-white px-3 text-[12px] text-[var(--ink)] outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)]">
                  <option>Green View Apartments</option>
                  <option>Sunrise Bedsitters</option>
                  <option>Riverside Court</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-[11px] font-bold text-[var(--ink)]">
                  Category
                </label>
                <select className="h-10 w-full rounded-[8px] border border-[var(--line)] bg-white px-3 text-[12px] text-[var(--ink)] outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)]">
                  <option>Repairs & maintenance</option>
                  <option>Security</option>
                  <option>Garbage</option>
                  <option>Cleaning</option>
                  <option>Utilities</option>
                  <option>Other</option>
                </select>
              </div>

              <Field label="Amount (KES)" placeholder="e.g. 6500" />
              <Field label="Date" placeholder="e.g. 13 Jul 2026" />
            </div>

            <div className="mb-[18px]">
              <Field label="Notes" placeholder="e.g. Plumbing repair — House A7" />
            </div>

            <div className="mb-[14px]">
              <label className="mb-2 block text-[11px] font-bold text-[var(--ink)]">
                Receipt (optional)
              </label>
              <input
                type="file"
                className="block h-10 w-full rounded-[8px] border border-[var(--line)] bg-white px-3 py-[7px] text-[12px] text-[var(--ink)] file:mr-3 file:rounded-[4px] file:border file:border-[var(--line)] file:bg-[var(--line-soft)] file:px-2 file:py-[2px] file:text-[12px]"
              />
            </div>

            <p className="text-[11px] leading-[1.5] text-[var(--ink-faint)]">
              This is added to the selected property's ledger immediately and
              reduces its net profit figure in Reports.
            </p>
          </div>

          <div className="flex justify-end gap-[10px] border-t border-[var(--line)] px-[22px] py-[16px]">
            <button
              type="button"
              onClick={onClose}
              className="rounded-[8px] border border-[var(--line)] bg-white px-5 py-[10px] text-[12px] font-bold text-[var(--ink)]"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="rounded-[8px] border border-[var(--accent)] bg-[var(--accent)] px-5 py-[10px] text-[12px] font-bold text-white"
            >
              Add expense
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function Field({ label, placeholder }) {
  return (
    <div>
      <label className="mb-2 block text-[11px] font-bold text-[var(--ink)]">
        {label}
      </label>
      <input
        placeholder={placeholder}
        className="h-10 w-full rounded-[8px] border border-[var(--line)] bg-white px-3 text-[12px] text-[var(--ink)] outline-none placeholder:text-[var(--ink-faint)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)]"
      />
    </div>
  )
}

export default ExpensesPage