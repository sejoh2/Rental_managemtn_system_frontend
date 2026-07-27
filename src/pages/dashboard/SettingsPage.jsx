import { useState } from 'react'
import { Building2, Plus, X } from 'lucide-react'

const properties = [
  { name: 'Green View Apartments', location: 'Kilimani, Nairobi', units: 64, caretaker: 'Peter Mwangi' },
  { name: 'Sunrise Bedsitters', location: 'Roysambu, Nairobi', units: 40, caretaker: 'Ruth Chebet' },
  { name: 'Riverside Court', location: 'South B, Nairobi', units: 24, caretaker: 'James Odhiambo' },
]

const users = [
  { name: 'Mary Wanjiru', contact: '+254 712 345 678', role: 'Owner', access: 'All properties', status: 'Active' },
  { name: 'Peter Mwangi', contact: '0700 112 233', role: 'Caretaker', access: 'Green View Apartments', status: 'Active' },
  { name: 'John Kamau', contact: 'john.kamau@email.com', role: 'Accountant - view only', access: 'All properties', status: 'Active' },
]

function SettingsPage({ onAddProperty }) {
  const [activeTab, setActiveTab] = useState('account')
  const [selectedProperty, setSelectedProperty] = useState('Green View Apartments')
  const [waterRulesOpen, setWaterRulesOpen] = useState(false)
  const [inviteOpen, setInviteOpen] = useState(false)
  const [managePropertiesOpen, setManagePropertiesOpen] = useState(false)

  const tabs = [
    ['account', 'Account'],
    ['payments', 'Payment accounts'],
    ['water', 'Water rules'],
    ['users', 'Users & roles'],
    ['notifications', 'Notifications'],
  ]

  return (
    <>
      <div className="mb-7 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-[10px] text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--accent)]">
            System
          </div>
          <h1 className="font-display text-[20px] font-semibold tracking-[-0.01em]">
            Settings
          </h1>
          <p className="mt-2 text-[12px] text-[var(--ink-soft)]">
            Payment accounts, water rules and access control for {selectedProperty}.
          </p>
        </div>

        <div className="flex flex-wrap gap-[10px]">
          <select
            value={selectedProperty}
            onChange={(event) => setSelectedProperty(event.target.value)}
            className="h-10 rounded-[8px] border border-[var(--line)] bg-white px-3 text-[12px] font-bold outline-none"
          >
            {properties.map((property) => (
              <option key={property.name}>{property.name}</option>
            ))}
          </select>

          <button
            onClick={() => setManagePropertiesOpen(true)}
            className="inline-flex items-center gap-2 rounded-[8px] border border-[var(--line)] bg-white px-4 py-[10px] text-[12px] font-bold"
          >
            <Building2 size={15} />
            Manage properties
          </button>
        </div>
      </div>

      <div className="mb-[18px] flex flex-wrap gap-5 border-b border-[var(--line)]">
        {tabs.map(([key, label]) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`pb-[10px] text-[12px] font-bold ${
              activeTab === key
                ? 'border-b-2 border-[var(--accent)] text-[var(--accent)]'
                : 'text-[var(--ink-faint)]'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {activeTab === 'account' ? <AccountTab /> : null}
      {activeTab === 'payments' ? <PaymentAccountsTab /> : null}
      {activeTab === 'water' ? <WaterRulesTab onEditRules={() => setWaterRulesOpen(true)} /> : null}
      {activeTab === 'users' ? <UsersRolesTab onInvite={() => setInviteOpen(true)} /> : null}
      {activeTab === 'notifications' ? <NotificationsTab /> : null}

      <WaterRulesModal open={waterRulesOpen} onClose={() => setWaterRulesOpen(false)} />
      <InviteUserModal open={inviteOpen} onClose={() => setInviteOpen(false)} />
      <ManagePropertiesModal
        open={managePropertiesOpen}
        onClose={() => setManagePropertiesOpen(false)}
        onAddProperty={() => {
          setManagePropertiesOpen(false)
          onAddProperty()
        }}
      />
    </>
  )
}

function AccountTab() {
  return (
    <div className="grid gap-4 xl:grid-cols-[1.6fr_1fr]">
      <section className="rounded-[10px] border border-[var(--line)] bg-white p-[18px]">
        <SectionTitle title="Profile" />

        <div className="grid gap-[14px] sm:grid-cols-2">
          <Field label="Full name" defaultValue="Mary Wanjiru" />
          <Field label="Phone number" defaultValue="+254 712 345 678" />
        </div>

        <div className="mt-[18px]">
          <Field label="Email (optional)" defaultValue="mary.wanjiru@email.com" />
        </div>

        <div className="mt-[28px]">
          <SectionTitle title="Rent defaults" helper="Applies to new units across all properties - each property can still be edited individually." />
          <div className="max-w-[464px]">
            <Field label="Default rent due day" defaultValue="5th" />
          </div>
        </div>

        <button
          onClick={() => window.alert('Settings saved successfully.')}
          className="mt-[14px] rounded-[8px] border border-[var(--accent)] bg-[var(--accent)] px-5 py-[10px] text-[12px] font-bold text-white"
        >
          Save changes
        </button>
      </section>

      <section>
        <SectionTitle title="Audit log" />
        {[
          ['Tenant added - H03', 'Today, 9:22 AM'],
          ['Rent edited - H12', 'Yesterday'],
          ['Caretaker added', '3 Jul'],
        ].map(([event, time]) => (
          <div key={event} className="flex justify-between border-b border-[var(--line-soft)] py-[11px] text-[12px]">
            <span className="text-[var(--ink-soft)]">{event}</span>
            <span className="text-[var(--ink-faint)]">{time}</span>
          </div>
        ))}
      </section>
    </div>
  )
}

function PaymentAccountsTab() {
  return (
    <div className="grid gap-4 xl:grid-cols-[1.6fr_1fr]">
      <section className="overflow-hidden rounded-[10px] border border-[var(--line)] bg-white">
        <div className="border-b border-[var(--line)] px-[18px] py-4">
          <h3 className="text-[12px] font-bold">Accounts receiving payments</h3>
        </div>

        <div className="space-y-[10px] p-[18px]">
          <PaymentAccount title="Rent - M-Pesa Paybill" subtitle="Business no. 400200 - Acc. GREENVIEW - Green View Rent" tag="Rent" />
          <PaymentAccount title="Water - Bank account" subtitle="Equity Bank - **4471 - Green View Water" tag="Water" blue />
          <button className="rounded-[8px] border border-[var(--line)] bg-white px-4 py-2 text-[11px] font-bold">
            + Add payment account
          </button>
        </div>
      </section>

      <div className="space-y-4">
        <EditAccountCard title="Edit rent account" rent />
        <EditAccountCard title="Edit water account" />
      </div>
    </div>
  )
}

function WaterRulesTab({ onEditRules }) {
  return (
    <section className="overflow-hidden rounded-[10px] border border-[var(--line)] bg-white">
      <div className="flex items-center justify-between border-b border-[var(--line)] px-[18px] py-4">
        <h3 className="text-[12px] font-bold">Water billing rules</h3>
        <button
          onClick={onEditRules}
          className="rounded-[8px] border border-[var(--line)] bg-white px-4 py-2 text-[11px] font-bold"
        >
          Edit rules
        </button>
      </div>

      {[
        ['Billing method', 'Per-unit metered'],
        ['Rate', 'KES 100 / unit'],
        ['Billing day', 'Same day as rent is billed'],
        ['Reading due from caretaker', 'Within 3 days of billing day'],
        ['If a reading is missed', "Carry forward previous month's units and flag for review"],
      ].map(([label, value]) => (
        <div key={label} className="flex justify-between border-b border-[var(--line-soft)] px-[18px] py-[11px] text-[12px] last:border-b-0">
          <span className="text-[var(--ink-soft)]">{label}</span>
          <span className="font-bold">{value}</span>
        </div>
      ))}
    </section>
  )
}

function UsersRolesTab({ onInvite }) {
  return (
    <section className="overflow-hidden rounded-[10px] border border-[var(--line)] bg-white">
      <div className="flex items-center justify-between border-b border-[var(--line)] px-[18px] py-4">
        <h3 className="text-[12px] font-bold">People with access</h3>
        <button
          onClick={onInvite}
          className="inline-flex items-center gap-2 rounded-[8px] border border-[var(--accent)] bg-[var(--accent)] px-4 py-[10px] text-[12px] font-bold text-white"
        >
          <Plus size={15} />
          Invite user
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-[820px] w-full border-collapse">
          <thead>
            <tr className="bg-[var(--bg)] text-left text-[9px] uppercase tracking-[0.05em] text-[var(--ink-faint)]">
              <th className="px-[18px] py-[10px]">Name</th>
              <th className="px-[18px] py-[10px]">Role</th>
              <th className="px-[18px] py-[10px]">Access</th>
              <th className="px-[18px] py-[10px]">Status</th>
              <th className="px-[18px] py-[10px]"></th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.name} className="border-b border-[var(--line-soft)] last:border-b-0">
                <td className="px-[18px] py-[13px]">
                  <div className="text-[12px] font-bold">{user.name}</div>
                  <div className="text-[10px] text-[var(--ink-faint)]">{user.contact}</div>
                </td>
                <td className="px-[18px] py-[13px]"><Badge>{user.role}</Badge></td>
                <td className="px-[18px] py-[13px] text-[12px]">{user.access}</td>
                <td className="px-[18px] py-[13px]"><Badge green>{user.status}</Badge></td>
                <td className="px-[18px] py-[13px]">
                  {user.role === 'Owner' ? '-' : (
                    <button className="rounded-[8px] border border-[var(--line)] bg-white px-3 py-2 text-[11px] font-bold">
                      {user.role.includes('Accountant') ? 'Remove' : 'Manage'}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

function NotificationsTab() {
  const [prefs, setPrefs] = useState({
    payment: true,
    rentReminder: true,
    waterReminder: true,
    suspiciousWater: false,
    weekly: true,
    monthly: false,
  })

  function toggle(key) {
    setPrefs((current) => ({ ...current, [key]: !current[key] }))
  }

  return (
    <section className="rounded-[10px] border border-[var(--line)] bg-white p-[18px]">
      <SectionTitle title="SMS alerts" />
      <Check label="Notify me when a payment is received" checked={prefs.payment} onChange={() => toggle('payment')} />
      <Check label="Send tenants a rent due reminder automatically" checked={prefs.rentReminder} onChange={() => toggle('rentReminder')} />
      <Check label="Remind caretakers to submit water readings" checked={prefs.waterReminder} onChange={() => toggle('waterReminder')} />
      <Check label="Alert me on flagged / suspicious water readings" checked={prefs.suspiciousWater} onChange={() => toggle('suspiciousWater')} />

      <div className="mt-[22px]">
        <SectionTitle title="Email summaries" />
        <Check label="Weekly collection summary" checked={prefs.weekly} onChange={() => toggle('weekly')} />
        <Check label="Monthly profit & expense report" checked={prefs.monthly} onChange={() => toggle('monthly')} />
      </div>

      <button
        onClick={() => window.alert('Notification preferences saved successfully.')}
        className="mt-[14px] rounded-[8px] border border-[var(--accent)] bg-[var(--accent)] px-5 py-[10px] text-[12px] font-bold text-white"
      >
        Save preferences
      </button>
    </section>
  )
}

function ManagePropertiesModal({ open, onClose, onAddProperty }) {
  if (!open) return null

  return (
    <ModalShell title="Manage properties" onClose={onClose}>
      <div className="px-[22px] py-[22px]">
        <p className="mb-[16px] text-[11px] leading-[1.5] text-[var(--ink-faint)]">
          Each property has its own units, tenants, caretaker, payment accounts and water rules.
        </p>

        <div className="overflow-x-auto">
          <table className="min-w-[560px] w-full border-collapse">
            <thead>
              <tr className="bg-[var(--bg)] text-left text-[9px] uppercase tracking-[0.05em] text-[var(--ink-faint)]">
                <th className="px-[14px] py-[10px]">Property</th>
                <th className="px-[14px] py-[10px]">Units</th>
                <th className="px-[14px] py-[10px]">Caretaker</th>
                <th className="px-[14px] py-[10px]"></th>
              </tr>
            </thead>
            <tbody>
              {properties.map((property) => (
                <tr key={property.name} className="border-b border-[var(--line-soft)]">
                  <td className="px-[14px] py-[12px]">
                    <div className="text-[12px] font-bold">{property.name}</div>
                    <div className="text-[10px] text-[var(--ink-faint)]">{property.location}</div>
                  </td>
                  <td className="px-[14px] py-[12px] text-[12px]">{property.units}</td>
                  <td className="px-[14px] py-[12px] text-[12px]">{property.caretaker}</td>
                  <td className="px-[14px] py-[12px]">
                    <button className="mr-2 rounded-[8px] border border-[var(--line)] px-3 py-2 text-[11px] font-bold">Switch</button>
                    <button className="rounded-[8px] border border-[var(--line)] px-3 py-2 text-[11px] font-bold">View</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <ModalFooter>
        <button onClick={onClose} className="rounded-[8px] border border-[var(--line)] bg-white px-5 py-[10px] text-[12px] font-bold">
          Close
        </button>
        <button onClick={onAddProperty} className="rounded-[8px] border border-[var(--accent)] bg-[var(--accent)] px-5 py-[10px] text-[12px] font-bold text-white">
          + Add property
        </button>
      </ModalFooter>
    </ModalShell>
  )
}

function WaterRulesModal({ open, onClose }) {
  if (!open) return null

  return (
    <ModalShell title="Water billing rules" onClose={onClose}>
      <form onSubmit={(event) => {
        event.preventDefault()
        window.alert('Water rules saved successfully.')
        onClose()
      }}>
        <div className="px-[22px] py-[22px]">
          <p className="mb-[18px] text-[11px] leading-[1.5] text-[var(--ink-faint)]">
            Set how water is billed for each property. Once a caretaker submits a meter reading, Kodi uses these rules to calculate the bill automatically.
          </p>

          <SelectField label="Property" options={['All 3 properties', 'Green View Apartments', 'Sunrise Bedsitters', 'Riverside Court']} />
          <SelectField label="Billing method" options={['Per-unit metered - bill by consumption', 'Flat monthly charge', 'Included in rent']} />
          <div className="grid gap-[14px] sm:grid-cols-2">
            <Field label="Rate per unit (KES)" placeholder="e.g. 100" />
            <SelectField label="Billing day" options={['Same day as rent is billed', '1st of every month', '5th of every month']} />
          </div>
          <SelectField label="Reading due from caretaker" options={['Within 3 days of billing day', 'Within 5 days of billing day']} />
          <SelectField label="If a reading is missed" options={["Carry forward previous month's units and flag for review", 'Do not bill until submitted']} />

          <div className="rounded-[8px] border border-[var(--line)] border-l-2 border-l-[var(--accent-soft-line)] px-4 py-4">
            <h3 className="text-[14px] font-bold">Flag suspicious readings</h3>
            <p className="mt-1 text-[11px] text-[var(--ink-faint)]">
              Kodi already flags any reading lower than the previous one so you can catch entry errors before a tenant is billed.
            </p>
          </div>
        </div>

        <ModalFooter>
          <button type="button" onClick={onClose} className="rounded-[8px] border border-[var(--line)] bg-white px-5 py-[10px] text-[12px] font-bold">
            Cancel
          </button>
          <button className="rounded-[8px] border border-[var(--accent)] bg-[var(--accent)] px-5 py-[10px] text-[12px] font-bold text-white">
            Save rules
          </button>
        </ModalFooter>
      </form>
    </ModalShell>
  )
}

function InviteUserModal({ open, onClose }) {
  if (!open) return null

  return (
    <ModalShell title="Invite user" onClose={onClose}>
      <form onSubmit={(event) => {
        event.preventDefault()
        window.alert('User invite sent successfully.')
        onClose()
      }}>
        <div className="space-y-[18px] px-[22px] py-[22px]">
          <Field label="Full name" placeholder="e.g. John Kamau" />
          <Field label="Phone or email" placeholder="e.g. john.kamau@email.com" />
          <SelectField label="Role" options={['Manager - full access, all properties', 'Accountant - view only', 'Caretaker']} />
          <SelectField label="Property access" options={['All properties', 'Green View Apartments', 'Sunrise Bedsitters', 'Riverside Court']} />
          <p className="text-[11px] text-[var(--ink-faint)]">
            They will receive a link to sign in with their phone number or email - no password to set up.
          </p>
        </div>

        <ModalFooter>
          <button type="button" onClick={onClose} className="rounded-[8px] border border-[var(--line)] bg-white px-5 py-[10px] text-[12px] font-bold">
            Cancel
          </button>
          <button className="rounded-[8px] border border-[var(--accent)] bg-[var(--accent)] px-5 py-[10px] text-[12px] font-bold text-white">
            Send invite
          </button>
        </ModalFooter>
      </form>
    </ModalShell>
  )
}

function EditAccountCard({ title, rent }) {
  return (
    <section className="rounded-[10px] border border-[var(--line)] bg-white p-[18px]">
      <SectionTitle title={title} />
      <SelectField label="Type" options={rent ? ['M-Pesa Paybill', 'Bank account'] : ['Bank account', 'M-Pesa Paybill']} />
      <div className="grid gap-[14px] sm:grid-cols-2">
        <Field label={rent ? 'Business number' : 'Bank name'} defaultValue={rent ? '400200' : 'Equity Bank'} />
        <Field label="Account number" defaultValue={rent ? 'GREENVIEW' : '0140294471'} />
      </div>
      <div className="mt-[14px]">
        <Field label="Account label" defaultValue={rent ? 'Green View Rent' : 'Green View Water'} />
      </div>
      <button
        onClick={() => window.alert('Payment account saved successfully.')}
        className="mt-[14px] rounded-[8px] border border-[var(--accent)] bg-[var(--accent)] px-5 py-[10px] text-[12px] font-bold text-white"
      >
        Save
      </button>
    </section>
  )
}

function PaymentAccount({ title, subtitle, tag, blue }) {
  return (
    <div className="rounded-[8px] border border-[var(--line)] border-l-2 border-l-[var(--accent-soft-line)] px-4 py-4">
      <div className="flex justify-between gap-3">
        <div>
          <h3 className="text-[16px] font-bold">{title}</h3>
          <p className="mt-1 text-[11px] text-[var(--ink-faint)]">{subtitle}</p>
        </div>
        <Badge green={blue}>{tag}</Badge>
      </div>
    </div>
  )
}

function Field({ label, placeholder, defaultValue }) {
  return (
    <div>
      <label className="mb-2 block text-[11px] font-bold">{label}</label>
      <input
        placeholder={placeholder}
        defaultValue={defaultValue}
        className="h-10 w-full rounded-[8px] border border-[var(--line)] bg-white px-3 text-[12px] outline-none placeholder:text-[var(--ink-faint)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)]"
      />
    </div>
  )
}

function SelectField({ label, options }) {
  return (
    <div className="mb-[18px]">
      <label className="mb-2 block text-[11px] font-bold">{label}</label>
      <select className="h-10 w-full rounded-[8px] border border-[var(--line)] bg-white px-3 text-[12px] outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)]">
        {options.map((option) => <option key={option}>{option}</option>)}
      </select>
    </div>
  )
}

function Check({ label, checked, onChange }) {
  return (
    <label className="mb-[12px] flex items-center gap-3 text-[12px] font-medium">
      <input type="checkbox" checked={checked} onChange={onChange} className="h-[13px] w-[13px]" />
      {label}
    </label>
  )
}

function SectionTitle({ title, helper }) {
  return (
    <div className="mb-[14px] flex items-center gap-3">
      <span className="text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--accent)]">{title}</span>
      <span className="h-px flex-1 bg-[var(--line)]" />
      {helper ? <p className="basis-full text-[10px] text-[var(--ink-faint)]">{helper}</p> : null}
    </div>
  )
}

function Badge({ children, green }) {
  return (
    <span className={`inline-flex items-center gap-[6px] rounded-full px-[9px] py-[3px] text-[9px] font-bold ${
      green ? 'bg-[#E6EDF4] text-[#3C5C82]' : 'bg-[var(--accent-soft)] text-[var(--accent-hover)]'
    }`}>
      <span className="h-[6px] w-[6px] rounded-full bg-current" />
      {children}
    </span>
  )
}

function ModalShell({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/45 px-4 py-8">
      <div className="w-full max-w-[640px] overflow-hidden rounded-[14px] bg-white shadow-[0_24px_80px_rgba(0,0,0,0.28)]">
        <div className="flex items-center justify-between border-b border-[var(--line)] px-[22px] py-[18px]">
          <h2 className="font-display text-[15px] font-semibold">{title}</h2>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--line-soft)] text-[var(--ink-soft)]">
            <X size={15} />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

function ModalFooter({ children }) {
  return (
    <div className="flex justify-end gap-[10px] border-t border-[var(--line)] px-[22px] py-[16px]">
      {children}
    </div>
  )
}

export default SettingsPage