import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Download } from 'lucide-react'
import { downloadTenantStatement, getReport } from '../../api/reports'
import { listTenants } from '../../api/tenants'
import { DataState, FormError } from '../../components/common/DataState'
import { inputClass, labelClass } from '../../components/common/Modal'
import SearchableSelect from '../../components/common/SearchableSelect'
import ExportReportModal from '../../components/dashboard/ExportReportModal'
import { useProperties } from '../../context/PropertiesContext'
import { useApi } from '../../hooks/useApi'
import { formatDate, formatKES, formatNumber, formatPercent } from '../../utils/format'
import { REPORT_PERIODS } from '../../utils/labels'
import { isCurrentTenant } from '../../utils/tenantStatus'

const cardClass = 'overflow-hidden rounded-[10px] border border-[var(--line)] bg-white'
const cardHeaderClass = 'border-b border-[var(--line)] px-[18px] py-4'
const filterClass =
  'rounded-[8px] border border-[var(--line)] bg-white px-3 py-[10px] text-[12px] font-bold'

function Row({ label, value, strong, danger, note }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-[var(--line-soft)] py-[10px] text-[12px] last:border-b-0">
      <span className={strong ? 'font-bold' : 'text-[var(--ink-soft)]'}>
        {label}
        {note ? (
          <span className="block text-[10px] font-normal text-[var(--ink-faint)]">{note}</span>
        ) : null}
      </span>
      <span className={`font-mono ${strong ? 'font-bold' : 'font-semibold'} ${danger ? 'text-[#B3261E]' : ''}`}>
        {value}
      </span>
    </div>
  )
}

