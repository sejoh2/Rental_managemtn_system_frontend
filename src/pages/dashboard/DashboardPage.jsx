import { useState } from 'react'
import { Navigate, Route, Routes, useLocation, useMatch } from 'react-router-dom'
import {
  Bell,
  Download,
  Menu,
  Plus,
  Search,
} from 'lucide-react'
import DashboardSidebar from '../../components/dashboard/DashboardSidebar'
import StatCard from '../../components/dashboard/StatCard'
import AddPropertyModal from '../../components/dashboard/AddPropertyModal'
import AddTenantModal from '../../components/dashboard/AddTenantModal'
import ExportReportModal from '../../components/dashboard/ExportReportModal'
import AddUnitModal from '../../components/dashboard/AddUnitModal'
import PropertiesPage from './PropertiesPage'
import UnitsHousesPage from './UnitsHousesPage'
import AgreementsPage from './AgreementsPage'
import PaymentsPage from './PaymentsPage'
import WaterBillingPage from './WaterBillingPage'
import ExpensesPage from './ExpensesPage'
import TenantsPage from './TenantsPage'
import MaintenancePage from './MaintenancePage'
import CaretakersPage from './CaretakersPage'
import SmsCentrePage from './SmsCentrePage'
import ReportsPage from './ReportsPage'
import SettingsPage from './SettingsPage'
import { rentStats, waterStats, unmatchedPayments, recentActivity } from '../../data/dashboardData'
import { tenants } from '../../data/tenantsData'
import { useAuth } from '../../context/AuthContext'
import { useProperties } from '../../context/PropertiesContext'
import PropertiesProvider from '../../context/PropertiesProvider'

const pageMeta = {
  dashboard: {
    title: 'Dashboard',
    subtitle: 'Wed, 8 Jul 2026 - Overview of all properties',
    pill: 'Dashboard',
  },
  properties: {
    title: 'Properties',
    subtitle: '3 properties, 128 units',
    pill: 'Properties',
  },
  units: {
  title: 'Units / Houses',
  subtitle: 'Green View Apartments',
  pill: 'Units / Houses',
},
agreements: {
  title: 'Agreements',
  subtitle: 'Auto-generated tenancy contracts',
  pill: 'Agreements',
},
payments: {
  title: 'Payments',
  subtitle: 'Rent & water, matched automatically',
  pill: 'Payments',
},
'water-billing': {
  title: 'Water billing',
  subtitle: 'Metered per unit',
  pill: 'Water billing',
},
expenses: {
  title: 'Expenses',
  subtitle: 'Track running costs',
  pill: 'Expenses',
},
tenants: {
  title: 'Tenants',
  subtitle: '123 active tenants',
  pill: 'Tenants',
},
maintenance: {
  title: 'Maintenance',
  subtitle: 'Caretaker & tenant reports',
  pill: 'Maintenance',
},
caretakers: {
  title: 'Caretakers',
  subtitle: 'Manage access & permissions',
  pill: 'Caretakers',
},
'sms-centre': {
  title: 'SMS centre',
  subtitle: 'Reminders & announcements',
  pill: 'SMS centre',
},
reports: {
  title: 'Reports',
  subtitle: 'Collection, arrears & occupancy',
  pill: 'Reports',
},
settings: {
  title: 'Settings',
  subtitle: 'Account & system configuration',
  pill: 'Settings',
},
}

function DashboardPage() {
  return (
    <PropertiesProvider>
      <DashboardShell />
    </PropertiesProvider>
  )
}

