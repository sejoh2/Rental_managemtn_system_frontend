import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { getAnalytics } from '../../api/analytics'
import { DataState } from '../../components/common/DataState'
import StatCard from '../../components/dashboard/StatCard'
import { useApi } from '../../hooks/useApi'
import { formatNumber } from '../../utils/format'

const RANGES = [
  ['7', 'Last 7 days'],
  ['30', 'Last 30 days'],
  ['90', 'Last 90 days'],
]

// The owner's pages, to show the ones no owner opened.
const OWNER_PAGES = [
  '/dashboard',
  '/properties',
  '/units',
  '/tenants',
  '/tenants/:id',
  '/agreements',
  '/payments',
  '/water-billing',
  '/expenses',
  '/maintenance',
  '/caretakers',
  '/sms-centre',
  '/reports',
  '/settings',
]

const PAGE_NAMES = {
  '/': 'Home page',
  '/login': 'Sign in',
  '/privacy': 'Privacy',
  '/terms': 'Terms',
  '/dashboard': 'Dashboard',
  '/properties': 'Properties',
  '/properties/:id': 'A property',
  '/units': 'Units',
  '/tenants': 'Tenants',
  '/tenants/:id': 'A tenant',
  '/agreements': 'Agreements',
  '/payments': 'Payments',
  '/payments/:id': 'A payment',
  '/water-billing': 'Water billing',
  '/expenses': 'Expenses',
  '/maintenance': 'Maintenance',
  '/caretakers': 'Caretakers',
  '/sms-centre': 'SMS centre',
  '/reports': 'Reports',
  '/settings': 'Settings',
  '/no-access': 'Waiting for an account',
  '/name': 'Name step',
}

const SOURCE_NAMES = { direct: 'Typed in / bookmark', google: 'Google', whatsapp: 'WhatsApp', facebook: 'Facebook', instagram: 'Instagram', tiktok: 'TikTok', x: 'X (Twitter)' }

function pageName(path) {
  return PAGE_NAMES[path] || path
}

function percent(part, whole) {
  return whole ? Math.round((part / whole) * 100) : 0
}

function seconds(value) {
  if (value === null || value === undefined) return '-'
  if (value < 60) return `${value}s`

  return `${Math.floor(value / 60)}m ${value % 60}s`
}

const cardClass = 'rounded-[10px] border border-[var(--line)] bg-[var(--surface)] px-[18px] py-4'
const titleClass = 'text-[13px] font-bold text-[var(--ink)]'
const noteClass = 'mt-1 text-[11px] leading-[1.5] text-[var(--ink-faint)]'
const thClass = 'px-3 py-2 text-left text-[9px] font-bold uppercase tracking-[0.05em] text-[var(--ink-faint)]'
const tdClass = 'px-3 py-[9px] text-[12px] text-[var(--ink)]'
const numClass = 'px-3 py-[9px] text-right font-mono text-[12px] text-[var(--ink)]'

function Section({ title, note, children, className = '' }) {
  return (
    <section className={`${cardClass} ${className}`}>
      <h3 className={titleClass}>{title}</h3>
      {note ? <p className={noteClass}>{note}</p> : null}
      <div className="mt-3">{children}</div>
    </section>
  )
}

// A share of the largest value, as a thin bar behind a table row's number.
function ShareBar({ value, max }) {
  return (
    <div className="h-[6px] w-full rounded-full bg-[var(--line-soft)]">
      <div
        className="h-[6px] rounded-full bg-[var(--accent)]"
        style={{ width: `${value > 0 ? Math.max(2, percent(value, max)) : 0}%` }}
      />
    </div>
  )
}