function ReportsPage() {
  const properties = useProperties().data || []
  const [searchParams, setSearchParams] = useSearchParams()
  const [exportOpen, setExportOpen] = useState(false)

  // Filters live in the URL: /reports?property=1&period=last_month
  const propertyId = searchParams.get('property') || ''
  const period = REPORT_PERIODS.some(([value]) => value === searchParams.get('period'))
    ? searchParams.get('period')
    : 'this_month'

  const reportState = useApi(`report-${propertyId || 'all'}-${period}`, () =>
    getReport({ property_id: propertyId, period })
  )

  function setParam(name, value) {
    const next = new URLSearchParams(searchParams)

    if (value) next.set(name, value)
    else next.delete(name)

    setSearchParams(next)
  }

  return (
    <>
      <div className="mb-7 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-[10px] text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--accent)]">
            Operations
          </div>
          <h1 className="font-display text-[20px] font-semibold tracking-[-0.01em]">
            Reports
          </h1>
          <p className="mt-2 text-[12px] text-[var(--ink-soft)]">
            Collection, arrears, occupancy and water reports across properties.
          </p>
        </div>

        <div className="flex flex-wrap gap-[10px]">
          <select
            value={propertyId}
            onChange={(event) => setParam('property', event.target.value)}
            aria-label="Property"
            className={`min-w-[200px] ${filterClass}`}
          >
            <option value="">All properties</option>
            {properties.map((property) => (
              <option key={property.id} value={property.id}>{property.name}</option>
            ))}
          </select>

          <select
            value={period}
            onChange={(event) => setParam('period', event.target.value)}
            aria-label="Period"
            className={filterClass}
          >
            {REPORT_PERIODS.map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>

          <button
            onClick={() => setExportOpen(true)}
            className={`inline-flex items-center gap-2 ${filterClass}`}
          >
            <Download size={15} />
            Export report
          </button>
        </div>
      </div>

      <DataState state={reportState} loadingLabel="Loading report...">
        {(report) => <ReportCards report={report} />}
      </DataState>

      <StatementGenerator />

      <ExportReportModal
        open={exportOpen}
        defaultPropertyId={propertyId}
        defaultPeriod={period}
        onClose={() => setExportOpen(false)}
      />
    </>
  )
}

function ReportCards({ report }) {
  const { occupancy, arrears, collection, expenses, sms, water } = report
  const periodText = `${formatDate(report.period.start_date)} to ${formatDate(report.period.end_date)}`

  return (
    <>
      <div className="grid gap-4 xl:grid-cols-3">
        <section className={cardClass}>
          <div className={cardHeaderClass}>
            <h3 className="text-[12px] font-bold">Occupancy</h3>
            <p className="mt-[3px] text-[10px] text-[var(--ink-faint)]">As of today</p>
          </div>

          <div className="flex flex-col items-center justify-center px-[18px] py-8">
            {/* The coloured part of the ring is the share of units occupied. */}
            <div
              className="flex h-[104px] w-[104px] items-center justify-center rounded-full"
              style={{
                background: `conic-gradient(var(--accent) ${occupancy.occupancy_rate}%, var(--line-soft) 0)`,
              }}
            >
              <div className="flex h-[76px] w-[76px] items-center justify-center rounded-full bg-white">
                <span className="text-[18px] font-bold">{formatPercent(occupancy.occupancy_rate)}</span>
              </div>
            </div>
            <p className="mt-5 text-[11px] text-[var(--ink-faint)]">
              {occupancy.occupied_units} of {occupancy.total_units}{' '}
              {occupancy.total_units === 1 ? 'unit' : 'units'} occupied
              {occupancy.maintenance_units ? ` - ${occupancy.maintenance_units} under maintenance` : ''}
            </p>
          </div>
        </section>

        <section className={cardClass}>
          <div className={cardHeaderClass}>
            <h3 className="text-[12px] font-bold">Arrears by property</h3>
            <p className="mt-[3px] text-[10px] text-[var(--ink-faint)]">Owed today, whatever the period</p>
          </div>

          <div className="px-[18px] py-3">
            {arrears.by_property.map((item) => (
              <Row
                key={item.property_id}
                label={item.property_name}
                value={formatKES(item.arrears_amount)}
                danger={item.arrears_amount > 0}
                note={
                  [
                    item.tenants_in_arrears
                      ? `${item.tenants_in_arrears} current ${item.tenants_in_arrears === 1 ? 'tenant' : 'tenants'}`
                      : null,
                    item.former_tenant_arrears > 0
                      ? `former tenants owe ${formatKES(item.former_tenant_arrears)}`
                      : null,
                  ]
                    .filter(Boolean)
                    .join(' - ') || null
                }
              />
            ))}

            <Row
              label="Current tenants owe"
              value={formatKES(arrears.total_arrears)}
              strong
              danger={arrears.total_arrears > 0}
            />
            {arrears.total_former_arrears > 0 ? (
              <Row label="Former tenants owe" value={formatKES(arrears.total_former_arrears)} strong />
            ) : null}
          </div>
        </section>

        <section className={cardClass}>
          <div className={cardHeaderClass}>
            <h3 className="text-[12px] font-bold">SMS usage</h3>
            <p className="mt-[3px] text-[10px] text-[var(--ink-faint)]">{periodText}</p>
          </div>

          <div className="px-[18px] py-3">
            <Row label="Messages" value={`${formatNumber(sms.total_messages)} msgs`} />
            <Row label="Cost" value={formatKES(sms.sms_cost)} />
            <Row
              label="Accepted"
              value={formatPercent(sms.delivery_rate)}
              note="Accepted by the SMS provider"
            />
            <Row label="Failed" value={formatNumber(sms.failed_messages)} danger={sms.failed_messages > 0} />
          </div>
        </section>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[1.6fr_1fr]">
        <section className={cardClass}>
          <div className={cardHeaderClass}>
            <h3 className="text-[12px] font-bold">Income and expenses</h3>
            <p className="mt-[3px] text-[10px] text-[var(--ink-faint)]">{periodText}</p>
          </div>

          <div className="px-[18px] py-3">
            <Row label="Rent" value={formatKES(collection.rent_collected)} />
            <Row label="Water" value={formatKES(collection.water_collected)} />
            <Row label="Electricity" value={formatKES(collection.electricity_collected)} />
            <Row label="Service charges" value={formatKES(collection.service_collected)} />
            <Row label="Repairs and deductions" value={formatKES(collection.repairs_collected)} />
            <Row label="Total income" value={formatKES(collection.total_income)} strong />
            <Row label="Expenses" value={`- ${formatKES(expenses.total_expenses)}`} danger />
            <Row
              label="Net income"
              value={formatKES(expenses.net_operating_income)}
              strong
              danger={expenses.net_operating_income < 0}
            />

            <p className="mt-3 pb-2 text-[10px] leading-[1.5] text-[var(--ink-faint)]">
              Income is money actually paid in the period, the same as on
              the Expenses page. Deposits received (
              {formatKES(collection.deposits_collected)}) are held for
              tenants and are not counted.
            </p>
          </div>
        </section>

        <section className={`h-fit ${cardClass}`}>
          <div className={cardHeaderClass}>
            <h3 className="text-[12px] font-bold">Water</h3>
            <p className="mt-[3px] text-[10px] text-[var(--ink-faint)]">Bills for {periodText}</p>
          </div>

          <div className="px-[18px] py-3">
            <Row label="Billed" value={formatKES(water.water_billed)} />
            <Row label="Paid so far" value={formatKES(water.water_paid)} />
            <Row
              label="Still owed"
              value={formatKES(water.water_outstanding)}
              danger={water.water_outstanding > 0}
            />
            <Row label="Meter readings" value={formatNumber(water.meter_readings_submitted)} />
            <Row
              label="Flagged readings"
              value={formatNumber(water.flagged_readings)}
              danger={water.flagged_readings > 0}
            />
          </div>
        </section>
      </div>
    </>
  )
}

function StatementGenerator() {
  // Former tenants are included: a statement is often needed after move-out.
  const tenantsState = useApi('tenants', () => listTenants())
  const [tenantId, setTenantId] = useState('')
  const [period, setPeriod] = useState('last_6_months')
  const [working, setWorking] = useState(false)
  const [error, setError] = useState(null)

  const options = (tenantsState.data || []).map((tenant) => ({
    value: String(tenant.id),
    label: tenant.full_name,
    hint: `${tenant.property_name} · House ${tenant.unit_number}`,
    group: isCurrentTenant(tenant) ? 'Current tenants' : 'Former tenants',
  }))
  // Current tenants first, so the group headings appear once each.
  options.sort((first, second) => first.group.localeCompare(second.group))

  async function generate() {
    setWorking(true)
    setError(null)

    try {
      await downloadTenantStatement(tenantId, period)
    } catch (downloadError) {
      setError(downloadError)
    } finally {
      setWorking(false)
    }
  }

  return (
    <section className="mt-4 rounded-[10px] border border-[var(--line)] bg-white">
      <div className={cardHeaderClass}>
        <h3 className="text-[12px] font-bold">Tenant statement generator</h3>
        <p className="mt-[3px] text-[10px] text-[var(--ink-faint)]">
          A PDF of one tenant&apos;s charges and payments for the period, with
          anything still unpaid from earlier and, after move-out, the deposit
          reconciliation.
        </p>
      </div>

      <div className="grid gap-3 px-[18px] py-5 lg:grid-cols-[1fr_170px_170px] lg:items-end">
        <SearchableSelect
          label="Tenant"
          value={tenantId}
          onChange={setTenantId}
          options={options}
          placeholder={tenantsState.loading ? 'Loading tenants...' : 'Search a tenant by name or house...'}
        />

        <div>
          <label className={labelClass}>Period</label>
          <select value={period} onChange={(event) => setPeriod(event.target.value)} className={inputClass}>
            {REPORT_PERIODS.map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>

        <button
          onClick={generate}
          disabled={!tenantId || working}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-[8px] border border-[var(--accent)] bg-[var(--accent)] px-4 text-[12px] font-bold text-white disabled:opacity-50"
        >
          <Download size={15} />
          {working ? 'Preparing...' : 'Generate PDF'}
        </button>
      </div>

      {error ? (
        <div className="px-[18px] pb-5">
          <FormError error={error} />
        </div>
      ) : null}
    </section>
  )
}

export default ReportsPage
