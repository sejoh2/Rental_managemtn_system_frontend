import {
  BarChart3,
  Building2,
  CreditCard,
  Droplets,
  FileText,
  Home,
  LayoutDashboard,
  LogOut,
  MessageSquareText,
  ReceiptText,
  UserRoundCog,
  Users,
  Wrench,
  X,
  Settings,
} from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { displayName, useAuth } from '../../context/AuthContext'
import { usePaymentStats } from '../../context/PaymentStatsContext'
import { useProperties } from '../../context/PropertiesContext'
import { humanize, initials } from '../../utils/format'

const navGroups = [
  {
    label: 'Overview',
    items: [{ label: 'Dashboard', icon: LayoutDashboard, to: '/dashboard' }],
  },
  {
    label: 'Property',
    items: [
      { label: 'Properties', icon: Building2, to: '/properties' },
      { label: 'Units / Houses', icon: Home, to: '/units' },
      { label: 'Tenants', icon: Users, to: '/tenants' },
      { label: 'Agreements', icon: FileText, to: '/agreements' },
      
    ],
  },
  {
    label: 'Money',
    items: [
      { label: 'Payments', icon: CreditCard, badge: 'unmatchedPayments', to: '/payments' },
      { label: 'Water billing', icon: Droplets, to: '/water-billing' },
      { label: 'Expenses', icon: ReceiptText, to: '/expenses' },
    ],
  },
  {
    label: 'Operations',
    items: [
      { label: 'Maintenance', icon: Wrench, to: '/maintenance' },
      { label: 'Caretakers', icon: UserRoundCog, to: '/caretakers' },
      { label: 'SMS centre', icon: MessageSquareText, to: '/sms-centre' },
      { label: 'Reports', icon: BarChart3, to: '/reports' },
    ],
  },
  {
  label: 'System',
  items: [
    { label: 'Settings', icon: Settings, to: '/settings' },
  ],
},
]

function DashboardSidebar({ open, onClose }) {
  const { user, signOut } = useAuth()
  const name = displayName(user)
  const properties = useProperties().data
  // Units across every property, shown under the Kodi name.
  const unitCount = (properties || []).reduce(
    (total, property) => total + property.summary.total_units,
    0
  )
  // Live counts shown next to nav items; an item with a zero count shows no badge.
  const badges = {
    unmatchedPayments: usePaymentStats().data?.unmatched_count || 0,
  }

  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-black/40 transition lg:hidden ${
          open ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={onClose}
      />

      <aside
        className={`fixed left-0 top-[34px] z-50 flex h-[calc(100vh-34px)] w-[236px] flex-col border-r border-[var(--sidebar-line)] bg-[var(--sidebar)] text-[var(--sidebar-ink)] transition-transform lg:sticky lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center gap-[10px] border-b border-[var(--sidebar-line)] px-5 py-[22px]">
          <div className="brand-mark">K</div>
          <div>
            <div className="font-display text-[16px] font-semibold text-[var(--sidebar-ink-strong)]">Kodi</div>
            <div className="mt-[3px] text-[10px] uppercase tracking-[0.04em] text-[var(--sidebar-ink-soft)]">
              {properties
                ? `${properties.length} ${properties.length === 1 ? 'property' : 'properties'} · ${unitCount} ${unitCount === 1 ? 'unit' : 'units'}`
                : 'Loading...'}
            </div>
          </div>

          <button onClick={onClose} className="ml-auto text-[var(--sidebar-ink-soft)] lg:hidden">
            <X size={18} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-[14px]">
          {navGroups.map((group) => (
            <div key={group.label}>
              <div className="px-[10px] pb-[6px] pt-[14px] text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--sidebar-ink-soft)]">
                {group.label}
              </div>

              {group.items.map((item) => (
                <NavLink
                  key={item.label}
                  to={item.to}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `mb-[1px] flex w-full items-center gap-[10px] rounded-[8px] px-[10px] py-[9px] text-left text-[13px] font-medium transition ${
                      isActive
                        ? 'bg-[var(--accent)] text-white'
                        : 'text-[var(--sidebar-ink-soft)] hover:bg-[var(--sidebar-hover)] hover:text-[var(--sidebar-ink)]'
                    }`
                  }
                >
                  <item.icon size={17} />
                  <span>{item.label}</span>
                  {badges[item.badge] ? (
                    <span className="ml-auto rounded-full bg-[var(--accent)] px-[6px] py-[1px] font-mono text-[10px] font-bold text-white">
                      {badges[item.badge]}
                    </span>
                  ) : null}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        <div className="border-t border-[var(--sidebar-line)] px-4 py-[14px]">
          <div className="flex items-center gap-[10px]">
            <div className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full bg-[var(--accent-soft)] font-display text-[12px] font-bold text-[var(--accent-ink)]">
              {initials(name)}
            </div>
            <div className="min-w-0">
              <div className="truncate text-[12px] font-bold text-[var(--sidebar-ink-strong)]">{name}</div>
              <div className="text-[10px] text-[var(--sidebar-ink-soft)]">{humanize(user.role)}</div>
            </div>

            <button
              type="button"
              onClick={signOut}
              title="Sign out"
              aria-label="Sign out"
              className="ml-auto flex h-8 w-8 shrink-0 items-center justify-center rounded-[6px] text-[var(--sidebar-ink-soft)] hover:bg-[var(--sidebar-hover)] hover:text-[var(--sidebar-ink-strong)]"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}

export default DashboardSidebar