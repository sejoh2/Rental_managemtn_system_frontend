import { Check, Gift, Sparkles } from 'lucide-react'
import { dayLabel, ksh } from './billingLabels'

/*
  Kodi's pricing cards: one package, paid for a month, 3 months,
  6 months or a year, and (on the home page) the free trial before
  them. Used on the home page, in Settings, Billing and in the admin's
  preview. Prices come from the server, offers included; the "most
  popular" card is the dark one.

  cards      - [{ months, name, tagline, features, most_popular, full_price,
                  regular_price, price, per_month, saving, offer, enabled }]
  action     - (card, { dark }) => the button(s) under the card
  current    - months of the landlord's current plan, to mark it
  selected   - months of the card picked on the home page, to mark it
  showHidden - the admin's preview: cards that are off are shown greyed out
  compact    - a shorter card: brief features in small type
  trial      - { ends_on, grace_days, action }: a free trial card first
*/
function PricingCards({ cards, action, current = null, selected = null, showHidden = false, compact = false, trial = null }) {
  if (!cards?.length && !trial) return null

  const count = (cards?.length || 0) + (trial ? 1 : 0)
  const columns = count >= 5 ? 'lg:grid-cols-5' : count === 4 ? 'xl:grid-cols-4' : count === 3 ? 'lg:grid-cols-3' : ''

  return (
    <div className={`grid gap-4 sm:grid-cols-2 ${columns}`}>
      {trial ? <TrialCard trial={trial} compact={compact} /> : null}
      {(cards || []).map((card) => (
        <PricingCard
          key={card.months}
          card={card}
          action={action}
          compact={compact}
          current={current === card.months}
          chosen={selected === card.months}
          hidden={showHidden && card.enabled === false}
        />
      ))}
    </div>
  )
}

function Badge({ tone, children }) {
  const tones = {
    accent: 'bg-[var(--accent)] text-white',
    success: 'bg-[var(--success-soft)] text-[var(--success)]',
    soft: 'bg-[var(--accent-soft)] text-[var(--accent-ink)]',
  }

  return <span className={`rounded-full px-[9px] py-[3px] text-[9px] font-bold uppercase tracking-[0.05em] ${tones[tone]}`}>{children}</span>
}