function Table({ columns, rows, empty = 'Nothing yet in this period.' }) {
  if (!rows.length) return <p className="text-[11px] text-[var(--ink-faint)]">{empty}</p>

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[420px] border-collapse">
        <thead>
          <tr className="border-b border-[var(--line)]">
            {columns.map((column) => (
              <th key={column.label} className={`${thClass} ${column.numeric ? 'text-right' : ''}`}>
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={index} className="border-b border-[var(--line-soft)] last:border-b-0">
              {columns.map((column) => (
                <td key={column.label} className={column.numeric ? numClass : tdClass}>
                  {column.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/*
  Visits per day: one series, one hue. Hovering (or focusing) a day shows its
  numbers; the table below the chart is the same data in words.
*/
function DailyChart({ daily }) {
  const [hover, setHover] = useState(null)

  if (!daily.length) return <p className="text-[11px] text-[var(--ink-faint)]">No visits in this period yet.</p>

  const width = 760
  const height = 180
  const top = 12
  const bottom = 22
  const left = 34
  const max = Math.max(...daily.map((day) => day.visits), 1)
  const step = (width - left) / daily.length
  const bar = Math.max(3, Math.min(28, step - 2))
  // Distinct: with a top of 1, "half" and "top" are the same line.
  const ticks = [...new Set([0, Math.ceil(max / 2), max])]
  const y = (value) => top + (height - top - bottom) * (1 - value / max)
  const shown = hover === null ? null : daily[hover]

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${width} ${height}`} className="h-auto w-full" role="img" aria-label="Visits per day">
        {ticks.map((tick) => (
          <g key={tick}>
            <line x1={left} x2={width} y1={y(tick)} y2={y(tick)} stroke="var(--line-soft)" strokeWidth="1" />
            <text x={left - 6} y={y(tick) + 3} textAnchor="end" fontSize="10" fill="var(--ink-faint)">
              {tick}
            </text>
          </g>
        ))}

        {daily.map((day, index) => {
          const x = left + index * step + (step - bar) / 2
          const barTop = y(day.visits)
          const barHeight = Math.max(1, height - bottom - barTop)

          return (
            <g
              key={day.day}
              onMouseEnter={() => setHover(index)}
              onMouseLeave={() => setHover(null)}
              onFocus={() => setHover(index)}
              onBlur={() => setHover(null)}
              tabIndex={0}
            >
              {/* A hit area taller and wider than the bar. */}
              <rect x={left + index * step} y={top} width={step} height={height - top - bottom} fill="transparent" />
              <path
                d={`M${x},${height - bottom} V${barTop + Math.min(4, barHeight)} Q${x},${barTop} ${x + Math.min(4, bar / 2)},${barTop} H${x + bar - Math.min(4, bar / 2)} Q${x + bar},${barTop} ${x + bar},${barTop + Math.min(4, barHeight)} V${height - bottom} Z`}
                fill="var(--accent)"
                opacity={hover === null || hover === index ? 1 : 0.45}
              />
            </g>
          )
        })}

        {[...new Set([0, daily.length - 1])].map((index) => (
          <text
            key={index}
            x={left + index * step + step / 2}
            y={height - 6}
            textAnchor={index === 0 ? 'start' : 'end'}
            fontSize="10"
            fill="var(--ink-faint)"
          >
            {daily[index].day.slice(5)}
          </text>
        ))}
      </svg>

      {shown ? (
        <div className="pointer-events-none absolute right-2 top-0 rounded-[8px] border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-[11px] shadow-[0_8px_24px_rgba(32,28,24,0.12)]">
          <div className="font-bold text-[var(--ink)]">{shown.day}</div>
          <div className="text-[var(--ink-soft)]">
            {formatNumber(shown.visits)} visits · {formatNumber(shown.visitors)} visitors · {formatNumber(shown.page_views)} pages
          </div>
        </div>
      ) : null}
    </div>
  )
}

// The steps to becoming an owner, with how many stop at each one.
function Funnel({ funnel }) {
  const first = funnel[0]?.visitors || 0
  const drops = funnel.slice(1).map((step, index) => funnel[index].visitors - step.visitors)
  const worst = drops.length ? drops.indexOf(Math.max(...drops)) + 1 : -1

  return (
    <div className="grid gap-[10px]">
      {funnel.map((step, index) => {
        const previous = index ? funnel[index - 1].visitors : null
        const lost = previous === null ? 0 : Math.max(0, previous - step.visitors)

        return (
          <div key={step.key}>
            <div className="mb-1 flex flex-wrap items-baseline justify-between gap-2 text-[12px]">
              <span className="font-semibold text-[var(--ink)]">
                {index + 1}. {step.label}
              </span>
              <span className="font-mono text-[var(--ink)]">
                {formatNumber(step.visitors)}
                <span className="ml-2 text-[11px] text-[var(--ink-faint)]">{percent(step.visitors, first)}% of visitors</span>
              </span>
            </div>
            <ShareBar value={step.visitors} max={first} />
            {previous !== null && lost > 0 ? (
              <div className={`mt-1 text-[11px] ${index === worst ? 'font-bold text-[var(--danger)]' : 'text-[var(--ink-faint)]'}`}>
                {formatNumber(lost)} ({percent(lost, previous)}%) stopped before this step
                {index === worst ? ' - the biggest drop' : ''}
              </div>
            ) : null}
          </div>
        )
      })}
    </div>
  )
}

/*
  Kodi's own analytics: visits, where people come from, where they stop, what
  they click, which features owners use, and errors. Nothing here leaves Kodi.
*/
function AdminAnalyticsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const days = RANGES.some(([value]) => value === searchParams.get('days')) ? searchParams.get('days') : '30'
  const state = useApi(`admin-analytics-${days}`, () => getAnalytics(days))

  return (
    <>
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-[10px] text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--accent-ink)]">Administration</div>
          <h1 className="font-display text-[20px] font-semibold tracking-[-0.01em]">Analytics</h1>
          <p className="mt-2 max-w-[680px] text-[12px] leading-[1.5] text-[var(--ink-soft)]">
            How people find Kodi, where they stop, and which features owners use. Counted by Kodi itself: no names,
            phone numbers or addresses, nothing typed, and nothing sent to another company. Your own admin pages are not
            counted. Clicks are kept 90 days, daily totals for good.
          </p>
        </div>

        <div className="flex gap-2" role="group" aria-label="Period">
          {RANGES.map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setSearchParams({ days: value })}
              aria-pressed={days === value}
              className={`rounded-[8px] border px-3 py-2 text-[11px] font-bold ${
                days === value
                  ? 'border-[var(--accent)] bg-[var(--accent)] text-white'
                  : 'border-[var(--line)] bg-[var(--surface)] text-[var(--ink-soft)]'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <DataState state={state} loadingLabel="Loading analytics...">
        {(data) => {
          const { totals } = data
          const maxSource = Math.max(...data.sources.map((row) => row.visits), 1)
          const maxDevice = Math.max(...data.devices.map((row) => row.visits), 1)
          const used = new Set(data.features.map((row) => row.path))
          const neverOpened = OWNER_PAGES.filter((path) => !used.has(path))

          return (
            <div className="grid gap-[14px]">
              <div className="grid gap-[14px] sm:grid-cols-2 xl:grid-cols-5">
                <StatCard label="Visitors" value={formatNumber(totals.visitors)} note="Different browsers" />
                <StatCard label="Visits" value={formatNumber(totals.visits)} note="A visit ends after 30 idle minutes" />
                <StatCard label="Pages seen" value={formatNumber(totals.page_views)} note={`${formatNumber(totals.clicks)} ${totals.clicks === 1 ? 'click' : 'clicks'}`} />
                <StatCard label="Active owners" value={formatNumber(totals.active_owners)} note="Signed in and used Kodi" />
                <StatCard label="Errors" value={formatNumber(totals.errors)} note="Seen by visitors or owners" tone={totals.errors ? 'danger' : 'muted'} />
              </div>

              <Section title="Visits per day" note="Hover a day for its numbers.">
                <DailyChart daily={data.daily} />
              </Section>

              <div className="grid gap-[14px] xl:grid-cols-2">
                <Section
                  title="From visitor to owner"
                  note="How many visitors reached each step in this period. The red line is where most people stop."
                >
                  <Funnel funnel={data.funnel} />
                </Section>

                <Section title="Where visits end" note="The last page of each visit: where people stop. “After one page” means it was the only page they saw.">
                  <Table
                    rows={data.exits}
                    columns={[
                      { label: 'Page', render: (row) => pageName(row.path) },
                      { label: 'Visits ended', numeric: true, render: (row) => formatNumber(row.exits) },
                      { label: 'After one page', numeric: true, render: (row) => `${percent(row.single_page, row.exits)}%` },
                    ]}
                  />
                </Section>
              </div>

              <div className="grid gap-[14px] xl:grid-cols-2">
                <Section title="Where visitors come from" note="The site that sent them, or the link's utm_source.">
                  <Table
                    rows={data.sources}
                    columns={[
                      { label: 'From', render: (row) => SOURCE_NAMES[row.source] || row.source },
                      { label: 'Visits', numeric: true, render: (row) => formatNumber(row.visits) },
                      { label: '', render: (row) => <ShareBar value={row.visits} max={maxSource} /> },
                    ]}
                  />
                </Section>

                <Section title="Screens" note="By screen width when they visited.">
                  <Table
                    rows={data.devices}
                    columns={[
                      { label: 'Screen', render: (row) => ({ mobile: 'Phone', tablet: 'Tablet', desktop: 'Computer' })[row.device] || 'Unknown' },
                      { label: 'Visits', numeric: true, render: (row) => formatNumber(row.visits) },
                      { label: '', render: (row) => <ShareBar value={row.visits} max={maxDevice} /> },
                    ]}
                  />
                </Section>
              </div>

              <div className="grid gap-[14px] xl:grid-cols-2">
                <Section title="Pages" note="Most seen first, with the average time a page stayed open.">
                  <Table
                    rows={data.pages}
                    columns={[
                      { label: 'Page', render: (row) => pageName(row.path) },
                      { label: 'Seen', numeric: true, render: (row) => formatNumber(row.views) },
                      { label: 'Visitors', numeric: true, render: (row) => formatNumber(row.visitors) },
                      { label: 'Avg. time', numeric: true, render: (row) => seconds(row.seconds) },
                    ]}
                  />
                </Section>

                <Section title="What people click" note="Buttons and links, by their words.">
                  <Table
                    rows={data.clicks}
                    columns={[
                      { label: 'Clicked', render: (row) => row.name },
                      { label: 'On', render: (row) => pageName(row.path) },
                      { label: 'Clicks', numeric: true, render: (row) => formatNumber(row.clicks) },
                      { label: 'People', numeric: true, render: (row) => formatNumber(row.visitors) },
                    ]}
                  />
                </Section>
              </div>

              <div className="grid gap-[14px] xl:grid-cols-2">
                <Section title="Features owners use" note="Pages opened by signed-in owners: how many owners, and how often.">
                  <Table
                    rows={data.features}
                    columns={[
                      { label: 'Page', render: (row) => pageName(row.path) },
                      { label: 'Owners', numeric: true, render: (row) => formatNumber(row.owners) },
                      { label: 'Opened', numeric: true, render: (row) => formatNumber(row.views) },
                    ]}
                  />
                  {neverOpened.length && totals.active_owners ? (
                    <p className="mt-3 text-[11px] leading-[1.5] text-[var(--ink-soft)]">
                      <span className="font-bold text-[var(--ink)]">No owner opened: </span>
                      {neverOpened.map(pageName).join(', ')}.
                    </p>
                  ) : null}
                </Section>

                <Section title="Errors" note="Things that went wrong in the browser, with the page they happened on.">
                  <Table
                    rows={data.errors}
                    empty="No errors in this period."
                    columns={[
                      { label: 'Error', render: (row) => <span className="break-all">{row.name}</span> },
                      { label: 'On', render: (row) => pageName(row.path) },
                      { label: 'Times', numeric: true, render: (row) => formatNumber(row.times) },
                      { label: 'People', numeric: true, render: (row) => formatNumber(row.visitors) },
                    ]}
                  />
                </Section>
              </div>

              <Section title="Every month" note="From the daily totals, kept for good.">
                <Table
                  rows={data.monthly}
                  columns={[
                    { label: 'Month', render: (row) => row.month },
                    { label: 'Pages seen', numeric: true, render: (row) => formatNumber(row.page_views) },
                    { label: 'Clicks', numeric: true, render: (row) => formatNumber(row.clicks) },
                  ]}
                />
              </Section>
            </div>
          )
        }}
      </DataState>
    </>
  )
}

export default AdminAnalyticsPage
