import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Plus, Search } from 'lucide-react'
import {
  activateUser,
  createOwner,
  deactivateUser,
  demoteOwner,
  listUsers,
  promoteToOwner,
  updateUser,
} from '../../api/admin'
import { DataState, EmptyState, FormError } from '../../components/common/DataState'
import {
  Field,
  ModalBody,
  ModalFooter,
  ModalShell,
  primaryButtonClass,
  secondaryButtonClass,
} from '../../components/common/Modal'
import StatusBadge from '../../components/common/StatusBadge'
import { useAuth } from '../../context/AuthContext'
import { useApi } from '../../hooks/useApi'
import { formatDateTime, formatPhone, humanize } from '../../utils/format'

const roleFilters = [
  ['all', 'All'],
  ['owner', 'Owners'],
  ['caretaker', 'Caretakers'],
  ['user', 'Awaiting a role'],
  ['admin', 'Admins'],
]

const roleTones = { admin: 'info', owner: 'success', caretaker: 'warning', user: 'neutral' }

const smallButtonClass =
  'rounded-[8px] border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-[11px] font-bold transition hover:border-[var(--accent-soft-line)] hover:text-[var(--accent-ink)] disabled:opacity-50'

// What each confirmation says and does.
const actions = {
  promote: {
    title: 'Make owner',
    confirm: 'Make owner',
    run: promoteToOwner,
    describe: (name) =>
      `${name} will become an owner. They can then add properties, units and tenants, and receive payments, in their own account.`,
  },
  demote: {
    title: 'Remove owner role',
    confirm: 'Remove owner role',
    danger: true,
    run: demoteOwner,
    describe: (name) =>
      `${name} will go back to being a normal user with no access, and will be signed out. This is only allowed for an owner with no properties; for an owner with properties, deactivate the account instead.`,
  },
  deactivate: {
    title: 'Deactivate user',
    confirm: 'Deactivate',
    danger: true,
    run: deactivateUser,
    describe: (name) =>
      `${name} will be signed out everywhere and will not be able to sign in again until you activate them. Their data is kept.`,
  },
  activate: {
    title: 'Activate user',
    confirm: 'Activate',
    run: activateUser,
    describe: (name) => `${name} will be able to sign in again.`,
  },
}

function userName(user) {
  return [user.first_name, user.last_name].filter(Boolean).join(' ') || 'Unnamed user'
}

// A form sends back one plain sentence about the field when the backend rejects it.
function formError(error) {
  return error.details?.[0] || error
}

