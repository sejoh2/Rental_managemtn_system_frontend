import { useState } from 'react'
import { Navigate, Route, Routes, useLocation, useMatch, useNavigate, useSearchParams } from 'react-router-dom'
import DashboardSidebar from '../../components/dashboard/DashboardSidebar'
import AddPropertyModal from '../../components/dashboard/AddPropertyModal'
import AddTenantModal from '../../components/dashboard/AddTenantModal'
import ExportReportModal from '../../components/dashboard/ExportReportModal'
import Topbar from '../../components/dashboard/Topbar'
import DashboardHomePage from './DashboardHomePage'
import PropertiesPage from './PropertiesPage'
import UnitsHousesPage from './UnitsHousesPage'
import AgreementsPage from './AgreementsPage'
import PaymentDetailPage from './PaymentDetailPage'
import PaymentsPage from './PaymentsPage'
import WaterBillingPage from './WaterBillingPage'
import ExpensesPage from './ExpensesPage'
import TenantsPage from './TenantsPage'
import TenantProfilePage from './TenantProfilePage'
import MaintenancePage from './MaintenancePage'
import CaretakersPage from './CaretakersPage'
import SmsCentrePage from './SmsCentrePage'
import ReportsPage from './ReportsPage'
import SettingsPage from './SettingsPage'
import { useAuth } from '../../context/AuthContext'
import { useProperties } from '../../context/PropertiesContext'
import PropertiesProvider from '../../context/PropertiesProvider'
import PaymentStatsProvider from '../../context/PaymentStatsProvider'

const pageMeta = {
  dashboard: {
    title: 'Dashboard',
    subtitle: 'Overview of all properties',
  },
  properties: {
    title: 'Properties',
    subtitle: 'Your properties',
  },
  units: {
    title: 'Units / Houses',
    subtitle: 'Houses in each property',
  },
  agreements: {
    title: 'Agreements',
    subtitle: 'Auto-generated tenancy contracts',
  },
  payments: {
    title: 'Payments',
    subtitle: 'Rent, water & electricity received',
  },
  'water-billing': {
    title: 'Water billing',
    subtitle: 'Metered per unit',
  },
  expenses: {
    title: 'Expenses',
    subtitle: 'Track running costs',
  },
  tenants: {
    title: 'Tenants',
    subtitle: 'Everyone renting from you',
  },
  tenantProfile: {
    title: 'Tenant profile',
    subtitle: 'Balance, payments and agreement',
  },
  maintenance: {
    title: 'Maintenance',
    subtitle: 'Caretaker & tenant reports',
  },
  caretakers: {
    title: 'Caretakers',
    subtitle: 'Manage access & permissions',
  },
  'sms-centre': {
    title: 'SMS centre',
    subtitle: 'Reminders & announcements',
  },
  reports: {
    title: 'Reports',
    subtitle: 'Collection, arrears & occupancy',
  },
  settings: {
    title: 'Settings',
    subtitle: 'Account & system configuration',
  },
}

// "Mon, 12 Oct 2026"
function todayLabel() {
  return new Date().toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function DashboardPage() {
  return (
    <PropertiesProvider>
      <PaymentStatsProvider>
        <DashboardShell />
      </PaymentStatsProvider>
    </PropertiesProvider>
  )
}

function DashboardShell() {
  const properties = useProperties().data
  // Set when a system admin is working inside this owner's account.
  const { actingOwner, closeOwnerAccount } = useAuth()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [addPropertyOpen, setAddPropertyOpen] = useState(false)
  const [addTenantOpen, setAddTenantOpen] = useState(false)
  const [exportReportOpen, setExportReportOpen] = useState(false)
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const onTenantProfile = Boolean(useMatch('/tenants/:tenantId'))
  const meta = onTenantProfile
    ? pageMeta.tenantProfile
    : pageMeta[location.pathname.split('/')[1]] || pageMeta.dashboard

  // The property the Dashboard is filtered to, chosen in the top bar.
  const dashboardProperty =
    meta === pageMeta.dashboard
      ? properties?.find((property) => String(property.id) === searchParams.get('property'))
      : null

  let subtitle = meta.subtitle

  if (meta === pageMeta.dashboard) {
    subtitle = `${todayLabel()} - ${dashboardProperty ? dashboardProperty.name : 'Overview of all properties'}`
  }

  if (meta === pageMeta.properties && properties) {
    const units = properties.reduce((total, property) => total + property.summary.total_units, 0)

    subtitle = `${properties.length} ${properties.length === 1 ? 'property' : 'properties'}, ${units} ${units === 1 ? 'unit' : 'units'}`
  }

  return (
    <main className="min-h-screen bg-[var(--bg)] text-[var(--ink)]">
      <div className="proto-strip">
        {actingOwner ? (
          <>
            <span>
              <b>Admin</b> - you are working in {actingOwner.name}&apos;s account. Everything
              you do here is recorded under your name.
            </span>
            <button
              type="button"
              onClick={() => {
                closeOwnerAccount()
                navigate('/admin/overview')
              }}
              className="ml-auto rounded-[6px] border border-[var(--strip-line)] px-[10px] py-[3px] font-bold text-[var(--strip-ink-strong)]"
            >
              Exit account
            </button>
          </>
        ) : (
          <span>KODI - Owner Web Dashboard</span>
        )}
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
            onOpenSidebar={() => setSidebarOpen(true)}
            onAddTenant={() => setAddTenantOpen(true)}
          />

          <div className="h-[calc(100vh-98px)] overflow-y-auto px-4 py-6 sm:px-6 lg:px-[30px]">
            <Routes>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route
                path="dashboard"
                element={
                  <DashboardHomePage
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
              <Route path="units" element={<UnitsHousesPage />} />
              <Route
                path="tenants"
                element={<TenantsPage onAddTenant={() => setAddTenantOpen(true)} />}
              />
              <Route path="tenants/:tenantId" element={<TenantProfilePage />} />
              <Route path="agreements" element={<AgreementsPage />} />
              <Route path="payments" element={<PaymentsPage />} />
              <Route path="payments/:paymentId" element={<PaymentDetailPage />} />
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

      {/* Opened from the Dashboard, so it starts on the property shown there. */}
      <ExportReportModal
        open={exportReportOpen}
        defaultPropertyId={dashboardProperty?.id}
        onClose={() => setExportReportOpen(false)}
      />
    </main>
  )
}

export default DashboardPage
