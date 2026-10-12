import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Download, Plus } from 'lucide-react'
import {
  createExpense,
  exportExpenses,
  getExpenseSummary,
  listExpenses,
  voidExpense,
} from '../../api/expenses'
import { DataState, EmptyState, FormError } from '../../components/common/DataState'
import {
  Field,
  ModalBody,
  ModalFooter,
  ModalShell,
  SelectField,
  primaryButtonClass,
  secondaryButtonClass,
} from '../../components/common/Modal'
import { useProperties } from '../../context/PropertiesContext'
import { useApi } from '../../hooks/useApi'
import { formatDate, formatKES, formatMonth, formatNumber, toDateInput } from '../../utils/format'
import { EXPENSE_CATEGORIES, optionLabel } from '../../utils/labels'

// First and last day of a 'YYYY-MM' month, as 'YYYY-MM-DD'.
function monthRange(month) {
  const [year, monthNumber] = month.split('-').map(Number)
  const lastDay = new Date(year, monthNumber, 0).getDate()

  return { from_date: `${month}-01`, to_date: `${month}-${String(lastDay).padStart(2, '0')}` }
}

function ExpensesPage() {
  const properties = useProperties().data || []
  const [searchParams, setSearchParams] = useSearchParams()
  const [addOpen, setAddOpen] = useState(false)
  const [voiding, setVoiding] = useState(null)

  const [exporting, setExporting] = useState(false)
  const [exportError, setExportError] = useState(null)

  // Filters live in the URL: /expenses?property=1&month=2026-10&category=security
  const propertyId = searchParams.get('property') || ''
  const category = searchParams.get('category') || ''
  const month = searchParams.get('month') || toDateInput().slice(0, 7)
  const filters = { property_id: propertyId, ...monthRange(month) }
  // The category narrows the list and the export; the month summary always covers every category.
  const listFilters = { ...filters, category }
  const key = `${propertyId || 'all'}-${month}`

  const expensesState = useApi(`expenses-${key}-${category}`, () => listExpenses(listFilters))
  const summaryState = useApi(`expense-summary-${key}`, () => getExpenseSummary(filters))

  async function exportCsv() {
    setExporting(true)
    setExportError(null)

    try {
      await exportExpenses(listFilters)
    } catch (error) {
      setExportError(error)
    } finally {
      setExporting(false)
    }
  }

  function setParam(name, value) {
    const next = new URLSearchParams(searchParams)

    if (value) next.set(name, value)
    else next.delete(name)

    setSearchParams(next)
  }

  function reloadAll() {
    expensesState.reload()
    summaryState.reload()
  }

  const summary = summaryState.data
  const incomeRows = summary
    ? [
        ['Rent collected', summary.rent_collected],
        ['Water collected', summary.water_collected],
        ['Electricity collected', summary.electricity_collected],
      ]
    : []

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

        <div className="flex flex-wrap gap-[10px]">
          <select
            value={propertyId}
            onChange={(event) => setParam('property', event.target.value)}
            className="min-w-[200px] rounded-[8px] border border-[var(--line)] bg-white px-3 py-[10px] text-[12px] font-bold"
          >
            <option value="">All properties</option>
            {properties.map((property) => (
              <option key={property.id} value={property.id}>{property.name}</option>
            ))}
          </select>

          <select
            value={category}
            onChange={(event) => setParam('category', event.target.value)}
            aria-label="Category"
            className="rounded-[8px] border border-[var(--line)] bg-white px-3 py-[10px] text-[12px] font-bold"
          >
            <option value="">All categories</option>
            {EXPENSE_CATEGORIES.map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>

          <input
            type="month"
            value={month}
            max={toDateInput().slice(0, 7)}
            onChange={(event) => event.target.value && setParam('month', event.target.value)}
            aria-label="Month"
            className="rounded-[8px] border border-[var(--line)] bg-white px-3 py-[10px] text-[12px] font-bold"
          />

          <button
            onClick={exportCsv}
            disabled={exporting || !expensesState.data?.length}
            className="inline-flex items-center gap-2 rounded-[8px] border border-[var(--line)] bg-white px-4 py-[10px] text-[12px] font-bold disabled:opacity-50"
          >
            <Download size={15} />
            {exporting ? 'Exporting...' : 'Export CSV'}
          </button>

          <button
            onClick={() => setAddOpen(true)}
            disabled={!properties.length}
            className="inline-flex items-center gap-2 rounded-[8px] border border-[var(--accent)] bg-[var(--accent)] px-4 py-[10px] text-[12px] font-bold text-white disabled:opacity-50"
          >
            <Plus size={15} />
            Add expense
          </button>
        </div>
      </div>

      {exportError ? (
        <div className="mb-4">
          <FormError error={exportError} />
        </div>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-[1.6fr_1fr]">
        <section className="overflow-hidden rounded-[10px] border border-[var(--line)] bg-white">
          <DataState
            state={expensesState}
            loadingLabel="Loading expenses..."
            isEmpty={(expenses) => !expenses.length}
            empty={
              <EmptyState
                title={`No ${category ? `${optionLabel(EXPENSE_CATEGORIES, category).toLowerCase()} ` : ''}expenses in ${formatMonth(`${month}-01`)}`}
                message="Add repairs, security, garbage and other running costs to see the real profit for the month."
              />
            }
          >
            {(expenses) => (
              <div className="overflow-x-auto">
                <table className="min-w-[820px] w-full border-collapse">
                  <thead>
                    <tr className="bg-[var(--bg)] text-left text-[9px] uppercase tracking-[0.05em] text-[var(--ink-faint)]">
                      <th className="px-[18px] py-[10px] font-bold">Date</th>
                      <th className="px-[18px] py-[10px] font-bold">Category</th>
                      <th className="px-[18px] py-[10px] font-bold">Property</th>
                      <th className="px-[18px] py-[10px] font-bold">Amount</th>
                      <th className="px-[18px] py-[10px] font-bold">Notes</th>
                      <th className="px-[18px] py-[10px] font-bold"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {expenses.map((item) => {
                      const voided = item.status === 'void'

                      return (
                        <tr
                          key={item.id}
                          className={`border-b border-[var(--line-soft)] last:border-b-0 ${
                            voided ? 'text-[var(--ink-faint)]' : ''
                          }`}
                        >
                          <td className="px-[18px] py-[13px] text-[12px]">{formatDate(item.expense_date)}</td>
                          <td className="px-[18px] py-[13px]">
                            <span className="inline-flex items-center gap-[6px] rounded-full bg-[var(--line-soft)] px-[9px] py-[3px] text-[9px] font-bold text-[var(--ink-soft)]">
                              <span className="h-[6px] w-[6px] rounded-full bg-current" />
                              {optionLabel(EXPENSE_CATEGORIES, item.category)}
                            </span>
                          </td>
                          <td className="px-[18px] py-[13px] text-[12px]">{item.property_name}</td>
                          <td className={`font-mono px-[18px] py-[13px] text-[12px] ${voided ? 'line-through' : ''}`}>
                            {formatKES(item.amount)}
                          </td>
                          <td className="px-[18px] py-[13px] text-[12px]">
                            {voided ? `Voided: ${item.void_reason}` : item.notes || '-'}
                          </td>
                          <td className="px-[18px] py-[13px] text-right">
                            {voided ? null : (
                              <button
                                onClick={() => setVoiding(item)}
                                className="rounded-[8px] border border-[var(--line)] bg-white px-3 py-2 text-[11px] font-bold text-[var(--ink)]"
                              >
                                Void
                              </button>
                            )}
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

        <section className="h-fit overflow-hidden rounded-[10px] border border-[var(--line)] bg-white">
          <div className="border-b border-[var(--line)] px-[18px] py-4">
            <h3 className="text-[12px] font-bold">{formatMonth(`${month}-01`)}</h3>
          </div>

          <DataState state={summaryState} loadingLabel="Loading summary...">
            {() => (
              <div className="px-[18px] py-4">
                {incomeRows.map(([label, value]) => (
                  <div key={label} className="flex items-center justify-between border-b border-[var(--line-soft)] py-[10px] text-[12px]">
                    <span className="text-[var(--ink-soft)]">{label}</span>
                    <span className="font-mono font-semibold">{formatKES(value)}</span>
                  </div>
                ))}

                <div className="flex items-center justify-between py-[10px] text-[12px]">
                  <span className="text-[var(--ink-soft)]">Total expenses</span>
                  <span className="font-mono font-semibold text-[#B3261E]">
                    - {formatNumber(summary.total_expenses)}
                  </span>
                </div>

                <div className="mt-3 flex items-center justify-between border-t border-[var(--line)] pt-5">
                  <span className="text-[12px] font-bold">Net profit</span>
                  <span className={`font-mono text-[16px] font-semibold ${summary.net_profit < 0 ? 'text-[#B3261E]' : ''}`}>
                    {formatKES(summary.net_profit)}
                  </span>
                </div>

                <p className="mt-4 text-[10px] leading-[1.5] text-[var(--ink-faint)]">
                  Income is rent, water and electricity actually paid in the
                  month. Deposits are not counted, because they are held for
                  the tenant.
                </p>
              </div>
            )}
          </DataState>
        </section>
      </div>

      {addOpen ? (
        <AddExpenseModal
          properties={properties}
          defaultPropertyId={propertyId}
          onClose={() => setAddOpen(false)}
          onDone={reloadAll}
        />
      ) : null}

      {voiding ? (
        <VoidExpenseModal expense={voiding} onClose={() => setVoiding(null)} onDone={reloadAll} />
      ) : null}
    </>
  )
}

function AddExpenseModal({ properties, defaultPropertyId, onClose, onDone }) {
  const [form, setForm] = useState({
    property_id: defaultPropertyId || String(properties[0]?.id || ''),
    category: 'repairs_maintenance',
    amount: '',
    expense_date: toDateInput(),
    notes: '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  function setField(field) {
    return (event) => setForm((current) => ({ ...current, [field]: event.target.value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setSaving(true)
    setError(null)

    try {
      await createExpense(form.property_id, {
        category: form.category,
        amount: Number(form.amount),
        expense_date: form.expense_date,
        notes: form.notes.trim() || null,
      })

      onDone()
      onClose()
    } catch (saveError) {
      setError(saveError)
      setSaving(false)
    }
  }

  return (
    <ModalShell title="Add expense" onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-hidden">
        <ModalBody>
          <div className="mb-[18px] grid gap-[14px] sm:grid-cols-2">
            <SelectField
              label="Property"
              value={form.property_id}
              onChange={setField('property_id')}
              options={properties.map((property) => [String(property.id), property.name])}
            />
            <SelectField
              label="Category"
              value={form.category}
              onChange={setField('category')}
              options={EXPENSE_CATEGORIES}
            />

            <Field
              label="Amount (KES)"
              placeholder="e.g. 6500"
              type="number"
              min="1"
              step="any"
              value={form.amount}
              onChange={setField('amount')}
              required
            />
            <Field
              label="Date"
              type="date"
              max={toDateInput()}
              value={form.expense_date}
              onChange={setField('expense_date')}
              required
            />
          </div>

          <Field
            label="Notes"
            placeholder="e.g. Plumbing repair — House A7"
            value={form.notes}
            onChange={setField('notes')}
          />

          <p className="mt-[14px] text-[11px] leading-[1.5] text-[var(--ink-faint)]">
            This is added to the selected property's ledger immediately and
            reduces its net profit figure in Reports.
          </p>

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
            {saving ? 'Adding...' : 'Add expense'}
          </button>
        </ModalFooter>
      </form>
    </ModalShell>
  )
}

function VoidExpenseModal({ expense, onClose, onDone }) {
  const [reason, setReason] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  async function handleSubmit(event) {
    event.preventDefault()
    setSaving(true)
    setError(null)

    try {
      await voidExpense(expense.id, reason.trim())
      onDone()
      onClose()
    } catch (saveError) {
      setError(saveError)
      setSaving(false)
    }
  }

  return (
    <ModalShell title="Void expense" onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-hidden">
        <ModalBody>
          <div className="mb-[18px] rounded-[8px] border border-[var(--line)] border-l-2 border-l-[#B3261E] bg-white px-4 py-4">
            <h3 className="text-[14px] font-bold text-[#B3261E]">
              {formatKES(expense.amount)} · {optionLabel(EXPENSE_CATEGORIES, expense.category)} ·{' '}
              {expense.property_name}
            </h3>
            <p className="mt-1 text-[11px] leading-[1.5] text-[var(--ink-faint)]">
              The expense stays on record, marked as voided, and no longer
              counts towards totals or net profit. To correct an expense,
              void it and add it again.
            </p>
          </div>

          <Field
            label="Reason"
            placeholder="e.g. Entered twice"
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
            {saving ? 'Voiding...' : 'Void expense'}
          </button>
        </ModalFooter>
      </form>
    </ModalShell>
  )
}

export default ExpensesPage