function PricingCard({ card, action, compact, current, chosen, hidden }) {
  const dark = card.most_popular && !hidden
  const soft = dark ? 'text-[var(--brand-panel-soft)]' : 'text-[var(--ink-soft)]'
  const months = card.months === 1 ? null : `${card.months} months`

  return (
    <article
      className={`relative flex flex-col rounded-[14px] border ${compact ? 'p-4' : 'p-5'} ${
        dark
          ? 'border-[var(--accent)] bg-[var(--brand-panel)] text-white shadow-[0_16px_40px_rgba(28,23,18,0.28)]'
          : 'border-[var(--line)] bg-[var(--surface)] text-[var(--ink)]'
      } ${current || chosen ? 'ring-2 ring-[var(--accent)] ring-offset-2 ring-offset-[var(--bg)]' : ''} ${hidden ? 'border-dashed opacity-60' : ''}`}
    >
      {hidden ? (
        <div className="mb-3 rounded-[6px] bg-[var(--line-soft)] px-2 py-[5px] text-center text-[10px] font-bold uppercase tracking-[0.05em] text-[var(--ink-soft)]">
          Hidden: landlords don&apos;t see this
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        {compact ? null : (
          <span className={`flex h-8 w-8 items-center justify-center rounded-[8px] ${dark ? 'bg-[var(--accent)] text-white' : 'bg-[var(--accent-soft)] text-[var(--accent-ink)]'}`}>
            <Sparkles size={15} />
          </span>
        )}
        <h3 className="font-display text-[16px] font-semibold">{card.name}</h3>
        {card.most_popular ? <Badge tone="accent">Most popular</Badge> : null}
        {current ? <Badge tone="success">Your plan</Badge> : null}
        {chosen && !current ? <Badge tone="soft">Your choice</Badge> : null}
      </div>
      {card.tagline ? <p className={`mt-1 text-[11.5px] leading-[1.45] ${soft} ${compact ? '' : 'min-h-[34px]'}`}>{card.tagline}</p> : null}

      <div className={`border-t border-dashed ${compact ? 'my-3' : 'my-4'} ${dark ? 'border-white/15' : 'border-[var(--line)]'}`} />

      {card.offer ? (
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-[var(--success)] px-[9px] py-[3px] text-[10px] font-bold text-white">
            {card.offer.label || 'Offer'} · {card.offer.percent}% off
          </span>
          {card.offer.ends_on ? <span className={`text-[10px] ${soft}`}>until {dayLabel(card.offer.ends_on)}</span> : null}
        </div>
      ) : null}

      <div className="flex flex-wrap items-baseline gap-x-2">
        <span className={`font-display font-bold leading-none tracking-[-0.02em] ${compact ? 'text-[26px]' : 'text-[30px]'}`}>{ksh(card.price)}</span>
        <span className={`text-[12px] ${soft}`}>{months ? `for ${months}` : '/month'}</span>
      </div>
      <div className={`mt-2 min-h-[16px] text-[11px] ${soft}`}>
        {card.offer ? <span className="mr-2 line-through">{ksh(card.regular_price)}</span> : null}
        {months ? `${ksh(card.per_month)} a month` : null}
        {card.saving > 0 ? <span className="ml-2 font-bold text-[var(--success)]">Save {ksh(card.saving)}</span> : null}
      </div>

      <ul className={`grid flex-1 content-start ${compact ? 'mt-3 gap-[5px] text-[11px]' : 'mt-4 gap-[9px] text-[12px]'}`}>
        {(card.features || []).map((feature) => (
          <li key={feature} className="flex gap-[6px]">
            <Check size={compact ? 13 : 15} className={`mt-[1px] shrink-0 ${dark ? 'text-[var(--accent-muted)]' : 'text-[var(--accent-ink)]'}`} />
            <span className={dark ? 'text-white/90' : compact ? 'text-[var(--ink-soft)]' : ''}>{feature}</span>
          </li>
        ))}
      </ul>

      {action ? <div className={compact ? 'mt-4' : 'mt-5'}>{action(card, { dark })}</div> : null}
    </article>
  )
}

// The free trial, first on the home page: what it is and what happens after it.
function TrialCard({ trial, compact }) {
  const rules = [
    `Free until ${dayLabel(trial.ends_on)} if you start today`,
    'Everything included, no payment to start',
    'Reminders 7, 3 and 1 day before it ends',
    `Then ${trial.grace_days} days to pay before the account is read-only`,
  ]

  return (
    <article className={`flex flex-col rounded-[14px] border border-[var(--success)] bg-[var(--success-soft)] text-[var(--ink)] ${compact ? 'p-4' : 'p-5'}`}>
      <div className="flex flex-wrap items-center gap-2">
        {compact ? null : (
          <span className="flex h-8 w-8 items-center justify-center rounded-[8px] bg-[var(--success)] text-white">
            <Gift size={15} />
          </span>
        )}
        <h3 className="font-display text-[16px] font-semibold">Free trial</h3>
        <Badge tone="success">Start here</Badge>
      </div>
      <p className="mt-1 text-[11.5px] leading-[1.45] text-[var(--ink-soft)]">Until the end of your next full calendar month.</p>

      <div className={`border-t border-dashed border-[var(--success)]/30 ${compact ? 'my-3' : 'my-4'}`} />

      <div className="flex items-baseline gap-2">
        <span className={`font-display font-bold leading-none tracking-[-0.02em] ${compact ? 'text-[26px]' : 'text-[30px]'}`}>{ksh(0)}</span>
        <span className="text-[12px] text-[var(--ink-soft)]">to start</span>
      </div>

      <ul className="mt-3 grid flex-1 content-start gap-[6px] text-[11px] text-[var(--ink-soft)]">
        {rules.map((rule) => (
          <li key={rule} className="flex gap-[6px]">
            <Check size={13} className="mt-[1px] shrink-0 text-[var(--success)]" />
            <span>{rule}</span>
          </li>
        ))}
      </ul>

      {trial.action ? <div className={compact ? 'mt-4' : 'mt-5'}>{trial.action}</div> : null}
    </article>
  )
}

export default PricingCards