function DashboardShell() {
  const properties = useProperties().data
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [addPropertyOpen, setAddPropertyOpen] = useState(false)
  const [addTenantOpen, setAddTenantOpen] = useState(false)
  const [exportReportOpen, setExportReportOpen] = useState(false)
const [addUnitOpen, setAddUnitOpen] = useState(false)
  const location = useLocation()
  const tenantMatch = useMatch('/tenants/:tenantId')
  const selectedTenant = tenantMatch
    ? tenants.find((tenant) => tenant.id === tenantMatch.params.tenantId)
    : null
  const meta = selectedTenant
  ? {
      title: 'Tenant profile',
      subtitle: `${selectedTenant.name} - ${selectedTenant.unit.replace('·', 'House')}`,
      pill: 'Tenant profile',
    }
  : pageMeta[location.pathname.split('/')[1]] || pageMeta.dashboard
  const propertyCount = properties
    ? `${properties.length} ${properties.length === 1 ? 'property' : 'properties'}`
    : null
  const subtitle =
    meta === pageMeta.properties && properties
      ? `${propertyCount}, ${properties.reduce((total, property) => total + property.summary.total_units, 0)} units`
      : meta.subtitle

  return (
    <main className="min-h-screen bg-[var(--bg)] text-[var(--ink)]">
      <div className="proto-strip">
        <span>KODI - Owner Web Dashboard</span>
        
        <span className="proto-pill">{meta.pill}</span>
      </div>

      <div className="flex min-h-screen pt-[34px]">
        <DashboardSidebar
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        <section className="min-w-0 flex-1">
          <Topbar
            title={meta.title}
            subtitle={subtitle}
            propertyCount={propertyCount}
            onOpenSidebar={() => setSidebarOpen(true)}
            onAddTenant={() => setAddTenantOpen(true)}
          />

          <div className="h-[calc(100vh-98px)] overflow-y-auto px-4 py-6 sm:px-6 lg:px-[30px]">
            <Routes>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route
                path="dashboard"
                element={
                  <DashboardHome
                    onAddProperty={() => setAddPropertyOpen(true)}
                    onExportReport={() => setExportReportOpen(true)}
                  />
                }
              />
              <Route
                path="properties"
                element={<PropertiesPage onAddProperty={() => setAddPropertyOpen(true)} />}
              />
              <Route
                path="properties/:propertyId"
                element={<PropertiesPage onAddProperty={() => setAddPropertyOpen(true)} />}
              />
              <Route
                path="units"
                element={<UnitsHousesPage onAddUnit={() => setAddUnitOpen(true)} />}
              />
              <Route
                path="tenants"
                element={<TenantsPage onAddTenant={() => setAddTenantOpen(true)} />}
              />
              <Route
                path="tenants/:tenantId"
                element={<TenantsPage onAddTenant={() => setAddTenantOpen(true)} />}
              />
              <Route path="agreements" element={<AgreementsPage />} />
              <Route path="payments" element={<PaymentsPage />} />
              <Route path="water-billing" element={<WaterBillingPage />} />
              <Route path="expenses" element={<ExpensesPage />} />
              <Route path="maintenance" element={<MaintenancePage />} />
              <Route path="caretakers" element={<CaretakersPage />} />
              <Route path="sms-centre" element={<SmsCentrePage />} />
              <Route path="reports" element={<ReportsPage />} />
              <Route
                path="settings"
                element={<SettingsPage onAddProperty={() => setAddPropertyOpen(true)} />}
              />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </div>
        </section>
         </div>

      <AddPropertyModal
        open={addPropertyOpen}
        onClose={() => setAddPropertyOpen(false)}
      />

      <AddTenantModal
        open={addTenantOpen}
        onClose={() => setAddTenantOpen(false)}
      />

      <ExportReportModal
        open={exportReportOpen}
        onClose={() => setExportReportOpen(false)}
      />

      <AddUnitModal
        open={addUnitOpen}
        onClose={() => setAddUnitOpen(false)}
      />
    </main>
  )
}

function DashboardHome({ onAddProperty, onExportReport }) {
  const { user } = useAuth()

  return (
    <>
      <div className="mb-7 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-[10px] text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--accent)]">
            Overview
          </div>
          <h1 className="font-display text-[20px] font-semibold tracking-[-0.01em]">
            Good afternoon{user.first_name ? `, ${user.first_name}` : ''} 👋
          </h1>
          <p className="mt-2 text-[12px] text-[var(--ink-soft)]">
            Here’s how your 3 properties are performing this month.
          </p>
        </div>

        <div className="flex flex-wrap gap-[10px]">
          <button
            onClick={onExportReport}
            className="inline-flex items-center gap-2 rounded-[8px] border border-[var(--line)] bg-white px-4 py-[10px] text-[12px] font-bold"
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
        <RentChart />
        <UnmatchedPayments />
      </div>

      <RecentActivity />
    </>
  )
}

