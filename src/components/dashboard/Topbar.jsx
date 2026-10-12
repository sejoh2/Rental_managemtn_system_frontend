import { useRef, useState } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { Bell, Menu, Plus, Search } from 'lucide-react'
import { getAttention, searchEverything } from '../../api/dashboard'
import { useProperties } from '../../context/PropertiesContext'
import ThemeToggle from '../common/ThemeToggle'
import { useApi } from '../../hooks/useApi'
import { formatDate, formatKES, formatPhone } from '../../utils/format'
import { isCurrentTenant } from '../../utils/tenantStatus'

const panelClass =
  'absolute z-40 mt-2 overflow-hidden rounded-[8px] border border-[var(--line)] bg-[var(--surface)] shadow-[0_10px_24px_rgba(32,28,24,0.12)]'

const groupLabelClass =
  'px-3 pb-1 pt-3 text-[9px] font-bold uppercase tracking-[0.05em] text-[var(--ink-faint)]'

const resultClass = 'block w-full px-3 py-2 text-left text-[12px] hover:bg-[var(--line-soft)]'

function Topbar({ title, subtitle, onOpenSidebar, onAddTenant }) {
  const onDashboard = useLocation().pathname.startsWith('/dashboard')

  return (
    <header className="sticky top-[34px] z-30 flex h-[64px] items-center gap-4 border-b border-[var(--line)] bg-[var(--surface)] px-4 sm:px-6">
      <button
        type="button"
        onClick={onOpenSidebar}
        className="flex h-9 w-9 items-center justify-center rounded-[8px] border border-[var(--line)] text-[var(--ink-soft)] lg:hidden"
      >
        <Menu size={18} />
      </button>

      <div className="hidden min-w-[210px] lg:block">
        <h2 className="font-display text-[16px] font-semibold">{title}</h2>
        <p className="mt-[1px] text-[12px] text-[var(--ink-faint)]">{subtitle}</p>
      </div>

      <TopbarSearch />

      {/* Only the Dashboard is filtered from here; other pages have their own property filter. */}
      {onDashboard ? <DashboardPropertySelect /> : null}

      <div className="ml-auto flex items-center gap-[10px]">
        <ThemeToggle />
        <AttentionBell />

        <button
          onClick={onAddTenant}
          className="hidden items-center gap-2 rounded-[8px] border border-[var(--accent)] bg-[var(--accent)] px-4 py-[10px] text-[12px] font-bold text-white sm:inline-flex"
        >
          <Plus size={15} />
          Add tenant
        </button>
      </div>
    </header>
  )
}

// Finds tenants by name, phone, ID or house, and payments by M-Pesa code or reference.
function TopbarSearch() {
  const navigate = useNavigate()
  const [text, setText] = useState('')
  // What is actually searched: the text once typing has paused.
  const [term, setTerm] = useState('')
  const [open, setOpen] = useState(false)
  const timer = useRef(null)

  const resultsState = useApi(term.length >= 2 ? `search-${term}` : null, () =>
    searchEverything(term)
  )
  const results = resultsState.data
  const nothing = results && !results.tenants.length && !results.payments.length

  function handleChange(event) {
    const value = event.target.value

    setText(value)
    setOpen(true)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setTerm(value.trim()), 300)
  }

  function go(path) {
    setOpen(false)
    setText('')
    setTerm('')
    navigate(path)
  }

  return (
    <div className="relative hidden max-w-[360px] flex-1 md:block">
      <div className="flex items-center gap-2 rounded-[8px] border border-[var(--line)] bg-[var(--bg)] px-3 py-2 text-[12px] text-[var(--ink-faint)] focus-within:border-[var(--accent)]">
        <Search size={15} />
        <input
          type="text"
          value={text}
          onChange={handleChange}
          onFocus={() => setOpen(true)}
          // Lets a click on a result register before the list closes.
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          onKeyDown={(event) => {
            if (event.key === 'Escape') setOpen(false)
          }}
          placeholder="Search tenants, houses, receipts..."
          aria-label="Search"
          className="w-full bg-transparent text-[var(--ink)] outline-none placeholder:text-[var(--ink-faint)]"
        />
      </div>

      {open && text.trim().length >= 2 ? (
        <div className={`${panelClass} left-0 right-0 max-h-[340px] overflow-y-auto pb-1`}>
          {resultsState.error ? (
            <div className="px-3 py-3 text-[11px] text-[var(--danger)]">{resultsState.error.message}</div>
          ) : !results ? (
            <div className="px-3 py-3 text-[11px] text-[var(--ink-faint)]">Searching...</div>
          ) : nothing ? (
            <div className="px-3 py-3 text-[11px] text-[var(--ink-faint)]">
              Nothing matches &quot;{term}&quot;.
            </div>
          ) : (
            <>
              {results.tenants.length ? <div className={groupLabelClass}>Tenants</div> : null}
              {results.tenants.map((tenant) => (
                <button
                  key={tenant.id}
                  type="button"
                  onMouseDown={(event) => {
                    event.preventDefault()
                    go(`/tenants/${tenant.id}`)
                  }}
                  className={resultClass}
                >
                  <span className="font-bold">{tenant.full_name}</span>
                  {isCurrentTenant(tenant) ? '' : ' (former tenant)'}
                  <span className="block text-[10px] text-[var(--ink-faint)]">
                    {tenant.property_name} · House {tenant.unit_number} · {formatPhone(tenant.phone)}
                  </span>
                </button>
              ))}

              {results.payments.length ? <div className={groupLabelClass}>Payments</div> : null}
              {results.payments.map((payment) => (
                <button
                  key={payment.id}
                  type="button"
                  onMouseDown={(event) => {
                    event.preventDefault()
                    go('/payments')
                  }}
                  className={resultClass}
                >
                  <span className="font-mono font-bold">{payment.reference}</span> ·{' '}
                  {formatKES(payment.amount)}
                  <span className="block text-[10px] text-[var(--ink-faint)]">
                    {payment.tenant_name || 'Unmatched'} · {formatDate(payment.received_at)}
                  </span>
                </button>
              ))}
            </>
          )}
        </div>
      ) : null}
    </div>
  )
}

