import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Building2, Plus } from 'lucide-react'
import { listCaretakers } from '../../api/caretakers'
import {
  getSettings,
  listActivity,
  updateDefaults,
  updateNotifications,
  updateProfile,
} from '../../api/settings'
import { DataState, EmptyState, FormError } from '../../components/common/DataState'
import {
  Field,
  ModalBody,
  ModalFooter,
  ModalShell,
  SelectField,
  primaryButtonClass,
  secondaryButtonClass,
} from '../../components/common/Modal'
import StatusBadge from '../../components/common/StatusBadge'
import EditPropertyModal from '../../components/dashboard/EditPropertyModal'
import WaterRulesModal from '../../components/dashboard/WaterRulesModal'
import { useAuth } from '../../context/AuthContext'
import { useProperties } from '../../context/PropertiesContext'
import { useTheme } from '../../context/ThemeContext'
import { useApi } from '../../hooks/useApi'
import { formatDateTime, formatPhone, humanize, ordinal } from '../../utils/format'
import {
  RENT_DUE_DAYS,
  SERVICE_CHARGE_ACCOUNTS,
  THEME_MODES,
  optionLabel,
  paymentAccountTypeLabel,
  waterBillingLabel,
} from '../../utils/labels'

const tabs = [
  ['account', 'Account'],
  ['payments', 'Payment accounts'],
  ['water', 'Water rules'],
  ['users', 'Users & roles'],
  ['notifications', 'Notifications'],
  ['appearance', 'Appearance'],
]

const cardClass = 'overflow-hidden rounded-[10px] border border-[var(--line)] bg-[var(--surface)]'
const cardHeaderClass =
  'flex flex-wrap items-center justify-between gap-3 border-b border-[var(--line)] px-[18px] py-4'
const smallButtonClass = 'rounded-[8px] border border-[var(--line)] bg-[var(--surface)] px-4 py-2 text-[11px] font-bold'
const headRowClass =
  'bg-[var(--bg)] text-left text-[9px] uppercase tracking-[0.05em] text-[var(--ink-faint)]'

const missedReadingLabels = {
  carry_forward: "Carry forward previous month's units and flag for review",
  do_not_bill: 'Do not bill water until reading is submitted',
  estimate_average: 'Apply estimated average and flag for review',
}

// "Same day as rent is due", "5th of every month", "Last day of every month"
function waterBillingDayLabel(property) {
  if (property.water_billing_day === 'same_as_rent') return 'Same day as rent is due'
  if (property.water_billing_day === 'last_day_of_month') return 'Last day of every month'

  const day = Number(String(property.water_billing_day).match(/\d{1,2}/)?.[0])

  return day ? `${ordinal(day)} of every month` : property.water_billing_day
}

function SectionTitle({ title, helper }) {
  return (
    <div className="mb-[14px] flex flex-wrap items-center gap-3">
      <span className="text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--accent-ink)]">{title}</span>
      <span className="h-px flex-1 bg-[var(--line)]" />
      {helper ? <p className="basis-full text-[10px] text-[var(--ink-faint)]">{helper}</p> : null}
    </div>
  )
}

function DetailRow({ label, value }) {
  return (
    <div className="flex justify-between gap-4 border-b border-[var(--line-soft)] px-[18px] py-[11px] text-[12px] last:border-b-0">
      <span className="text-[var(--ink-soft)]">{label}</span>
      <span className="text-right font-bold">{value}</span>
    </div>
  )
}