function AdminUsersPage() {
  const navigate = useNavigate()
  const { user: currentUser, openOwnerAccount } = useAuth()
  const usersState = useApi('admin-users', listUsers)
  const [roleFilter, setRoleFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [pending, setPending] = useState(null)
  const [adding, setAdding] = useState(false)
  const [editing, setEditing] = useState(null)
  const [opening, setOpening] = useState(null)
  const [openError, setOpenError] = useState(null)

  const users = usersState.data || []
  const term = search.trim().toLowerCase()

  // Matches a name, a phone number written with or without spaces, or a role.
  const matchesSearch = (user) =>
    !term ||
    userName(user).toLowerCase().includes(term) ||
    user.phone.replace(/\s/g, '').includes(term.replace(/\s/g, '')) ||
    formatPhone(user.phone).replace(/\s/g, '').includes(term.replace(/\s/g, '')) ||
    user.role.includes(term)

  const searched = users.filter(matchesSearch)
  const filteredUsers = searched.filter((user) => roleFilter === 'all' || user.role === roleFilter)

  // Opening is written to the audit log first; then the admin lands on that owner's dashboard.
  async function open(user) {
    setOpening(user.user_id)
    setOpenError(null)

    try {
      await openOwnerAccount(user.user_id)
      navigate('/dashboard')
    } catch (error) {
      setOpenError(error)
      setOpening(null)
    }
  }

  return (
    <>
      <div className="mb-7 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-[10px] text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--accent-ink)]">
            Administration
          </div>
          <h1 className="font-display text-[20px] font-semibold tracking-[-0.01em]">Users</h1>
          <p className="mt-2 max-w-[640px] text-[12px] leading-[1.5] text-[var(--ink-soft)]">
            Everyone with an account. Add an owner by name and phone number,
            or make someone who has already signed in an owner. Caretakers
            are added by their owner.
          </p>
        </div>

        <div className="flex flex-wrap gap-[10px]">
          <div className="flex w-[260px] items-center gap-2 rounded-[8px] border border-[var(--line)] bg-[var(--surface)] px-3 py-[10px] text-[12px] text-[var(--ink-faint)] focus-within:border-[var(--accent)]">
            <Search size={15} />
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search name, phone or role..."
              aria-label="Search users"
              className="w-full bg-transparent text-[var(--ink)] outline-none placeholder:text-[var(--ink-faint)]"
            />
          </div>

          <button
            onClick={() => setAdding(true)}
            className="inline-flex items-center gap-2 rounded-[8px] border border-[var(--accent)] bg-[var(--accent)] px-4 py-[10px] text-[12px] font-bold text-white"
          >
            <Plus size={15} />
            Add owner
          </button>
        </div>
      </div>

      <div className="mb-[18px] flex flex-wrap gap-7 border-b border-[var(--line)]">
        {roleFilters.map(([key, label]) => (
          <button
            key={key}
            onClick={() => setRoleFilter(key)}
            className={`pb-[12px] text-[11px] font-bold transition ${
              roleFilter === key
                ? 'border-b-2 border-[var(--accent)] text-[var(--accent-ink)]'
                : 'text-[var(--ink-faint)] hover:text-[var(--accent-ink)]'
            }`}
          >
            {label}
            {usersState.data
              ? ` (${searched.filter((user) => key === 'all' || user.role === key).length})`
              : ''}
          </button>
        ))}
      </div>

      {openError ? (
        <div className="mb-[14px]">
          <FormError error={openError} />
        </div>
      ) : null}

      <section className="overflow-hidden rounded-[10px] border border-[var(--line)] bg-[var(--surface)]">
        <DataState
          state={usersState}
          loadingLabel="Loading users..."
          isEmpty={() => !filteredUsers.length}
          empty={
            <EmptyState
              title={term ? 'No user matches' : 'No users here'}
              message={term ? 'Try another name, phone number or role.' : 'Choose another filter to see more users.'}
            />
          }
        >
          {() => (
            <div className="overflow-x-auto">
              <table className="min-w-[1100px] w-full border-collapse">
                <thead>
                  <tr className="bg-[var(--bg)] text-left text-[9px] uppercase tracking-[0.05em] text-[var(--ink-faint)]">
                    <th className="px-[18px] py-[10px] font-bold">User</th>
                    <th className="px-[18px] py-[10px] font-bold">Role</th>
                    <th className="px-[18px] py-[10px] font-bold">Status</th>
                    <th className="px-[18px] py-[10px] font-bold">Last sign-in</th>
                    <th className="px-[18px] py-[10px] font-bold">Joined</th>
                    <th className="px-[18px] py-[10px] font-bold"></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => {
                    const isSelf = user.user_id === currentUser.user_id
                    const isAdmin = user.role === 'admin'
                    const isOwner = user.role === 'owner'
                    const active = user.status === 'active'
                    // An owner's activity is their whole account; anyone else's is just their own actions.
                    const activityLink = isOwner
                      ? `/admin/audit-log?account=${user.user_id}`
                      : `/admin/audit-log?user=${user.user_id}`

                    return (
                      <tr key={user.user_id} className="border-b border-[var(--line-soft)] last:border-b-0">
                        <td className="px-[18px] py-[13px]">
                          <div className="text-[12px] font-bold">
                            {isOwner ? (
                              <Link
                                to={`/admin/owners/${user.user_id}`}
                                className="hover:text-[var(--accent-ink)] hover:underline"
                              >
                                {userName(user)}
                              </Link>
                            ) : (
                              userName(user)
                            )}
                            {isSelf ? ' (you)' : ''}
                          </div>
                          <div className="mt-[3px] text-[10px] text-[var(--ink-faint)]">
                            {formatPhone(user.phone)}
                          </div>
                        </td>
                        <td className="px-[18px] py-[13px]">
                          <StatusBadge tone={roleTones[user.role]}>
                            {user.role === 'user' ? 'No role yet' : humanize(user.role)}
                          </StatusBadge>
                        </td>
                        <td className="px-[18px] py-[13px]">
                          <StatusBadge tone={active ? 'success' : 'danger'}>
                            {humanize(user.status)}
                          </StatusBadge>
                        </td>
                        <td className="px-[18px] py-[13px] text-[12px]">
                          {formatDateTime(user.last_login_at, 'Never')}
                        </td>
                        <td className="px-[18px] py-[13px] text-[12px]">
                          {formatDateTime(user.created_at)}
                        </td>
                        <td className="px-[18px] py-[13px]">
                          <div className="flex flex-wrap justify-end gap-2">
                            {isOwner ? (
                              <button
                                onClick={() => open(user)}
                                disabled={opening !== null}
                                className={smallButtonClass}
                              >
                                {opening === user.user_id ? 'Opening...' : 'Open account'}
                              </button>
                            ) : null}

                            <Link to={activityLink} className={smallButtonClass}>
                              Activity
                            </Link>

                            {/* The administrator is set on the server and cannot be changed here. */}
                            {isAdmin ? null : (
                              <button onClick={() => setEditing(user)} className={smallButtonClass}>
                                Edit
                              </button>
                            )}

                            {user.role === 'user' && active ? (
                              <button
                                onClick={() => setPending({ action: 'promote', user })}
                                className={smallButtonClass}
                              >
                                Make owner
                              </button>
                            ) : null}

                            {isOwner ? (
                              <button
                                onClick={() => setPending({ action: 'demote', user })}
                                className={smallButtonClass}
                              >
                                Remove owner role
                              </button>
                            ) : null}

                            {isSelf || isAdmin ? null : active ? (
                              <button
                                onClick={() => setPending({ action: 'deactivate', user })}
                                className="rounded-[8px] border border-[var(--danger)] bg-[var(--surface)] px-3 py-2 text-[11px] font-bold text-[var(--danger)] transition hover:bg-[var(--danger-soft)]"
                              >
                                Deactivate
                              </button>
                            ) : (
                              <button
                                onClick={() => setPending({ action: 'activate', user })}
                                className={smallButtonClass}
                              >
                                Activate
                              </button>
                            )}
                          </div>
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

      {pending ? (
        <ConfirmUserActionModal
          action={actions[pending.action]}
          user={pending.user}
          onClose={() => setPending(null)}
          onDone={usersState.reload}
        />
      ) : null}

      {adding ? <UserFormModal onClose={() => setAdding(false)} onDone={usersState.reload} /> : null}

      {editing ? (
        <UserFormModal user={editing} onClose={() => setEditing(null)} onDone={usersState.reload} />
      ) : null}
    </>
  )
}

// Adds an owner, or edits a person's name and phone when `user` is passed.
function UserFormModal({ user, onClose, onDone }) {
  const [form, setForm] = useState({
    full_name: user ? userName(user).replace('Unnamed user', '') : '',
    phone: user ? formatPhone(user.phone) : '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  function setField(field) {
    return (event) => setForm((current) => ({ ...current, [field]: event.target.value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setSaving(true)
    setError(null)

    const body = { full_name: form.full_name.trim(), phone: form.phone.replace(/\s/g, '') }

    try {
      if (user) await updateUser(user.user_id, body)
      else await createOwner(body)

      onDone()
      onClose()
    } catch (saveError) {
      setError(formError(saveError))
      setSaving(false)
    }
  }

  return (
    <ModalShell title={user ? `Edit user - ${userName(user)}` : 'Add owner'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-hidden">
        <ModalBody>
          <div className="grid gap-[14px]">
            <Field
              label="Full names"
              placeholder="e.g. Joseph Kamau"
              value={form.full_name}
              onChange={setField('full_name')}
              required
              minLength={2}
              maxLength={100}
              autoFocus
            />
            <Field
              label="Phone number"
              placeholder="e.g. 0712 345 678"
              value={form.phone}
              onChange={setField('phone')}
              inputMode="tel"
              required
            />
          </div>

          <p className="mt-[14px] text-[11px] leading-[1.5] text-[var(--ink-faint)]">
            {user
              ? 'The first and last name are kept. Changing the phone number signs this person out; they sign in again with the new number.'
              : 'They become an owner straight away and sign in with this phone number. Nothing is sent to them, so tell them yourself. The first and last name are kept.'}
          </p>

          {error ? (
            <div className="mt-[14px]">
              <FormError error={error} />
            </div>
          ) : null}
        </ModalBody>

        <ModalFooter>
          <button type="button" onClick={onClose} className={secondaryButtonClass}>
            Cancel
          </button>
          <button type="submit" disabled={saving} className={primaryButtonClass}>
            {saving ? 'Saving...' : user ? 'Save' : 'Add owner'}
          </button>
        </ModalFooter>
      </form>
    </ModalShell>
  )
}

function ConfirmUserActionModal({ action, user, onClose, onDone }) {
  const [working, setWorking] = useState(false)
  const [error, setError] = useState(null)

  async function handleConfirm() {
    setWorking(true)
    setError(null)

    try {
      await action.run(user.user_id)
      onDone()
      onClose()
    } catch (actionError) {
      setError(actionError)
      setWorking(false)
    }
  }

  return (
    <ModalShell title={`${action.title} - ${userName(user)}`} onClose={onClose}>
      <ModalBody>
        <div className="rounded-[8px] border border-[var(--line)] bg-[var(--surface)] px-4 py-4">
          <h3 className="text-[13px] font-bold">
            {userName(user)} · {formatPhone(user.phone)}
          </h3>
          <p className="mt-1 text-[11px] leading-[1.5] text-[var(--ink-faint)]">
            {action.describe(userName(user))}
          </p>
        </div>

        {error ? (
          <div className="mt-[14px]">
            <FormError error={error} />
          </div>
        ) : null}
      </ModalBody>

      <ModalFooter>
        <button type="button" onClick={onClose} className={secondaryButtonClass}>
          Cancel
        </button>
        <button
          type="button"
          onClick={handleConfirm}
          disabled={working}
          className={
            action.danger
              ? 'rounded-[8px] border border-[var(--danger-solid)] bg-[var(--danger-solid)] px-5 py-[10px] text-[12px] font-bold text-white disabled:opacity-50'
              : primaryButtonClass
          }
        >
          {working ? 'Working...' : action.confirm}
        </button>
      </ModalFooter>
    </ModalShell>
  )
}

export default AdminUsersPage