// Switches the Dashboard between all properties and one; kept in the URL as ?property=1.
function DashboardPropertySelect() {
  const properties = useProperties().data || []
  const [searchParams, setSearchParams] = useSearchParams()

  return (
    <select
      value={searchParams.get('property') || ''}
      onChange={(event) => setSearchParams(event.target.value ? { property: event.target.value } : {})}
      aria-label="Property"
      className="hidden rounded-[8px] border border-[var(--line)] bg-[var(--bg)] px-3 py-2 text-[12px] font-bold md:block"
    >
      <option value="">
        {properties.length
          ? `All ${properties.length} ${properties.length === 1 ? 'property' : 'properties'}`
          : 'All properties'}
      </option>
      {properties.map((property) => (
        <option key={property.id} value={property.id}>{property.name}</option>
      ))}
    </select>
  )
}

// Lists what is waiting for the owner; the dot shows only when there is something.
function AttentionBell() {
  const attentionState = useApi('attention', getAttention)
  const [open, setOpen] = useState(false)
  const attention = attentionState.data

  const items = attention
    ? [
        [attention.unmatched_payments, 'unmatched payment', '/payments'],
        [attention.flagged_readings, 'flagged water reading', '/water-billing'],
        [attention.failed_sms, 'failed SMS', '/sms-centre?status=failed', 'failed SMS'],
        [attention.open_maintenance, 'open maintenance request', '/maintenance'],
      ].filter(([count]) => count > 0)
    : []

  function toggle() {
    // Counts are looked up again each time the list is opened.
    if (!open) attentionState.reload()

    setOpen(!open)
  }

  return (
    <div className="relative">
      <button
        onClick={toggle}
        aria-label="Needs attention"
        className="relative flex h-9 w-9 items-center justify-center rounded-[8px] border border-[var(--line)] bg-[var(--surface)] text-[var(--ink-soft)]"
      >
        <Bell size={17} />
        {attention?.total ? (
          <span className="absolute right-[7px] top-[7px] h-[7px] w-[7px] rounded-full bg-[var(--accent)]" />
        ) : null}
      </button>

      {open ? (
        <>
          {/* Clicking anywhere else closes the list. */}
          <button
            type="button"
            aria-label="Close"
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-30 cursor-default"
          />

          <div className={`${panelClass} right-0 w-[260px]`}>
            <div className="border-b border-[var(--line)] px-3 py-3 text-[12px] font-bold">
              Needs your attention
            </div>

            {items.length ? (
              items.map(([count, label, path, plural]) => (
                <Link
                  key={path}
                  to={path}
                  onClick={() => setOpen(false)}
                  className="flex items-center justify-between gap-3 border-b border-[var(--line-soft)] px-3 py-[10px] text-[12px] last:border-b-0 hover:bg-[var(--line-soft)]"
                >
                  <span>
                    {count} {count === 1 ? label : plural || `${label}s`}
                  </span>
                  <span className="text-[11px] font-bold text-[var(--accent-ink)]">View</span>
                </Link>
              ))
            ) : (
              <div className="px-3 py-4 text-[11px] text-[var(--ink-faint)]">
                {attention ? 'Nothing needs your attention.' : 'Checking...'}
              </div>
            )}
          </div>
        </>
      ) : null}
    </div>
  )
}

export default Topbar