function SettingsPage({ onAddProperty }) {
  const propertiesState = useProperties()
  const properties = propertiesState.data || []
  const [searchParams, setSearchParams] = useSearchParams()
  const [managePropertiesOpen, setManagePropertiesOpen] = useState(false)

  // The tab and the property live in the URL: /settings?tab=water&property=1
  const activeTab = tabs.some(([key]) => key === searchParams.get('tab'))
    ? searchParams.get('tab')
    : 'account'
  const selectedProperty =
    properties.find((property) => String(property.id) === searchParams.get('property')) ||
    properties[0]
  // Only these two tabs are about one property.
  const perProperty = activeTab === 'payments' || activeTab === 'water'

  function setParam(name, value) {
    const next = new URLSearchParams(searchParams)

    next.set(name, value)
    setSearchParams(next)
  }

  return (
    <>
      <div className="mb-7 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-[10px] text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--accent-ink)]">
            System
          </div>
          <h1 className="font-display text-[20px] font-semibold tracking-[-0.01em]">
            Settings
          </h1>
          <p className="mt-2 text-[12px] text-[var(--ink-soft)]">
            {perProperty && selectedProperty
              ? `Payment accounts and water rules for ${selectedProperty.name}.`
              : 'Your account, payment accounts, water rules and access control.'}
          </p>
        </div>

        <div className="flex flex-wrap gap-[10px]">
          {perProperty && selectedProperty ? (
            <select
              value={selectedProperty.id}
              onChange={(event) => setParam('property', event.target.value)}
              aria-label="Property"
              className="h-10 rounded-[8px] border border-[var(--line)] bg-[var(--surface)] px-3 text-[12px] font-bold outline-none"
            >
              {properties.map((property) => (
                <option key={property.id} value={property.id}>{property.name}</option>
              ))}
            </select>
          ) : null}

          <button
            onClick={() => setManagePropertiesOpen(true)}
            className="inline-flex items-center gap-2 rounded-[8px] border border-[var(--line)] bg-[var(--surface)] px-4 py-[10px] text-[12px] font-bold"
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
            onClick={() => setParam('tab', key)}
            className={`pb-[10px] text-[12px] font-bold ${
              activeTab === key
                ? 'border-b-2 border-[var(--accent)] text-[var(--accent-ink)]'
                : 'text-[var(--ink-faint)]'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {activeTab === 'account' ? <AccountTab /> : null}
      {activeTab === 'users' ? <UsersRolesTab /> : null}
      {activeTab === 'notifications' ? <NotificationsTab /> : null}
      {activeTab === 'appearance' ? <AppearanceTab /> : null}

      {perProperty ? (
        <DataState
          state={propertiesState}
          loadingLabel="Loading properties..."
          isEmpty={(data) => !data.length}
          empty={
            <section className={cardClass}>
              <EmptyState
                title="No properties yet"
                message="Add a property first; its payment accounts and water rules are set here."
              />
            </section>
          }
        >
          {() =>
            activeTab === 'payments' ? (
              <PaymentAccountsTab
                key={selectedProperty.id}
                property={selectedProperty}
                onSaved={propertiesState.reload}
              />
            ) : (
              <WaterRulesTab
                key={selectedProperty.id}
                property={selectedProperty}
                onSaved={propertiesState.reload}
              />
            )
          }
        </DataState>
      ) : null}

      {managePropertiesOpen ? (
        <ManagePropertiesModal
          properties={properties}
          selectedId={selectedProperty?.id}
          onClose={() => setManagePropertiesOpen(false)}
          onSwitch={(property) => {
            // Opens that property's settings on a tab that is about one property.
            setSearchParams({ tab: perProperty ? activeTab : 'payments', property: String(property.id) })
            setManagePropertiesOpen(false)
          }}
          onAddProperty={() => {
            setManagePropertiesOpen(false)
            onAddProperty()
          }}
        />
      ) : null}
    </>
  )
}

function AccountTab() {
  const settingsState = useApi('settings', getSettings)
  const activityState = useApi('settings-activity', () => listActivity(12))

  return (
    <div className="grid gap-4 xl:grid-cols-[1.6fr_1fr]">
      <section className="rounded-[10px] border border-[var(--line)] bg-[var(--surface)] p-[18px]">
        <DataState state={settingsState} loadingLabel="Loading your account...">
          {(settings) => (
            <AccountForm
              settings={settings}
              onSaved={() => {
                settingsState.reload()
                activityState.reload()
              }}
            />
          )}
        </DataState>
      </section>

      <section>
        <SectionTitle title="Audit log" helper="What you and your caretakers did most recently." />

        <DataState
          state={activityState}
          loadingLabel="Loading activity..."
          isEmpty={(logs) => !logs.length}
          empty={<EmptyState title="No activity yet" />}
        >
          {(logs) =>
            logs.map((log) => (
              <div
                key={log.id}
                className="flex justify-between gap-4 border-b border-[var(--line-soft)] py-[11px] text-[12px]"
              >
                <span className="text-[var(--ink-soft)]">
                  {/* "TENANT_MOVED_IN" -> "Tenant moved in" */}
                  {humanize(log.action.toLowerCase())}
                  {log.actor?.role === 'caretaker' ? (
                    <span className="block text-[10px] text-[var(--ink-faint)]">
                      by {log.actor.full_name || 'caretaker'}
                    </span>
                  ) : null}
                </span>
                <span className="whitespace-nowrap text-[var(--ink-faint)]">
                  {formatDateTime(log.created_at)}
                </span>
              </div>
            ))
          }
        </DataState>
      </section>
    </div>
  )
}

function AccountForm({ settings, onSaved }) {
  const { refreshUser } = useAuth()
  const { profile, defaults } = settings

  const [form, setForm] = useState({
    full_name: profile.full_name || '',
    email: profile.email || '',
    default_rent_due_day: String(defaults.default_rent_due_day),
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState(null)

  function setField(field) {
    return (event) => {
      setSaved(false)
      setForm((current) => ({ ...current, [field]: event.target.value }))
    }
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setSaving(true)
    setSaved(false)
    setError(null)

    const profileChanges = {
      ...(form.full_name.trim() !== (profile.full_name || '') ? { full_name: form.full_name.trim() } : {}),
      ...(form.email.trim() !== (profile.email || '') ? { email: form.email.trim() || null } : {}),
    }

    try {
      if (Object.keys(profileChanges).length) {
        await updateProfile(profileChanges)
        // The name is shown in the sidebar and the dashboard greeting.
        await refreshUser()
      }

      if (Number(form.default_rent_due_day) !== defaults.default_rent_due_day) {
        await updateDefaults({ default_rent_due_day: Number(form.default_rent_due_day) })
      }

      setSaved(true)
      onSaved()
    } catch (saveError) {
      setError(saveError)
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <SectionTitle title="Profile" />

      <div className="grid gap-[14px] sm:grid-cols-2">
        <Field
          label="Full name"
          value={form.full_name}
          onChange={setField('full_name')}
          required
          minLength={2}
        />
        <Field
          label="Phone number"
          value={formatPhone(profile.phone)}
          disabled
          hint="This is the number you sign in with, so it cannot be changed here."
        />
      </div>

      <div className="mt-[18px]">
        <Field
          label="Email (optional)"
          type="email"
          value={form.email}
          onChange={setField('email')}
          placeholder="e.g. you@example.com"
        />
      </div>

      <div className="mt-[28px]">
        <SectionTitle
          title="Rent defaults"
          helper="The rent due day offered when you add a new property. Each property keeps its own day and can still be edited."
        />
        <div className="max-w-[464px]">
          <SelectField
            label="Default rent due day"
            value={form.default_rent_due_day}
            onChange={setField('default_rent_due_day')}
            options={RENT_DUE_DAYS}
          />
        </div>
      </div>

      {error ? (
        <div className="mt-[14px]">
          <FormError error={error} />
        </div>
      ) : null}

      <div className="mt-[14px] flex items-center gap-3">
        <button type="submit" disabled={saving} className={primaryButtonClass}>
          {saving ? 'Saving...' : 'Save changes'}
        </button>
        {saved ? <span className="text-[11px] font-bold text-[var(--success)]">Saved</span> : null}
      </div>
    </form>
  )
}

function PaymentAccountsTab({ property, onSaved }) {
  const [editing, setEditing] = useState(false)

  const accounts = [
    ['Rent', property.rent_account, 'Not connected'],
    ['Water', property.water_account, 'No separate account - paid through the rent account'],
    ['Electricity', property.electricity_account, 'No separate account - paid through the rent account'],
    ['Service charges', property.service_account, 'No separate account'],
  ]

  return (
    <section className={cardClass}>
      <div className={cardHeaderClass}>
        <div>
          <h3 className="text-[12px] font-bold">Accounts receiving payments - {property.name}</h3>
          <p className="mt-[3px] text-[10px] text-[var(--ink-faint)]">
            Each account is an M-Pesa PayBill or Till number connected through Safaricom Daraja.
          </p>
        </div>
        <button onClick={() => setEditing(true)} className={smallButtonClass}>
          Change payment accounts
        </button>
      </div>

      <div className="space-y-[10px] p-[18px]">
        {accounts.map(([name, account, missing]) => (
          <div
            key={name}
            className="rounded-[8px] border border-[var(--line)] px-4 py-4"
          >
            <div className="flex justify-between gap-3">
              <div>
                <h3 className="text-[13px] font-bold">
                  {name} - {account ? paymentAccountTypeLabel(account) : 'no account'}
                </h3>
                <p className="mt-1 text-[11px] text-[var(--ink-faint)]">
                  {account
                    ? [
                        `${account.account_type === 'till' ? 'Till' : 'Paybill'} ${account.business_number}`,
                        account.display_name || account.account_name,
                        humanize(account.environment, ''),
                      ]
                        .filter(Boolean)
                        .join(' - ')
                    : missing}
                </p>
              </div>
              <StatusBadge tone={account ? 'success' : 'neutral'}>
                {account ? 'Connected' : 'Not set'}
              </StatusBadge>
            </div>
          </div>
        ))}

        <p className="pt-1 text-[11px] leading-[1.5] text-[var(--ink-faint)]">
          Service charges and repairs are paid into:{' '}
          <strong>{optionLabel(SERVICE_CHARGE_ACCOUNTS, property.service_charge_account).toLowerCase()}</strong>.
          To connect, change or remove an account, use &quot;Change payment
          accounts&quot;.
        </p>
      </div>

      <EditPropertyModal
        open={editing}
        property={property}
        onClose={() => setEditing(false)}
        onSaved={onSaved}
      />
    </section>
  )
}

function WaterRulesTab({ property, onSaved }) {
  const [editing, setEditing] = useState(false)

  return (
    <section className={cardClass}>
      <div className={cardHeaderClass}>
        <h3 className="text-[12px] font-bold">Water billing rules - {property.name}</h3>
        <button onClick={() => setEditing(true)} className={smallButtonClass}>
          Edit rules
        </button>
      </div>

      <DetailRow label="Billing method and rate" value={waterBillingLabel(property)} />
      <DetailRow label="Billing day" value={waterBillingDayLabel(property)} />
      <DetailRow
        label="Reading due from caretaker"
        value={`Within ${property.water_reading_due_days} days of billing day`}
      />
      <DetailRow
        label="If a reading is missed"
        value={
          missedReadingLabels[property.water_missed_reading_action] ||
          humanize(property.water_missed_reading_action)
        }
      />

      <p className="px-[18px] py-3 text-[10px] leading-[1.5] text-[var(--ink-faint)]">
        These are the property&apos;s defaults; each unit can have its own
        water billing on the Units page. A reading lower than the previous
        one is always flagged for your review before the tenant is billed.
      </p>

      <WaterRulesModal
        open={editing}
        property={property}
        onClose={() => setEditing(false)}
        onSaved={onSaved}
      />
    </section>
  )
}

// The owner, and every caretaker with the properties they look after.
function UsersRolesTab() {
  const { user } = useAuth()
  const caretakersState = useApi('caretakers', listCaretakers)

  // The API returns one row per caretaker-and-property; show each caretaker once.
  const caretakers = new Map()

  for (const row of caretakersState.data || []) {
    if (!caretakers.has(row.caretaker_id)) {
      caretakers.set(row.caretaker_id, { ...row, properties: [] })
    }

    if (row.assignment_status === 'active') {
      caretakers.get(row.caretaker_id).properties.push(row.property_name)
    }
  }

  return (
    <section className={cardClass}>
      <div className={cardHeaderClass}>
        <div>
          <h3 className="text-[12px] font-bold">People with access</h3>
          <p className="mt-[3px] text-[10px] text-[var(--ink-faint)]">
            You, and the caretakers you have added. Caretakers are managed on the Caretakers page.
          </p>
        </div>
        <Link
          to="/caretakers"
          className="inline-flex items-center gap-2 rounded-[8px] border border-[var(--accent)] bg-[var(--accent)] px-4 py-[10px] text-[12px] font-bold text-white"
        >
          <Plus size={15} />
          Add caretaker
        </Link>
      </div>

      <DataState state={caretakersState} loadingLabel="Loading people...">
        {() => (
          <div className="overflow-x-auto">
            <table className="min-w-[820px] w-full border-collapse">
              <thead>
                <tr className={headRowClass}>
                  <th className="px-[18px] py-[10px]">Name</th>
                  <th className="px-[18px] py-[10px]">Role</th>
                  <th className="px-[18px] py-[10px]">Access</th>
                  <th className="px-[18px] py-[10px]">Status</th>
                  <th className="px-[18px] py-[10px]"></th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-[var(--line-soft)]">
                  <td className="px-[18px] py-[13px]">
                    <div className="text-[12px] font-bold">
                      {[user.first_name, user.last_name].filter(Boolean).join(' ') || 'You'}
                    </div>
                    <div className="text-[10px] text-[var(--ink-faint)]">{formatPhone(user.phone)}</div>
                  </td>
                  <td className="px-[18px] py-[13px]"><StatusBadge tone="info">Owner</StatusBadge></td>
                  <td className="px-[18px] py-[13px] text-[12px]">All properties</td>
                  <td className="px-[18px] py-[13px]"><StatusBadge tone="success">Active</StatusBadge></td>
                  <td className="px-[18px] py-[13px] text-[12px]">-</td>
                </tr>

                {[...caretakers.values()].map((caretaker) => {
                  const suspended = caretaker.user_status === 'suspended'
                  const active = caretaker.properties.length && caretaker.user_status === 'active'

                  return (
                    <tr key={caretaker.caretaker_id} className="border-b border-[var(--line-soft)] last:border-b-0">
                      <td className="px-[18px] py-[13px]">
                        <div className="text-[12px] font-bold">{caretaker.full_name}</div>
                        <div className="text-[10px] text-[var(--ink-faint)]">{formatPhone(caretaker.phone)}</div>
                      </td>
                      <td className="px-[18px] py-[13px]"><StatusBadge>Caretaker</StatusBadge></td>
                      <td className="px-[18px] py-[13px] text-[12px]">
                        {caretaker.properties.join(', ') || 'No property'}
                      </td>
                      <td className="px-[18px] py-[13px]">
                        <StatusBadge tone={suspended ? 'warning' : active ? 'success' : 'neutral'}>
                          {suspended ? 'Suspended' : active ? 'Active' : 'Inactive'}
                        </StatusBadge>
                      </td>
                      <td className="px-[18px] py-[13px]">
                        <Link to="/caretakers" className="rounded-[8px] border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-[11px] font-bold">
                          Manage
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </DataState>
    </section>
  )
}

/*
  [setting, label, what it does]. `active: false` switches are saved by the
  backend but nothing acts on them yet, so they are shown and cannot be ticked.
*/
const smsAlerts = [
  {
    key: 'alert_suspicious_water',
    label: 'Alert me on flagged / suspicious water readings',
    hint: 'You get an SMS when a submitted reading is lower than the previous one.',
    active: true,
  },
  {
    key: 'remind_water_readings',
    label: 'Remind caretakers to submit water readings',
    hint: "On each property's water billing day, its caretaker gets one SMS if readings for the month are still missing.",
    active: true,
  },
  {
    key: 'notify_payment_received',
    label: 'Notify me when a payment is received',
    active: false,
  },
  {
    key: 'auto_rent_reminder',
    label: 'Send tenants a rent due reminder automatically',
    hint: 'Rent reminders are sent by hand from the SMS centre for now.',
    active: false,
  },
]

const emailSummaries = [
  { key: 'weekly_collection_summary', label: 'Weekly collection summary', active: false },
  { key: 'monthly_profit_report', label: 'Monthly profit & expense report', active: false },
]

function NotificationsTab() {
  const settingsState = useApi('settings', getSettings)

  return (
    <section className="rounded-[10px] border border-[var(--line)] bg-[var(--surface)] p-[18px]">
      <DataState state={settingsState} loadingLabel="Loading preferences...">
        {(settings) => (
          <NotificationsForm notifications={settings.notifications} onSaved={settingsState.reload} />
        )}
      </DataState>
    </section>
  )
}

function NotificationsForm({ notifications, onSaved }) {
  const [prefs, setPrefs] = useState(
    Object.fromEntries(
      smsAlerts.filter((item) => item.active).map((item) => [item.key, Boolean(notifications[item.key])])
    )
  )
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState(null)

  async function handleSubmit(event) {
    event.preventDefault()
    setSaving(true)
    setSaved(false)
    setError(null)

    try {
      await updateNotifications(prefs)
      setSaved(true)
      onSaved()
    } catch (saveError) {
      setError(saveError)
    } finally {
      setSaving(false)
    }
  }

  function renderCheck(item) {
    return (
      <label
        key={item.key}
        className={`mb-[12px] flex items-start gap-3 text-[12px] font-medium ${item.active ? '' : 'text-[var(--ink-faint)]'}`}
      >
        <input
          type="checkbox"
          checked={item.active ? prefs[item.key] : false}
          disabled={!item.active}
          onChange={() => {
            setSaved(false)
            setPrefs((current) => ({ ...current, [item.key]: !current[item.key] }))
          }}
          className="mt-[2px] h-[13px] w-[13px]"
        />
        <span>
          {item.label}
          {item.active ? null : (
            <span className="ml-2 rounded-full bg-[var(--line-soft)] px-[8px] py-[2px] text-[9px] font-bold uppercase text-[var(--ink-soft)]">
              Not active yet
            </span>
          )}
          {item.hint ? (
            <span className="mt-[2px] block text-[10px] font-normal text-[var(--ink-faint)]">{item.hint}</span>
          ) : null}
        </span>
      </label>
    )
  }

  return (
    <form onSubmit={handleSubmit}>
      <SectionTitle title="SMS alerts" helper="Each SMS sent appears in the SMS centre and is charged like any other message." />
      {smsAlerts.map(renderCheck)}

      <div className="mt-[22px]">
        <SectionTitle title="Email summaries" helper="Kodi does not send email yet." />
        {emailSummaries.map(renderCheck)}
      </div>

      {error ? (
        <div className="mt-[14px]">
          <FormError error={error} />
        </div>
      ) : null}

      <div className="mt-[14px] flex items-center gap-3">
        <button type="submit" disabled={saving} className={primaryButtonClass}>
          {saving ? 'Saving...' : 'Save preferences'}
        </button>
        {saved ? <span className="text-[11px] font-bold text-[var(--success)]">Saved</span> : null}
      </div>
    </form>
  )
}

const themeHints = {
  light: 'White pages and a white side menu.',
  dark: 'Dark pages and a dark side menu.',
  system: 'Light or dark, whichever this phone or computer is set to.',
}

// Saved in this browser as soon as it is clicked, so there is no Save button.
function AppearanceTab() {
  const { mode, shown, setMode } = useTheme()

  return (
    <div>
      <SectionTitle
        title="Light or dark"
        helper="This is your own choice on this device. It is not shared with other users, and another phone or computer keeps its own."
      />

      {THEME_MODES.map(([value, label]) => (
        <label key={value} className="mb-[12px] flex items-start gap-3 text-[12px] font-medium">
          <input
            type="radio"
            name="appearance"
            checked={mode === value}
            onChange={() => setMode(value)}
            className="mt-[2px] h-[13px] w-[13px]"
          />
          <span>
            {label}
            <span className="mt-[2px] block text-[10px] font-normal text-[var(--ink-faint)]">
              {themeHints[value]}
              {value === 'system' && mode === 'system' ? ` Showing ${shown} now.` : ''}
            </span>
          </span>
        </label>
      ))}
    </div>
  )
}

function ManagePropertiesModal({ properties, selectedId, onClose, onSwitch, onAddProperty }) {
  const navigate = useNavigate()

  return (
    <ModalShell title="Manage properties" onClose={onClose}>
      <ModalBody>
        <p className="mb-[16px] text-[11px] leading-[1.5] text-[var(--ink-faint)]">
          Each property has its own units, tenants, caretaker, payment
          accounts and water rules. &quot;Switch&quot; shows that
          property&apos;s settings here; &quot;View&quot; opens the property.
        </p>

        {properties.length ? (
          <div className="overflow-x-auto">
            <table className="min-w-[560px] w-full border-collapse">
              <thead>
                <tr className={headRowClass}>
                  <th className="px-[14px] py-[10px]">Property</th>
                  <th className="px-[14px] py-[10px]">Units</th>
                  <th className="px-[14px] py-[10px]">Caretaker</th>
                  <th className="px-[14px] py-[10px]"></th>
                </tr>
              </thead>
              <tbody>
                {properties.map((property) => (
                  <tr key={property.id} className="border-b border-[var(--line-soft)] last:border-b-0">
                    <td className="px-[14px] py-[12px]">
                      <div className="text-[12px] font-bold">{property.name}</div>
                      <div className="text-[10px] text-[var(--ink-faint)]">{property.location}</div>
                    </td>
                    <td className="px-[14px] py-[12px] text-[12px]">{property.summary.total_units}</td>
                    <td className="px-[14px] py-[12px] text-[12px]">
                      {property.caretaker?.full_name || 'Not assigned'}
                    </td>
                    <td className="whitespace-nowrap px-[14px] py-[12px] text-right">
                      <button
                        onClick={() => onSwitch(property)}
                        disabled={property.id === selectedId}
                        className="mr-2 rounded-[8px] border border-[var(--line)] px-3 py-2 text-[11px] font-bold disabled:opacity-50"
                      >
                        {property.id === selectedId ? 'Selected' : 'Switch'}
                      </button>
                      <button
                        onClick={() => navigate(`/properties/${property.id}`)}
                        className="rounded-[8px] border border-[var(--line)] px-3 py-2 text-[11px] font-bold"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState title="No properties yet" message="Add your first property to start." />
        )}
      </ModalBody>

      <ModalFooter>
        <button onClick={onClose} className={secondaryButtonClass}>
          Close
        </button>
        <button onClick={onAddProperty} className={primaryButtonClass}>
          + Add property
        </button>
      </ModalFooter>
    </ModalShell>
  )
}

export default SettingsPage
