import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Search } from 'lucide-react'
import { getAdminBilling, updateBillingSettings, updatePlan } from '../../api/billing'
import { STATE_LABELS, dayLabel, ksh } from '../../components/billing/billingLabels'
import { DataState, EmptyState, FormError } from '../../components/common/DataState'
import { Field, ModalBody, ModalFooter, ModalShell, primaryButtonClass, secondaryButtonClass } from '../../components/common/Modal'
import StatusBadge from '../../components/common/StatusBadge'
import { useApi } from '../../hooks/useApi'
import { formatPhone } from '../../utils/format'

const cardClass = 'overflow-hidden rounded-[10px] border border-[var(--line)] bg-[var(--surface)]'
const cardHeaderClass = 'flex flex-wrap items-center justify-between gap-3 border-b border-[var(--line)] px-[18px] py-4'
const headRowClass = 'bg-[var(--bg)] text-left text-[9px] uppercase tracking-[0.05em] text-[var(--ink-faint)]'
const STATE_ORDER = { read_only: 0, grace: 1, trial: 2, active: 3 }

// Kodi's own billing: every landlord, the price, grace days and prepaid plans.
function AdminBillingPage() {
  const [version, setVersion] = useState(0)
  const state = useApi(`admin-billing-${version}`, getAdminBilling)
  const reload = () => setVersion((current) => current + 1)
  const [search, setSearch] = useState('')
  const [editing, setEditing] = useState(null)

  return (
    <>
      <div className="mb-7">
        <div className="mb-[10px] text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--accent-ink)]">Administration</div>
        <h1 className="font-display text-[20px] font-semibold tracking-[-0.01em]">Billing</h1>
        <p className="mt-2 max-w-[680px] text-[12px] leading-[1.5] text-[var(--ink-soft)]">
          What landlords pay Kodi. Open a landlord to extend a trial, give free months or a discount, change one bill, record a payment
          made outside M-Pesa, or send the M-Pesa prompt. Every change needs a reason and is recorded.
        </p>
      </div>

      <DataState state={state} loadingLabel="Loading billing...">
        {(data) => {
          const term = search.trim().toLowerCase()
          const accounts = data.accounts
            .filter((account) => !term || `${account.first_name} ${account.last_name} ${account.phone}`.toLowerCase().includes(term))
            .sort((a, b) => STATE_ORDER[a.state] - STATE_ORDER[b.state] || a.first_name.localeCompare(b.first_name))
          const count = (name) => data.accounts.filter((account) => account.state === name).length

          return (
            <div className="grid gap-4">
              {!data.mpesa.configured ? (
                <div className="rounded-[10px] bg-[var(--warning-soft)] px-4 py-3 text-[12px] font-bold text-[var(--warning)]">
                  M-Pesa to Kodi&apos;s till is not set up on the server (KODI_MPESA_ settings), so landlords cannot pay by M-Pesa yet. You can
                  still record payments by hand.
                </div>
              ) : data.mpesa.environment !== 'production' ? (
                <div className="rounded-[10px] bg-[var(--info-soft)] px-4 py-3 text-[12px] font-bold text-[var(--info)]">
                  M-Pesa is in sandbox (test) mode: no real money moves.
                </div>
              ) : null}

              <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
                <section className={cardClass}>
                  <div className={cardHeaderClass}>
                    <span className="font-display text-[14px] font-semibold">Price</span>
                    <button type="button" onClick={() => setEditing({ kind: 'settings' })} className="text-[11px] font-bold text-[var(--accent-ink)] hover:underline">
                      Change
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-3 px-[18px] py-4 text-[12px]">
                    <div>
                      <div className="text-[10px] font-bold uppercase text-[var(--ink-faint)]">Monthly price</div>
                      <div className="mt-1 text-[16px] font-semibold">{ksh(data.settings.monthly_price)}</div>
                    </div>
                    <div>
                      <div className="text-[10px] font-bold uppercase text-[var(--ink-faint)]">Grace days</div>
                      <div className="mt-1 text-[16px] font-semibold">{data.settings.grace_days}</div>
                    </div>
                    <p className="col-span-2 text-[11px] text-[var(--ink-faint)]">
                      {count('trial')} on trial, {count('active')} paid, {count('grace')} payment due, {count('read_only')} read-only.
                    </p>
                  </div>
                </section>

                <section className={cardClass}>
                  <div className={cardHeaderClass}>
                    <span className="font-display text-[14px] font-semibold">Pay ahead plans</span>
                  </div>
                  <div className="grid gap-2 px-[18px] py-4 text-[12px]">
                    {data.plans.map((plan) => (
                      <div key={plan.months} className="flex flex-wrap items-center gap-2">
                        <span className="w-[80px] font-bold">{plan.months} months</span>
                        <span>
                          {ksh(plan.price)} <span className="text-[var(--ink-faint)]">({plan.discount_percent}% off)</span>
                        </span>
                        <StatusBadge tone={plan.enabled ? 'success' : 'neutral'}>{plan.enabled ? 'On' : 'Off'}</StatusBadge>
                        <button type="button" onClick={() => setEditing({ kind: 'plan', plan })} className="ml-auto text-[11px] font-bold text-[var(--accent-ink)] hover:underline">
                          Change
                        </button>
                      </div>
                    ))}
                  </div>
                </section>
              </div>

              <section className={cardClass}>
                <div className={cardHeaderClass}>
                  <span className="font-display text-[14px] font-semibold">Landlords</span>
                  <label className="relative w-full max-w-[260px]">
                    <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ink-faint)]" />
                    <input
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      placeholder="Search name or phone"
                      className="h-9 w-full rounded-[8px] border border-[var(--line)] bg-[var(--surface)] pl-8 pr-3 text-[12px] outline-none focus:border-[var(--accent)]"
                    />
                  </label>
                </div>
                {accounts.length ? (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[720px] text-[12px]">
                      <thead className={headRowClass}>
                        <tr>
                          <th className="px-[18px] py-2">Landlord</th>
                          <th className="px-3 py-2">State</th>
                          <th className="px-3 py-2">Covered until</th>
                          <th className="px-3 py-2">Owing</th>
                          <th className="px-3 py-2">Discount</th>
                          <th className="px-[18px] py-2" />
                        </tr>
                      </thead>
                      <tbody>
                        {accounts.map((account) => {
                          const [label, tone] = STATE_LABELS[account.state] || [account.state, 'neutral']

                          return (
                            <tr key={account.owner_id} className="border-t border-[var(--line)]">
                              <td className="px-[18px] py-3">
                                <div className="font-semibold">{`${account.first_name} ${account.last_name}`.trim()}</div>
                                <div className="text-[10px] text-[var(--ink-faint)]">{formatPhone(account.phone)}</div>
                              </td>
                              <td className="px-3 py-3">
                                <StatusBadge tone={tone}>{label}</StatusBadge>
                                {account.days_overdue ? <div className="mt-1 text-[10px] text-[var(--ink-faint)]">{account.days_overdue} days unpaid</div> : null}
                              </td>
                              <td className="px-3 py-3">{dayLabel(account.covered_until)}</td>
                              <td className="px-3 py-3 font-semibold">{account.open_amount ? ksh(account.open_amount) : '-'}</td>
                              <td className="px-3 py-3">{account.discount_kind ? (account.discount_kind === 'percent' ? `${account.discount_value}%` : ksh(account.discount_value)) : '-'}</td>
                              <td className="px-[18px] py-3 text-right">
                                <Link to={`/admin/billing/${account.owner_id}`} className="text-[11px] font-bold text-[var(--accent-ink)] hover:underline">
                                  Open
                                </Link>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <EmptyState title="No landlords" message="Owners appear here as soon as they are created." />
                )}
              </section>

              {editing?.kind === 'settings' ? <SettingsModal settings={data.settings} onClose={() => setEditing(null)} onDone={reload} /> : null}
              {editing?.kind === 'plan' ? <PlanModal plan={editing.plan} onClose={() => setEditing(null)} onDone={reload} /> : null}
            </div>
          )
        }}
      </DataState>
    </>
  )
}

function useSave(onDone, onClose) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  async function save(work) {
    setBusy(true)
    setError(null)

    try {
      await work()
      onDone()
      onClose()
    } catch (saveError) {
      setError(saveError)
    } finally {
      setBusy(false)
    }
  }

  return { busy, error, save }
}

function SettingsModal({ settings, onClose, onDone }) {
  const [price, setPrice] = useState(String(settings.monthly_price))
  const [grace, setGrace] = useState(String(settings.grace_days))
  const [reason, setReason] = useState('')
  const { busy, error, save } = useSave(onDone, onClose)

  return (
    <ModalShell title="Price and grace days" onClose={onClose}>
      <ModalBody>
        <div className="grid gap-4">
          <Field label="Monthly price (KSh)" value={price} onChange={(event) => setPrice(event.target.value.replace(/\D/g, ''))} inputMode="numeric" hint="Applies to bills made from now on; bills already made keep their amount." />
          <Field label="Grace days" value={grace} onChange={(event) => setGrace(event.target.value.replace(/\D/g, ''))} inputMode="numeric" hint="Days after a bill is due before the account becomes read-only (0 to 30)." />
          <Field label="Reason" value={reason} onChange={(event) => setReason(event.target.value)} maxLength={500} />
          {error ? <FormError error={error} /> : null}
        </div>
      </ModalBody>
      <ModalFooter>
        <button type="button" onClick={onClose} className={secondaryButtonClass}>Cancel</button>
        <button
          type="button"
          disabled={busy || !price || grace === ''}
          onClick={() => save(() => updateBillingSettings({ monthly_price: Number(price), grace_days: Number(grace), reason }))}
          className={primaryButtonClass}
        >
          {busy ? 'Saving...' : 'Save'}
        </button>
      </ModalFooter>
    </ModalShell>
  )
}

function PlanModal({ plan, onClose, onDone }) {
  const [percent, setPercent] = useState(String(plan.discount_percent))
  const [enabled, setEnabled] = useState(plan.enabled)
  const [reason, setReason] = useState('')
  const { busy, error, save } = useSave(onDone, onClose)

  return (
    <ModalShell title={`${plan.months} months, paid ahead`} onClose={onClose}>
      <ModalBody>
        <div className="grid gap-4">
          <Field label="Discount (%)" value={percent} onChange={(event) => setPercent(event.target.value.replace(/[^\d.]/g, ''))} inputMode="decimal" hint="12 months for the price of 10 is 16.67%. Prices are rounded to the nearest 10 shillings." />
          <label className="flex items-center gap-2 text-[12px]">
            <input type="checkbox" checked={enabled} onChange={(event) => setEnabled(event.target.checked)} />
            Landlords can choose this plan
          </label>
          <Field label="Reason" value={reason} onChange={(event) => setReason(event.target.value)} maxLength={500} />
          {error ? <FormError error={error} /> : null}
        </div>
      </ModalBody>
      <ModalFooter>
        <button type="button" onClick={onClose} className={secondaryButtonClass}>Cancel</button>
        <button
          type="button"
          disabled={busy || percent === ''}
          onClick={() => save(() => updatePlan(plan.months, { discount_percent: Number(percent), enabled, reason: reason || undefined }))}
          className={primaryButtonClass}
        >
          {busy ? 'Saving...' : 'Save'}
        </button>
      </ModalFooter>
    </ModalShell>
  )
}

export default AdminBillingPage
