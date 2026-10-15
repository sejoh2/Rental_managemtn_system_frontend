import { Link } from 'react-router-dom'
import { Download, Plus } from 'lucide-react'
import { getDashboardHome } from '../../api/dashboard'
import { DataState, EmptyState } from '../../components/common/DataState'
import StatusBadge from '../../components/common/StatusBadge'
import StatCard from '../../components/dashboard/StatCard'
import { useAuth } from '../../context/AuthContext'
import { useProperties } from '../../context/PropertiesContext'
import { useApi } from '../../hooks/useApi'
import {
  formatDateTime,
  formatKES,
  formatKESCompact,
  formatNumber,
  formatPercent,
  formatPhone,
} from '../../utils/format'
import { PAYMENT_METHODS } from '../../utils/payments'

const cardClass = 'overflow-hidden rounded-[10px] border border-[var(--line)] bg-[var(--surface)]'
const cardHeaderClass =
  'flex items-center justify-between border-b border-[var(--line)] px-[18px] py-4'

// [badge label, badge tone] for each kind of recent activity.
const activityKinds = {
  payment: ['Payment', 'success'],
  water_reading: ['Water reading', 'info'],
  maintenance: ['Maintenance', 'warning'],
  tenant_added: ['Tenant added', 'neutral'],
}

function greeting() {
  const hour = new Date().getHours()

  if (hour < 12) return 'Good morning'

  return hour < 17 ? 'Good afternoon' : 'Good evening'
}

function DashboardHomePage({ onAddProperty, onExportReport }) {
  const { user, actingOwner } = useAuth()
  // An admin inside an owner's account is shown the owner's name, not their own.
  const firstName = actingOwner ? actingOwner.name.split(' ')[0] : user.first_name
  // Chosen with the property dropdown in the top bar.
  const { data, selectedId: propertyId, selected: property } = useProperties()
  const properties = data || []

  const homeState = useApi(`dashboard-home-${propertyId || 'all'}`, () =>
    getDashboardHome(propertyId)
  )

  return (
    <>
      <div className="mb-7 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-[10px] text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--accent-ink)]">
            Overview
          </div>
          <h1 className="font-display text-[20px] font-semibold tracking-[-0.01em]">
            {greeting()}
            {firstName ? `, ${firstName}` : ''}
          </h1>
          <p className="mt-2 text-[12px] text-[var(--ink-soft)]">
            {property
              ? `Here’s how ${property.name} is performing this month.`
              : `Here’s how your ${properties.length === 1 ? 'property is' : `${properties.length || ''} properties are`} performing this month.`}
          </p>
        </div>

        <div className="flex flex-wrap gap-[10px]">
          <button
            onClick={onExportReport}
            className="inline-flex items-center gap-2 rounded-[8px] border border-[var(--line)] bg-[var(--surface)] px-4 py-[10px] text-[12px] font-bold"
          >
            <Download size={15} />
            Export report
          </button>
          <button
            onClick={onAddProperty}
            className="inline-flex items-center gap-2 rounded-[8px] border border-[var(--accent)] bg-[var(--accent)] px-4 py-[10px] text-[12px] font-bold text-white"
          >
            <Plus size={15} />
            Add property
          </button>
        </div>
      </div>

      <DataState state={homeState} loadingLabel="Loading your dashboard...">
        {(home) => <HomeFigures home={home} scope={property ? property.name : 'All properties'} />}
      </DataState>
    </>
  )
}

