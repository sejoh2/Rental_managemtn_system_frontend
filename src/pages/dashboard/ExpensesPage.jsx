import { Fragment, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Download, Paperclip, Plus, X } from 'lucide-react'
import {
  createExpense,
  exportExpenses,
  getExpenseReconciliation,
  getExpenseSummary,
  listExpenses,
  updateExpense,
  voidExpense,
} from '../../api/expenses'
import { countFiles, uploadFile } from '../../api/files'
import { listUnits } from '../../api/units'
import { AttachmentsRow } from '../../components/common/Attachments'
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
import StatusBadge from '../../components/common/StatusBadge'
import TakePhoto from '../../components/common/TakePhoto'
import { EXPENSE_CATEGORIES, EXPENSE_RECOVERY, optionLabel } from '../../utils/labels'

// First and last day of a 'YYYY-MM' month, as 'YYYY-MM-DD'.
function monthRange(month) {
  const [year, monthNumber] = month.split('-').map(Number)
  const lastDay = new Date(year, monthNumber, 0).getDate()

  return { from_date: `${month}-01`, to_date: `${month}-${String(lastDay).padStart(2, '0')}` }
}

function ExpensesPage() {
  const { data, selectedId: propertyId } = useProperties()
  const properties = data || []
  const [searchParams, setSearchParams] = useSearchParams()
  const [addOpen, setAddOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [voiding, setVoiding] = useState(null)
  // The expense whose receipts are open, under its row.
  const [receiptsFor, setReceiptsFor] = useState(null)

  const [exporting, setExporting] = useState(false)
  const [exportError, setExportError] = useState(null)

  // The property is chosen in the top bar; the rest live in the URL: /expenses?month=2026-10&category=security
  const category = searchParams.get('category') || ''
  const month = searchParams.get('month') || toDateInput().slice(0, 7)
  const filters = { property_id: propertyId, ...monthRange(month) }
  // The category narrows the list and the export; the month summary always covers every category.
  const listFilters = { ...filters, category }
  const key = `${propertyId || 'all'}-${month}`

  const expensesState = useApi(`expenses-${key}-${category}`, () => listExpenses(listFilters))
  const summaryState = useApi(`expense-summary-${key}`, () => getExpenseSummary(filters))
  const reconciliationState = useApi(`expense-reconciliation-${key}`, () =>
    getExpenseReconciliation(filters)
  )

  // How many receipts each listed expense has, shown on its Receipt button.
  const expenseIds = (expensesState.data || []).map((item) => item.id)
  const receiptCountsState = useApi(expenseIds.length ? `receipt-counts-${expenseIds.join('-')}` : null, () =>
    countFiles('expense_receipt', expenseIds)
  )
  const receiptCounts = receiptCountsState.data || {}

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
    reconciliationState.reload()
  }

  const summary = summaryState.data
  const incomeRows = summary
    ? [
        ['Rent collected', summary.rent_collected],
        ['Water collected', summary.water_collected],
        ['Electricity collected', summary.electricity_collected],
        ['Service charges collected', summary.service_collected],
        ['Repairs & deductions collected', summary.repairs_collected],
      ]
    : []

  return (
    <>
      <div className="mb-7 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-[10px] text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--accent-ink)]">
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
            value={category}
            onChange={(event) => setParam('category', event.target.value)}
            aria-label="Category"
            className="rounded-[8px] border border-[var(--line)] bg-[var(--surface)] px-3 py-[10px] text-[12px] font-bold"
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
            className="rounded-[8px] border border-[var(--line)] bg-[var(--surface)] px-3 py-[10px] text-[12px] font-bold"
          />

          <button
            onClick={exportCsv}
            disabled={exporting || !expensesState.data?.length}
            className="inline-flex items-center gap-2 rounded-[8px] border border-[var(--line)] bg-[var(--surface)] px-4 py-[10px] text-[12px] font-bold disabled:opacity-50"
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
        <section className="overflow-hidden rounded-[10px] border border-[var(--line)] bg-[var(--surface)]">
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
                <table className="min-w-[980px] w-full border-collapse">
                  <thead>
                    <tr className="bg-[var(--bg)] text-left text-[9px] uppercase tracking-[0.05em] text-[var(--ink-faint)]">
                      <th className="px-[18px] py-[10px] font-bold">Date</th>
                      <th className="px-[18px] py-[10px] font-bold">Category</th>
                      <th className="px-[18px] py-[10px] font-bold">Property</th>
                      <th className="px-[18px] py-[10px] font-bold">Amount</th>
                      <th className="px-[18px] py-[10px] font-bold">Notes</th>
                      <th className="px-[18px] py-[10px] font-bold">Who covers it</th>
                      <th className="px-[18px] py-[10px] font-bold"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {expenses.map((item) => {
                      const voided = item.status === 'void'

                      return (
                        <Fragment key={item.id}>
                        <tr
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
                            {!voided && item.unit_number ? (
                              <span className="block text-[10px] text-[var(--ink-faint)]">
                                House {item.unit_number}
                              </span>
                            ) : null}
                          </td>
                          <td className="px-[18px] py-[13px] text-[12px]">
                            {voided ? null : <ExpenseRecovery expense={item} />}
                          </td>
                          <td className="px-[18px] py-[13px] text-right">
                            {voided ? null : (
                              <div className="flex justify-end gap-2">
                                <button
                                  onClick={() =>
                                    setReceiptsFor((current) => (current?.id === item.id ? null : item))
                                  }
                                  className="rounded-[8px] border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-[11px] font-bold text-[var(--ink)]"
                                >
                                  {receiptCounts[item.id] ? `Receipt (${receiptCounts[item.id]})` : 'Receipt'}
                                </button>
                                {/* A repair from a maintenance request is fixed; a tenant may have been charged for it. */}
                                {item.maintenance_request_id ? null : (
                                  <button
                                    onClick={() => setEditing(item)}
                                    className="rounded-[8px] border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-[11px] font-bold text-[var(--ink)]"
                                  >
                                    Edit
                                  </button>
                                )}
                                <button
                                  onClick={() => setVoiding(item)}
                                  className="rounded-[8px] border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-[11px] font-bold text-[var(--ink)]"
                                >
                                  Void
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>

                        {receiptsFor?.id === item.id && !voided ? (
                          <AttachmentsRow
                            colSpan={7}
                            title="Receipts for this expense"
                            kind="expense_receipt"
                            targetId={item.id}
                            emptyText="No receipt yet."
                            onClose={() => setReceiptsFor(null)}
                            onChanged={receiptCountsState.reload}
                          />
                        ) : null}
                        </Fragment>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </DataState>
        </section>

        <section className="h-fit overflow-hidden rounded-[10px] border border-[var(--line)] bg-[var(--surface)]">
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
                  <span className="font-mono font-semibold text-[var(--danger)]">
                    - {formatNumber(summary.total_expenses)}
                  </span>
                </div>

                <div className="mt-3 flex items-center justify-between border-t border-[var(--line)] pt-5">
                  <span className="text-[12px] font-bold">Net profit</span>
                  <span className={`font-mono text-[16px] font-semibold ${summary.net_profit < 0 ? 'text-[var(--danger)]' : ''}`}>
                    {formatKES(summary.net_profit)}
                  </span>
                </div>

                <p className="mt-4 text-[10px] leading-[1.5] text-[var(--ink-faint)]">
                  Income is rent, water, electricity, service charges and
                  repairs actually paid in the month. Deposits are not
                  counted while they are held for the tenant; deposit money
                  used for a bill at move-out is counted on that day.
                </p>
              </div>
            )}
          </DataState>
        </section>
      </div>

      <section className="mt-4 overflow-hidden rounded-[10px] border border-[var(--line)] bg-[var(--surface)]">
        <div className="border-b border-[var(--line)] px-[18px] py-4">
          <h3 className="text-[12px] font-bold">
            Recovered from tenants - {formatMonth(`${month}-01`)}
          </h3>
          <p className="mt-[3px] text-[10px] leading-[1.5] text-[var(--ink-faint)]">
            What you spent in each category against what tenants were charged
            for it through service charges, repairs and move-out deductions.
          </p>
        </div>

        <DataState
          state={reconciliationState}
          loadingLabel="Loading reconciliation..."
          isEmpty={(data) => !data.categories.length}
          empty={
            <EmptyState
              title="Nothing to reconcile"
              message="No expenses were recorded and no service charges or repairs were billed to tenants for this month."
            />
          }
        >
          {(data) => (
            <div className="overflow-x-auto">
              <table className="min-w-[760px] w-full border-collapse">
                <thead>
                  <tr className="bg-[var(--bg)] text-left text-[9px] uppercase tracking-[0.05em] text-[var(--ink-faint)]">
                    <th className="px-[18px] py-[10px] font-bold">Category</th>
                    <th className="px-[18px] py-[10px] font-bold">You spent</th>
                    <th className="px-[18px] py-[10px] font-bold">Charged to tenants</th>
                    <th className="px-[18px] py-[10px] font-bold">Tenants have paid</th>
                    <th className="px-[18px] py-[10px] font-bold">Still owed by tenants</th>
                    <th className="px-[18px] py-[10px] font-bold">Your own cost</th>
                  </tr>
                </thead>
                <tbody>
                  {[...data.categories, { ...data.totals, category: 'total' }].map((row) => (
                    <tr
                      key={row.category}
                      className={`border-b border-[var(--line-soft)] text-[12px] last:border-b-0 ${
                        row.category === 'total' ? 'font-bold' : ''
                      }`}
                    >
                      <td className="px-[18px] py-[13px]">
                        {row.category === 'total'
                          ? 'Total'
                          : optionLabel(EXPENSE_CATEGORIES, row.category)}
                      </td>
                      <td className="font-mono px-[18px] py-[13px]">{formatKES(row.spent)}</td>
                      <td className="font-mono px-[18px] py-[13px]">{formatKES(row.charged)}</td>
                      <td className="font-mono px-[18px] py-[13px]">{formatKES(row.paid)}</td>
                      <td className={`font-mono px-[18px] py-[13px] ${row.outstanding > 0 ? 'text-[var(--warning)]' : ''}`}>
                        {formatKES(row.outstanding)}
                      </td>
                      <td className="font-mono px-[18px] py-[13px]">
                        {row.owner_cost < 0
                          ? `${formatKES(-row.owner_cost)} over-recovered`
                          : formatKES(row.owner_cost)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </DataState>
      </section>

      {addOpen ? (
        <ExpenseFormModal
          properties={properties}
          defaultPropertyId={propertyId}
          onClose={() => setAddOpen(false)}
          onDone={reloadAll}
        />
      ) : null}

      {editing ? (
        <ExpenseFormModal
          properties={properties}
          expense={editing}
          onClose={() => setEditing(null)}
          onDone={reloadAll}
        />
      ) : null}

      {voiding ? (
        <VoidExpenseModal expense={voiding} onClose={() => setVoiding(null)} onDone={reloadAll} />
      ) : null}
    </>
  )
}

/*
  Who carries one expense. Only a repair from a maintenance request can be
  charged to one tenant; other costs are recovered through service charges,
  which the table per category shows.
*/
function ExpenseRecovery({ expense }) {
  const recovery = expense.recovery

  if (!expense.maintenance_request_id) {
    return <span className="text-[11px] text-[var(--ink-faint)]">By category, see below</span>
  }

  const [label, tone] = EXPENSE_RECOVERY[recovery.status]

  const detail = {
    owner_cost: 'Not charged to a tenant',
    recovered: `${recovery.tenant_name} paid ${formatKES(recovery.paid)}`,
    pending: `${recovery.tenant_name} owes ${formatKES(recovery.pending)} of ${formatKES(recovery.charged)}`,
    at_move_out: `${recovery.tenant_name}, ${formatKES(recovery.pending)} from their deposit`,
  }[recovery.status]

  return (
    <>
      <StatusBadge tone={tone}>{label}</StatusBadge>
      <span className="mt-1 block text-[10px] text-[var(--ink-faint)]">{detail}</span>
    </>
  )
}

// Adds an expense, or corrects one when `expense` is passed.
// The same limits the server applies to a receipt.
const RECEIPT_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
const RECEIPT_MAX_BYTES = 5 * 1024 * 1024

function ExpenseFormModal({ properties, defaultPropertyId, expense, onClose, onDone }) {
  const [form, setForm] = useState({
    property_id: expense
      ? String(expense.property_id)
      : defaultPropertyId || String(properties[0]?.id || ''),
    // Empty means the cost is for the whole property.
    unit_id: expense?.unit_id ? String(expense.unit_id) : '',
    category: expense?.category || 'repairs_maintenance',
    amount: expense ? String(expense.amount) : '',
    expense_date: expense ? toDateInput(expense.expense_date) : toDateInput(),
    notes: expense?.notes || '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  // Receipts chosen for a new expense; they are uploaded once the expense is saved.
  const [receipts, setReceipts] = useState([])
  // Set when the expense was saved but a receipt could not be uploaded.
  const [savedWithoutReceipt, setSavedWithoutReceipt] = useState(false)
  const fileInput = useRef(null)

  function handleFilesChosen(event) {
    const chosen = [...event.target.files]

    // Lets the same file be chosen again after it is removed.
    event.target.value = ''

    const wrongType = chosen.find((file) => !RECEIPT_TYPES.includes(file.type))
    const tooLarge = chosen.find((file) => file.size > RECEIPT_MAX_BYTES)

    if (wrongType || tooLarge) {
      setError({
        message: wrongType
          ? `${wrongType.name} cannot be attached. Use a photo (JPG, PNG, WEBP) or a PDF.`
          : `${tooLarge.name} is too large. The limit is 5 MB.`,
      })

      return
    }

    setError(null)
    setReceipts((current) => [...current, ...chosen])
  }

  const unitsState = useApi(form.property_id ? `units-${form.property_id}` : null, () =>
    listUnits(form.property_id)
  )

  function setField(field) {
    return (event) => setForm((current) => ({ ...current, [field]: event.target.value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setSaving(true)
    setError(null)

    const body = {
      category: form.category,
      amount: Number(form.amount),
      expense_date: form.expense_date,
      notes: form.notes.trim() || null,
      unit_id: form.unit_id ? Number(form.unit_id) : null,
    }

    let created = null

    try {
      if (expense) await updateExpense(expense.id, body)
      else created = await createExpense(form.property_id, body)
    } catch (saveError) {
      setError(saveError)
      setSaving(false)

      return
    }

    try {
      for (const file of receipts) await uploadFile('expense_receipt', created.id, file, '')
    } catch (uploadError) {
      // The expense itself is saved; saving again would add it twice.
      onDone()
      setSavedWithoutReceipt(true)
      setError({
        message: `The expense was saved, but a receipt could not be attached: ${uploadError.message} Close this and use Receipt on the expense's row to attach it.`,
      })
      setSaving(false)

      return
    }

    onDone()
    onClose()
  }

  return (
    <ModalShell title={expense ? 'Edit expense' : 'Add expense'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-hidden">
        <ModalBody>
          <div className="mb-[18px] grid gap-[14px] sm:grid-cols-2">
            <SelectField
              label="Property"
              value={form.property_id}
              onChange={(event) =>
                setForm((current) => ({ ...current, property_id: event.target.value, unit_id: '' }))
              }
              options={properties.map((property) => [String(property.id), property.name])}
              disabled={Boolean(expense)}
            />
            <SelectField
              label="This cost is for"
              value={form.unit_id}
              onChange={setField('unit_id')}
              options={[
                ['', unitsState.loading ? 'Loading units...' : 'The whole property'],
                ...(unitsState.data || []).map((unit) => [String(unit.id), `House ${unit.unit_number}`]),
              ]}
            />

            <div className="sm:col-span-2">
              <SelectField
                label="Category"
                value={form.category}
                onChange={setField('category')}
                options={EXPENSE_CATEGORIES}
              />
            </div>

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

          {expense ? null : (
            <div className="mt-[18px]">
              <label className="mb-2 block text-[11px] font-bold text-[var(--ink)]">Receipt (optional)</label>

              {receipts.map((file, index) => (
                <div
                  key={`${file.name}-${index}`}
                  className="mb-2 flex items-center justify-between gap-3 rounded-[8px] border border-[var(--line)] bg-[var(--bg)] px-3 py-2 text-[11px]"
                >
                  <span className="truncate">{file.name}</span>
                  <button
                    type="button"
                    onClick={() => setReceipts((current) => current.filter((_, at) => at !== index))}
                    disabled={saving || savedWithoutReceipt}
                    aria-label={`Remove ${file.name}`}
                    className="text-[var(--ink-faint)] hover:text-[var(--danger)]"
                  >
                    <X size={15} />
                  </button>
                </div>
              ))}

              <input
                ref={fileInput}
                type="file"
                accept={RECEIPT_TYPES.join(',')}
                multiple
                onChange={handleFilesChosen}
                className="hidden"
              />
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => fileInput.current.click()}
                  disabled={saving || savedWithoutReceipt}
                  className="inline-flex items-center gap-2 rounded-[8px] border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-[11px] font-bold disabled:opacity-50"
                >
                  <Paperclip size={14} />
                  {receipts.length ? 'Attach another file' : 'Attach file'}
                </button>

                <TakePhoto
                  onPhoto={(photo) => setReceipts((current) => [...current, photo])}
                  disabled={saving || savedWithoutReceipt}
                  className="inline-flex items-center gap-2 rounded-[8px] border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-[11px] font-bold disabled:opacity-50"
                />
              </div>
              <p className="mt-2 text-[10px] text-[var(--ink-faint)]">
                A photo (JPG, PNG, WEBP) or a PDF, up to 5 MB each.
              </p>
            </div>
          )}

          <p className="mt-[14px] text-[11px] leading-[1.5] text-[var(--ink-faint)]">
            {expense
              ? 'The change is recorded in the audit log. The property cannot be changed; void the expense and add it again under the right property.'
              : 'This is added to the selected property\u2019s ledger immediately and reduces its net profit figure in Reports. Choose a house when the cost was for one unit only.'}
          </p>

          {error ? (
            <div className="mt-[14px]">
              <FormError error={error} />
            </div>
          ) : null}
        </ModalBody>

        <ModalFooter>
          <button type="button" onClick={onClose} className={secondaryButtonClass}>
            {savedWithoutReceipt ? 'Close' : 'Cancel'}
          </button>
          {savedWithoutReceipt ? null : (
            <button type="submit" disabled={saving} className={primaryButtonClass}>
              {saving ? 'Saving...' : expense ? 'Save changes' : 'Add expense'}
            </button>
          )}
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
          <div className="mb-[18px] rounded-[8px] border border-[var(--line)] bg-[var(--surface)] px-4 py-4">
            <h3 className="text-[14px] font-bold text-[var(--danger)]">
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
            className="rounded-[8px] border border-[var(--danger-solid)] bg-[var(--danger-solid)] px-5 py-[10px] text-[12px] font-bold text-white disabled:opacity-50"
          >
            {saving ? 'Voiding...' : 'Void expense'}
          </button>
        </ModalFooter>
      </form>
    </ModalShell>
  )
}

export default ExpensesPage