function Topbar({ title, subtitle, propertyCount, onOpenSidebar, onAddTenant }) {
  return (
    <header className="sticky top-[34px] z-30 flex h-[64px] items-center gap-4 border-b border-[var(--line)] bg-white px-4 sm:px-6">
      <button
        type="button"
        onClick={onOpenSidebar}
        className="flex h-9 w-9 items-center justify-center rounded-[8px] border border-[var(--line)] text-[var(--ink-soft)] lg:hidden"
      >
        <Menu size={18} />
      </button>

      <div className="hidden min-w-[210px] lg:block">
        <h2 className="font-display text-[16px] font-semibold">{title}</h2>
        <p className="mt-[1px] text-[12px] text-[var(--ink-faint)]">
          {subtitle}
        </p>
      </div>

      <div className="hidden max-w-[360px] flex-1 items-center gap-2 rounded-[8px] border border-[var(--line)] bg-[var(--bg)] px-3 py-2 text-[12px] text-[var(--ink-faint)] md:flex">
        <Search size={15} />
        <span>Search tenants, houses, receipts...</span>
      </div>

      <select className="hidden rounded-[8px] border border-[var(--line)] bg-[var(--bg)] px-3 py-2 text-[12px] font-bold md:block">
        <option>{propertyCount ? `All ${propertyCount}` : 'All properties'}</option>
      </select>

      <div className="ml-auto flex items-center gap-[10px]">
        <button className="relative flex h-9 w-9 items-center justify-center rounded-[8px] border border-[var(--line)] bg-white text-[var(--ink-soft)]">
          <Bell size={17} />
          <span className="absolute right-[7px] top-[7px] h-[7px] w-[7px] rounded-full bg-[var(--accent)]" />
        </button>

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

function SectionLabel({ title, pill, blue }) {
  return (
    <div className="mb-[14px] flex items-center gap-2">
      <span className="text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--accent)]">
        {title}
      </span>
      <span
        className={`rounded-full px-[9px] py-[3px] text-[10px] font-bold uppercase tracking-[0.04em] ${
          blue
            ? 'bg-[#E6EDF4] text-[#3C5C82]'
            : 'bg-[var(--accent-soft)] text-[var(--accent-hover)]'
        }`}
      >
        {pill}
      </span>
      <span className="h-px flex-1 bg-[var(--line)]" />
    </div>
  )
}

function RentChart() {
  const bars = [
    ['Feb', 60, 'soft'],
    ['Mar', 80, 'soft'],
    ['Apr', 92, 'soft'],
    ['May', 76, 'soft'],
    ['Jun', 112, 'accent'],
    ['Jul', 132, 'accent'],
  ]

  return (
    <section className="overflow-hidden rounded-[10px] border border-[var(--line)] bg-white">
      <div className="flex items-center justify-between border-b border-[var(--line)] px-[18px] py-4">
        <h3 className="text-[12px] font-bold">Rent collection â€” last 6 months</h3>
        <span className="text-[10px] text-[var(--ink-faint)]">All properties</span>
      </div>

      <div className="flex h-[232px] items-end justify-center px-6 pb-8 pt-10">
        <div className="relative flex h-[150px] w-full max-w-[560px] items-end justify-between border-b border-[var(--line)]">
          <div className="absolute inset-x-0 top-0 h-px bg-[var(--line-soft)]" />
          <div className="absolute inset-x-0 top-1/3 h-px bg-[var(--line-soft)]" />
          <div className="absolute inset-x-0 top-2/3 h-px bg-[var(--line-soft)]" />

          {bars.map(([month, height, tone]) => (
            <div key={month} className="relative z-10 flex h-full flex-col items-center justify-end gap-4">
              <div
                className={`w-[30px] rounded-t-[4px] ${
                  tone === 'accent' ? 'bg-[var(--accent)]' : 'bg-[#EFC29F]'
                }`}
                style={{ height }}
              />
              <span className="font-mono text-[10px] text-[var(--ink-faint)]">
                {month}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function UnmatchedPayments() {
  return (
    <section className="overflow-hidden rounded-[10px] border border-[var(--line)] bg-white">
      <div className="flex items-center justify-between border-b border-[var(--line)] px-[18px] py-4">
        <h3 className="text-[13px] font-bold">Unmatched payments</h3>
        <span className="rounded-full bg-[#FBF0DA] px-[9px] py-[3px] text-[10px] font-bold text-[var(--warning)]">
          3 new
        </span>
      </div>

      {unmatchedPayments.map((payment) => (
        <div key={payment.title} className="flex items-start justify-between gap-4 border-b border-[var(--line-soft)] px-[18px] py-[13px] last:border-b-0">
          <div>
            <div className="font-mono text-[11px] font-semibold">{payment.title}</div>
            <div className="mt-[3px] text-[12px] text-[var(--ink-faint)]">
              {payment.subtitle}
            </div>
          </div>
          <div className="font-mono whitespace-nowrap text-[13px] font-semibold">
            {payment.amount}
          </div>
        </div>
      ))}

      <div className="bg-[var(--bg)] px-[18px] py-3">
        <button className="w-full rounded-[8px] border border-[var(--line)] bg-white px-3 py-2 text-[12px] font-bold">
          Review all
        </button>
      </div>
    </section>
  )
}

function RecentActivity() {
  return (
    <section className="overflow-hidden rounded-[10px] border border-[var(--line)] bg-white">
      <div className="flex items-center justify-between border-b border-[var(--line)] px-[18px] py-4">
        <h3 className="text-[13px] font-bold">Recent activity</h3>
        <span className="text-[12px] text-[var(--ink-faint)]">Today</span>
      </div>

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
            {recentActivity.map((item) => (
              <tr key={`${item.badge}-${item.name}`} className="border-b border-[var(--line-soft)] last:border-b-0">
                <td className="px-[18px] py-[13px]">
                  <Badge tone={item.badgeTone}>{item.badge}</Badge>
                </td>
                <td className="px-[18px] py-[13px]">
                  <div className="text-[12px] font-bold">{item.name}</div>
                  <div className="mt-[2px] text-[12px] text-[var(--ink-faint)]">{item.unit}</div>
                </td>
                <td className="font-mono px-[18px] py-[13px] text-[12px]">{item.amount}</td>
                <td className="px-[18px] py-[13px] text-[12px]">{item.time}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

function Badge({ tone, children }) {
  const tones = {
    success: 'bg-[#E3F1E8] text-[#2E7D4F]',
    info: 'bg-[#E6EDF4] text-[#3C5C82]',
    warning: 'bg-[#FBF0DA] text-[#B8790E]',
    neutral: 'bg-[var(--line-soft)] text-[var(--ink-soft)]',
  }

  return (
    <span className={`inline-flex items-center gap-[6px] rounded-full px-[9px] py-[3px] text-[10px] font-bold ${tones[tone]}`}>
      <span className="h-[6px] w-[6px] rounded-full bg-current" />
      {children}
    </span>
  )
}

export default DashboardPage