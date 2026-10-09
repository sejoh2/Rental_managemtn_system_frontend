import { useState } from 'react'
import { NavLink, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { LogOut, Menu, ScrollText, Users, X } from 'lucide-react'
import { displayName, useAuth } from '../../context/AuthContext'
import { humanize, initials } from '../../utils/format'
import AdminAuditLogPage from './AdminAuditLogPage'
import AdminUsersPage from './AdminUsersPage'

const navItems = [
  { label: 'Users', icon: Users, to: '/admin/users' },
  { label: 'Audit log', icon: ScrollText, to: '/admin/audit-log' },
]

const pageMeta = {
  users: { title: 'Users', subtitle: 'Accounts, roles and access' },
  'audit-log': { title: 'Audit log', subtitle: 'Who did what, in which account' },
}

// The system administrator's area: user accounts and the audit trail across all owners.
function AdminPage() {
  const { user, signOut } = useAuth()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const name = displayName(user)
  const meta = pageMeta[location.pathname.split('/')[2]] || pageMeta.users

  return (
    <main className="min-h-screen bg-[var(--bg)] text-[var(--ink)]">
      <div className="proto-strip">
        <span>KODI - System Administration</span>

        <span className="proto-pill">{meta.title}</span>
      </div>

      <div className="flex min-h-screen pt-[34px]">
        <div
          className={`fixed inset-0 z-40 bg-black/40 transition lg:hidden ${
            sidebarOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
          }`}
          onClick={() => setSidebarOpen(false)}
        />

        <aside
          className={`fixed left-0 top-[34px] z-50 flex h-[calc(100vh-34px)] w-[236px] flex-col bg-[var(--sidebar)] text-[var(--sidebar-ink)] transition-transform lg:sticky lg:translate-x-0 ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="flex items-center gap-[10px] border-b border-[var(--sidebar-line)] px-5 py-[22px]">
            <div className="brand-mark">K</div>
            <div>
              <div className="font-display text-[16px] font-semibold text-white">Kodi</div>
              <div className="mt-[3px] text-[10px] uppercase tracking-[0.04em] text-[var(--sidebar-ink-soft)]">
                System admin
              </div>
            </div>

            <button
              onClick={() => setSidebarOpen(false)}
              className="ml-auto text-[var(--sidebar-ink-soft)] lg:hidden"
            >
              <X size={18} />
            </button>
          </div>

          <nav className="flex-1 overflow-y-auto px-3 py-[14px]">
            <div className="px-[10px] pb-[6px] pt-[14px] text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--sidebar-ink-soft)]">
              Administration
            </div>

            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) =>
                  `mb-[1px] flex w-full items-center gap-[10px] rounded-[8px] px-[10px] py-[9px] text-left text-[13px] font-medium transition ${
                    isActive
                      ? 'bg-[var(--accent)] text-white'
                      : 'text-[var(--sidebar-ink-soft)] hover:bg-[#26201A] hover:text-[var(--sidebar-ink)]'
                  }`
                }
              >
                <item.icon size={17} />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>

          <div className="border-t border-[var(--sidebar-line)] px-4 py-[14px]">
            <div className="flex items-center gap-[10px]">
              <div className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full bg-[var(--accent-soft)] font-display text-[12px] font-bold text-[var(--accent)]">
                {initials(name)}
              </div>
              <div className="min-w-0">
                <div className="truncate text-[12px] font-bold text-white">{name}</div>
                <div className="text-[10px] text-[var(--sidebar-ink-soft)]">{humanize(user.role)}</div>
              </div>

              <button
                type="button"
                onClick={signOut}
                title="Sign out"
                aria-label="Sign out"
                className="ml-auto flex h-8 w-8 shrink-0 items-center justify-center rounded-[6px] text-[var(--sidebar-ink-soft)] hover:bg-[#26201A] hover:text-white"
              >
                <LogOut size={18} />
              </button>
            </div>
          </div>
        </aside>

        <section className="min-w-0 flex-1">
          <header className="sticky top-[34px] z-30 flex h-[64px] items-center gap-4 border-b border-[var(--line)] bg-white px-4 sm:px-6">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="flex h-9 w-9 items-center justify-center rounded-[8px] border border-[var(--line)] text-[var(--ink-soft)] lg:hidden"
            >
              <Menu size={18} />
            </button>

            <div>
              <h2 className="font-display text-[16px] font-semibold">{meta.title}</h2>
              <p className="mt-[1px] text-[12px] text-[var(--ink-faint)]">{meta.subtitle}</p>
            </div>
          </header>

          <div className="h-[calc(100vh-98px)] overflow-y-auto px-4 py-6 sm:px-6 lg:px-[30px]">
            <Routes>
              <Route path="admin/users" element={<AdminUsersPage />} />
              <Route path="admin/audit-log" element={<AdminAuditLogPage />} />
              <Route path="*" element={<Navigate to="/admin/users" replace />} />
            </Routes>
          </div>
        </section>
      </div>
    </main>
  )
}

export default AdminPage
