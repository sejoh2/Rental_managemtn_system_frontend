import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Search } from 'lucide-react'
import { getAdminBilling, updateBillingSettings, updatePlan } from '../../api/billing'
import { STATE_LABELS, dayLabel, ksh } from '../../components/billing/billingLabels'
import { DataState, EmptyState, FormError } from '../../components/common/DataState'
import { Field, ModalBody, ModalFooter, ModalShell, primaryButtonClass, secondaryButtonClass } from '../../components/common/Modal'
import PricingCards from '../../components/billing/PricingCards'
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
                      {data.settings.price_from_env ? (
                        <div className="mt-1 text-[10px] text-[var(--ink-faint)]">Set in the server&apos;s .env (KODI_MONTHLY_PRICE)</div>
                      ) : null}
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
                    <span className="font-display text-[14px] font-semibold">Pricing cards</span>
                    <span className="text-[10px] text-[var(--ink-faint)]">Shown on the home page and in landlords&apos; Billing tab</span>
                  </div>
                  <div className="grid gap-2 px-[18px] py-4 text-[12px]">
                    {data.plans.map((plan) => (
                      <div key={plan.months} className="flex flex-wrap items-center gap-2">
                        <span className="w-[80px] font-bold">{plan.name}</span>
                        <span>
                          {ksh(plan.price)}
                          {plan.offer ? <span className="ml-1 text-[var(--ink-faint)] line-through">{ksh(plan.regular_price)}</span> : null}
                          <span className="ml-1 text-[var(--ink-faint)]">
                            {plan.discount_percent ? `(${plan.discount_percent}% off)` : ''}
                            {plan.offer ? ` · ${plan.offer.label || 'Offer'} ${plan.offer.percent}%` : ''}
                          </span>
                        </span>
                        {plan.most_popular ? <StatusBadge tone="info">Most popular</StatusBadge> : null}
                        <StatusBadge tone={plan.enabled ? 'success' : 'neutral'}>{plan.enabled ? 'Shown' : 'Hidden'}</StatusBadge>
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
                  <span className="font-display text-[14px] font-semibold">Preview: what landlords see</span>
                  <span className="text-[10px] text-[var(--ink-faint)]">
                    Today&apos;s prices and offers. Greyed-out cards are hidden; open one and tick &quot;Show this card&quot; to show it.
                  </span>
                </div>
                <div className="px-[18px] py-4">
                  {!data.plans.some((plan) => plan.enabled) ? (
                    <p className="mb-3 text-[12px] font-bold text-[var(--warning)]">No card is shown: landlords and the home page see no prices.</p>
                  ) : null}
                  {data.plans.length ? (
                    <PricingCards
                      cards={data.plans}
                      showHidden
                      action={(card, { dark }) => (
                        <button
                          type="button"
                          onClick={() => setEditing({ kind: 'plan', plan: card })}
                          className={`w-full rounded-[8px] px-4 py-[10px] text-[12px] font-bold ${
                            dark ? 'bg-[var(--accent)] text-white' : 'border border-[var(--line)] text-[var(--ink)] hover:bg-[var(--line-soft)]'
                          }`}
                        >
                          {card.enabled ? 'Change this card' : 'Change or show this card'}
                        </button>
                      )}
                    />
                  ) : null}
                </div>
              </section>

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
                                {account.days_overdue ? <div className="mt-1 text-[10px] text-[var(--ink-faint)]">{account.days_overdue} {account.days_overdue === 1 ? 'day' : 'days'} unpaid</div> : null}
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
  const fixedPrice = settings.price_from_env
  const [grace, setGrace] = useState(String(settings.grace_days))
  const [reason, setReason] = useState('')
  const { busy, error, save } = useSave(onDone, onClose)

  return (
    <ModalShell title="Price and grace days" onClose={onClose}>
      <ModalBody>
        <div className="grid gap-4">
          <Field
            label="Monthly price (KSh)"
            value={price}
            disabled={fixedPrice}
            onChange={(event) => setPrice(event.target.value.replace(/\D/g, ''))}
            inputMode="numeric"
            hint={
              fixedPrice
                ? "Set in the server's .env (KODI_MONTHLY_PRICE): change it there and restart the server. It applies from then on; bills already made keep their amount."
                : "The price of one month: every card's price is worked out from it. Bills already made keep their amount."
            }
          />
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
          onClick={() =>
            save(() =>
              updateBillingSettings({ ...(fixedPrice ? {} : { monthly_price: Number(price) }), grace_days: Number(grace), reason })
            )
          }
          className={primaryButtonClass}
        >
          {busy ? 'Saving...' : 'Save'}
        </button>
      </ModalFooter>
    </ModalShell>
  )
}

function PlanModal({ plan, onClose, onDone }) {
  const [name, setName] = useState(plan.name || '')
  const [tagline, setTagline] = useState(plan.tagline || '')
  const [features, setFeatures] = useState((plan.features || []).join('\n'))
  const [percent, setPercent] = useState(String(plan.discount_percent || 0))
  const [enabled, setEnabled] = useState(plan.enabled)
  const [popular, setPopular] = useState(plan.most_popular)
  const [offerOn, setOfferOn] = useState(Boolean(plan.offer_percent))
  const [offerPercent, setOfferPercent] = useState(plan.offer_percent ? String(plan.offer_percent) : '')
  const [offerLabel, setOfferLabel] = useState(plan.offer_label || '')
  const [offerEnds, setOfferEnds] = useState(plan.offer_ends_on || '')
  const [reason, setReason] = useState('')
  const { busy, error, save } = useSave(onDone, onClose)
  const lines = features.split('\n').map((line) => line.trim()).filter(Boolean)

  function submit() {
    return save(() =>
      updatePlan(plan.months, {
        name: name.trim(),
        tagline: tagline.trim() || null,
        features: lines,
        discount_percent: Number(percent) || 0,
        enabled,
        most_popular: popular,
        offer_percent: offerOn ? Number(offerPercent) : null,
        offer_label: offerOn ? offerLabel.trim() || null : null,
        offer_ends_on: offerOn ? offerEnds || null : null,
        reason: reason || undefined,
      })
    )
  }

  return (
    <ModalShell title={`Pricing card: ${plan.name}`} onClose={onClose}>
      <ModalBody>
        <div className="grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Name" value={name} onChange={(event) => setName(event.target.value)} maxLength={40} />
            {plan.months === 1 ? (
              <Field label="Length" value="1 month (the monthly bill)" disabled />
            ) : (
              <Field
                label="Discount for paying ahead (%)"
                value={percent}
                onChange={(event) => setPercent(event.target.value.replace(/[^\d.]/g, ''))}
                inputMode="decimal"
                hint="12 months for the price of 10 is 16.67%. Rounded to the nearest 10 shillings."
              />
            )}
          </div>
          <Field label="Short line under the name" value={tagline} onChange={(event) => setTagline(event.target.value)} maxLength={160} />
          <div>
            <label className="mb-2 block text-[11px] font-bold">What it includes (one per line, up to 12)</label>
            <textarea
              value={features}
              onChange={(event) => setFeatures(event.target.value)}
              rows={7}
              className="w-full rounded-[8px] border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-[12px] outline-none focus:border-[var(--accent)]"
            />
          </div>
          <div className="grid gap-2 text-[12px]">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={enabled} onChange={(event) => setEnabled(event.target.checked)} />
              Show this card (home page and landlords&apos; Billing tab)
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={popular} onChange={(event) => setPopular(event.target.checked)} />
              Mark as most popular (only one card at a time)
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={offerOn} onChange={(event) => setOfferOn(event.target.checked)} />
              Public offer (the regular price is shown struck through)
            </label>
          </div>
          {offerOn ? (
            <div className="grid gap-4 rounded-[8px] border border-[var(--line)] p-3 sm:grid-cols-3">
              <Field label="Offer (% off the full price)" value={offerPercent} onChange={(event) => setOfferPercent(event.target.value.replace(/[^\d.]/g, ''))} inputMode="decimal" />
              <Field label="Offer name" value={offerLabel} onChange={(event) => setOfferLabel(event.target.value)} maxLength={60} placeholder="Launch offer" />
              <Field label="Ends on (optional)" type="date" value={offerEnds} onChange={(event) => setOfferEnds(event.target.value)} />
            </div>
          ) : null}
          {plan.months === 1 ? (
            <p className="text-[11px] text-[var(--ink-soft)]">
              The monthly card&apos;s offer also applies to monthly bills made while it runs. A landlord&apos;s own discount is used instead when it is better
              for them (never both).
            </p>
          ) : null}
          <Field label="Reason (recorded)" value={reason} onChange={(event) => setReason(event.target.value)} maxLength={500} />
          {error ? <FormError error={error} /> : null}
        </div>
      </ModalBody>
      <ModalFooter>
        <button type="button" onClick={onClose} className={secondaryButtonClass}>Cancel</button>
        <button
          type="button"
          disabled={busy || !name.trim() || (offerOn && !(Number(offerPercent) > 0)) || lines.length > 12}
          onClick={submit}
          className={primaryButtonClass}
        >
          {busy ? 'Saving...' : 'Save'}
        </button>
      </ModalFooter>
    </ModalShell>
  )
}

export default AdminBillingPage