function HomeFigures({ home, scope }) {
  const { rent, occupancy, water } = home
  const unmatched = home.unmatched_payments
  const lastMonth = home.rent_by_month[4].label

  const rentStats = [
    {
      label: 'Rent collected',
      value: formatKES(rent.collected),
      note:
        rent.change_percent === null
          ? `nothing collected in ${lastMonth}`
          : `${rent.change_percent >= 0 ? '↑' : '↓'} ${formatPercent(Math.abs(rent.change_percent))} vs ${lastMonth}`,
      tone: rent.change_percent === null ? 'muted' : rent.change_percent >= 0 ? 'success' : 'danger',
    },
    {
      label: 'Rent outstanding',
      value: formatKES(rent.outstanding),
      note: rent.units_in_arrears
        ? `arrears in ${rent.units_in_arrears} ${rent.units_in_arrears === 1 ? 'unit' : 'units'}`
        : 'no rent arrears',
      tone: rent.units_in_arrears ? 'danger' : 'success',
    },
    {
      label: 'Occupancy rate',
      value: formatPercent(occupancy.occupancy_rate),
      note: `${occupancy.occupied_units} / ${occupancy.total_units} units`,
      tone: 'success',
    },
    {
      label: 'Unmatched payments',
      value: formatNumber(unmatched.count),
      note: unmatched.count ? 'needs your review' : 'all payments matched',
      tone: unmatched.count ? 'danger' : 'success',
    },
  ]

  const waterStats = [
    {
      label: 'Water billed',
      value: formatKES(water.billed),
      note: `${formatNumber(water.units_used)} units consumed`,
      tone: 'muted',
    },
    {
      label: 'Water collected',
      value: formatKES(water.collected),
      note: water.billed
        ? `${formatPercent(Math.round((water.collected / water.billed) * 1000) / 10)} of billed`
        : 'nothing billed yet',
      tone: water.billed ? 'success' : 'muted',
    },
    {
      label: 'Water outstanding',
      value: formatKES(water.outstanding),
      note: water.outstanding > 0 ? 'unpaid balances' : 'nothing unpaid',
      tone: water.outstanding > 0 ? 'danger' : 'success',
    },
    {
      label: 'Readings pending',
      value: formatNumber(water.readings_pending),
      note: water.readings_pending ? 'meters not read this month' : 'all meters read',
      tone: 'muted',
    },
  ]

  return (
    <>
      <SectionLabel title="Rent - this month" pill="Rent account" />
      <div className="mb-7 grid gap-[14px] sm:grid-cols-2 xl:grid-cols-4">
        {rentStats.map((item) => (
          <StatCard key={item.label} {...item} />
        ))}
      </div>

      <SectionLabel title="Water - this month" pill="Water account" blue />
      <div className="mb-7 grid gap-[14px] sm:grid-cols-2 xl:grid-cols-4">
        {waterStats.map((item) => (
          <StatCard key={item.label} {...item} />
        ))}
      </div>

      <div className="mb-7 grid gap-4 xl:grid-cols-[1.6fr_1fr]">
        <RentChart months={home.rent_by_month} scope={scope} />
        <UnmatchedPayments unmatched={unmatched} />
      </div>

      <RecentActivity activity={home.activity} />
    </>
  )
}

function SectionLabel({ title, pill, blue }) {
  return (
    <div className="mb-[14px] flex items-center gap-2">
      <span className="text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--accent-ink)]">
        {title}
      </span>
      <span
        className={`rounded-full px-[9px] py-[3px] text-[10px] font-bold uppercase tracking-[0.04em] ${
          blue ? 'bg-[var(--info-soft)] text-[var(--info)]' : 'bg-[var(--accent-soft)] text-[var(--accent-hover)]'
        }`}
      >
        {pill}
      </span>
      <span className="h-px flex-1 bg-[var(--line)]" />
    </div>
  )
}

