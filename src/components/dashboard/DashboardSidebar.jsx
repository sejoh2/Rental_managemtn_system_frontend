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

const navGroups = [
  {
    label: 'Overview',
    items: [{ label: 'Dashboard', icon: LayoutDashboard, page: 'dashboard' }],
  },
  {
    label: 'Property',
    items: [
      { label: 'Properties', icon: Building2, page: 'properties' },
      { label: 'Units / Houses', icon: Home, page: 'units' },
      { label: 'Tenants', icon: Users, page: 'tenants' },
      { label: 'Agreements', icon: FileText, page: 'agreements' },
      
    ],
  },
  {
    label: 'Money',
    items: [
      { label: 'Payments', icon: CreditCard, count: 3, page: 'payments' },
      { label: 'Water billing', icon: Droplets, page: 'water' },
      { label: 'Expenses', icon: ReceiptText, page: 'expenses' },
    ],
  },
  {
    label: 'Operations',
    items: [
      { label: 'Maintenance', icon: Wrench, count: 2, page: 'maintenance' },
      { label: 'Caretakers', icon: UserRoundCog, page: 'caretakers' },
      { label: 'SMS centre', icon: MessageSquareText, page: 'sms' },
      { label: 'Reports', icon: BarChart3, page: 'reports' },
    ],
  },
  {
  label: 'System',
  items: [
    { label: 'Settings', icon: Settings, page: 'settings' },
  ],
},
]

function DashboardSidebar({ open, activePage, onNavigate, onClose }) {
  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-black/40 transition lg:hidden ${
          open ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={onClose}
      />

      <aside
        className={`fixed left-0 top-[34px] z-50 flex h-[calc(100vh-34px)] w-[236px] flex-col bg-[var(--sidebar)] text-[var(--sidebar-ink)] transition-transform lg:sticky lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center gap-[10px] border-b border-[var(--sidebar-line)] px-5 py-[22px]">
          <div className="brand-mark">K</div>
          <div>
            <div className="font-display text-[16px] font-semibold text-white">Kodi</div>
            <div className="mt-[3px] text-[10px] uppercase tracking-[0.04em] text-[var(--sidebar-ink-soft)]">
              3 properties · 1 account
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
                <button
                  key={item.label}
                  onClick={() => item.page && onNavigate(item.page)}
                  className={`mb-[1px] flex w-full items-center gap-[10px] rounded-[8px] px-[10px] py-[9px] text-left text-[13px] font-medium transition ${
                    item.page === activePage
                      ? 'bg-[var(--accent)] text-white'
                      : 'text-[var(--sidebar-ink-soft)] hover:bg-[#26201A] hover:text-[var(--sidebar-ink)]'
                  }`}
                >
                  <item.icon size={17} />
                  <span>{item.label}</span>
                  {item.count ? (
                    <span className="ml-auto rounded-full bg-[var(--accent)] px-[6px] py-[1px] font-mono text-[10px] font-bold text-white">
                      {item.count}
                    </span>
                  ) : null}
                </button>
              ))}
            </div>
          ))}
        </nav>

        <div className="border-t border-[var(--sidebar-line)] px-4 py-[14px]">
          <button className="mb-7 ml-auto flex h-8 w-8 items-center justify-center rounded-[6px] text-[var(--sidebar-ink-soft)] hover:bg-[#26201A] hover:text-white">
            <LogOut size={18} />
          </button>

          <div className="flex items-center gap-[10px]">
            <div className="flex h-[34px] w-[34px] items-center justify-center rounded-full bg-[var(--accent-soft)] font-display text-[12px] font-bold text-[var(--accent)]">
              MW
            </div>
            <div>
              <div className="text-[12px] font-bold text-white">Mary Wanjiru</div>
              <div className="text-[10px] text-[var(--sidebar-ink-soft)]">Owner</div>
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}

export default DashboardSidebar