// One bar per month, as tall as that month's rent against the best month shown.
function RentChart({ months, scope }) {
  const highest = Math.max(...months.map((month) => month.amount), 1)

  return (
    <section className={cardClass}>
      <div className={cardHeaderClass}>
        <h3 className="text-[12px] font-bold">Rent collection - last 6 months</h3>
        <span className="text-[10px] text-[var(--ink-faint)]">{scope}</span>
      </div>

      <div className="flex h-[232px] items-end justify-center px-6 pb-8 pt-10">
        <div className="relative flex h-[150px] w-full max-w-[560px] items-end justify-between border-b border-[var(--line)]">
          <div className="absolute inset-x-0 top-0 h-px bg-[var(--line-soft)]" />
          <div className="absolute inset-x-0 top-1/3 h-px bg-[var(--line-soft)]" />
          <div className="absolute inset-x-0 top-2/3 h-px bg-[var(--line-soft)]" />

          {months.map((month, index) => (
            <div
              key={month.month}
              title={`${month.label}: ${formatKES(month.amount)}`}
              className="relative z-10 flex h-full flex-col items-center justify-end gap-1"
            >
              <span className="font-mono text-[9px] text-[var(--ink-faint)]">
                {month.amount ? formatKESCompact(month.amount).replace('KES ', '') : ''}
              </span>
              <div
                className={`w-[30px] rounded-t-[4px] ${
                  index === months.length - 1 ? 'bg-[var(--accent)]' : 'bg-[var(--accent-muted)]'
                }`}
                style={{ height: month.amount ? Math.max((month.amount / highest) * 118, 3) : 0 }}
              />
              <span className="font-mono absolute -bottom-6 text-[10px] text-[var(--ink-faint)]">
                {month.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function UnmatchedPayments({ unmatched }) {
  return (
    <section className={cardClass}>
      <div className={cardHeaderClass}>
        <h3 className="text-[13px] font-bold">Unmatched payments</h3>
        {unmatched.count ? (
          <span className="rounded-full bg-[var(--warning-soft)] px-[9px] py-[3px] text-[10px] font-bold text-[var(--warning)]">
            {unmatched.count} to review
          </span>
        ) : null}
      </div>

      {unmatched.latest.length ? (
        unmatched.latest.map((payment) => (
          <div
            key={payment.id}
            className="flex items-start justify-between gap-4 border-b border-[var(--line-soft)] px-[18px] py-[13px] last:border-b-0"
          >
            <div>
              <div className="font-mono text-[11px] font-semibold">
                {payment.payer_phone ? formatPhone(payment.payer_phone) : payment.reference || 'No reference'}
              </div>
              <div className="mt-[3px] text-[12px] text-[var(--ink-faint)]">
                {[
                  PAYMENT_METHODS.find(([value]) => value === payment.payment_method)?.[1],
                  payment.unmatched_reason,
                ]
                  .filter(Boolean)
                  .join(' · ')}
              </div>
            </div>
            <div className="font-mono whitespace-nowrap text-[13px] font-semibold">
              {formatKES(payment.amount)}
            </div>
          </div>
        ))
      ) : (
        <EmptyState
          title="No unmatched payments"
          message="Every payment received has been matched to a tenant."
        />
      )}

      <div className="bg-[var(--bg)] px-[18px] py-3">
        <Link
          to="/payments"
          className="block w-full rounded-[8px] border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-center text-[12px] font-bold"
        >
          {unmatched.count ? 'Review all' : 'Open payments'}
        </Link>
      </div>
    </section>
  )
}

function RecentActivity({ activity }) {
  return (
    <section className={cardClass}>
      <div className={cardHeaderClass}>
        <h3 className="text-[13px] font-bold">Recent activity</h3>
        <span className="text-[12px] text-[var(--ink-faint)]">Latest first</span>
      </div>

      {activity.length ? (
        <div className="overflow-x-auto">
          <table className="min-w-[760px] w-full border-collapse">
            <thead>
              <tr className="bg-[var(--bg)] text-left text-[10px] uppercase tracking-[0.05em] text-[var(--ink-faint)]">
                <th className="px-[18px] py-[10px] font-bold">Event</th>
                <th className="px-[18px] py-[10px] font-bold">Property / Unit</th>
                <th className="px-[18px] py-[10px] font-bold">Amount</th>
                <th className="px-[18px] py-[10px] font-bold">Time</th>
              </tr>
            </thead>
            <tbody>
              {activity.map((item, index) => {
                const [label, tone] = activityKinds[item.type] || [item.type, 'neutral']

                return (
                  <tr key={index} className="border-b border-[var(--line-soft)] last:border-b-0">
                    <td className="px-[18px] py-[13px]">
                      <StatusBadge tone={tone}>{label}</StatusBadge>
                    </td>
                    <td className="px-[18px] py-[13px]">
                      <div className="text-[12px] font-bold">{item.name || '-'}</div>
                      <div className="mt-[2px] text-[12px] text-[var(--ink-faint)]">
                        {item.property_name} ·{' '}
                        {item.unit_number ? `House ${item.unit_number}` : 'Common area'}
                      </div>
                    </td>
                    <td className="font-mono px-[18px] py-[13px] text-[12px]">
                      {item.amount !== null ? `+ ${formatKES(item.amount)}` : item.detail || '-'}
                    </td>
                    <td className="whitespace-nowrap px-[18px] py-[13px] text-[12px]">
                      {formatDateTime(item.happened_at)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState
          title="No activity yet"
          message="Payments, meter readings, maintenance reports and new tenants will appear here."
        />
      )}
    </section>
  )
}

export default DashboardHomePage
