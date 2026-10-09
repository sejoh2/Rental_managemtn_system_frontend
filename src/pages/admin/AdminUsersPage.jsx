import { useState } from 'react'
import { Link } from 'react-router-dom'
import { activateUser, deactivateUser, listUsers, promoteToOwner } from '../../api/admin'
import { DataState, EmptyState, FormError } from '../../components/common/DataState'
import {
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
  'rounded-[8px] border border-[var(--line)] bg-white px-3 py-2 text-[11px] font-bold transition hover:border-[var(--accent-soft-line)] hover:text-[var(--accent)]'

// What each confirmation says and does.
const actions = {
  promote: {
    title: 'Make owner',
    confirm: 'Make owner',
    run: promoteToOwner,
    describe: (name) =>
      `${name} will become an owner. They can then add properties, units and tenants, and receive payments, in their own account.`,
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

function AdminUsersPage() {
  const { user: currentUser } = useAuth()
  const usersState = useApi('admin-users', listUsers)
  const [roleFilter, setRoleFilter] = useState('all')
  const [pending, setPending] = useState(null)

  const users = usersState.data || []
  const filteredUsers = users.filter((user) => roleFilter === 'all' || user.role === roleFilter)

  return (
    <>
      <div className="mb-7">
        <div className="mb-[10px] text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--accent)]">
          Administration
        </div>
        <h1 className="font-display text-[20px] font-semibold tracking-[-0.01em]">Users</h1>
        <p className="mt-2 max-w-[640px] text-[12px] leading-[1.5] text-[var(--ink-soft)]">
          Everyone who has signed in. A new phone number starts with no role;
          make them an owner here so they can manage properties. Caretakers
          are added by their owner.
        </p>
      </div>

      <div className="mb-[18px] flex flex-wrap gap-7 border-b border-[var(--line)]">
        {roleFilters.map(([key, label]) => (
          <button
            key={key}
            onClick={() => setRoleFilter(key)}
            className={`pb-[12px] text-[11px] font-bold transition ${
              roleFilter === key
                ? 'border-b-2 border-[var(--accent)] text-[var(--accent)]'
                : 'text-[var(--ink-faint)] hover:text-[var(--accent)]'
            }`}
          >
            {label}
            {usersState.data
              ? ` (${users.filter((user) => key === 'all' || user.role === key).length})`
              : ''}
          </button>
        ))}
      </div>

      <section className="overflow-hidden rounded-[10px] border border-[var(--line)] bg-white">
        <DataState
          state={usersState}
          loadingLabel="Loading users..."
          isEmpty={() => !filteredUsers.length}
          empty={<EmptyState title="No users here" message="Choose another filter to see more users." />}
        >
          {() => (
            <div className="overflow-x-auto">
              <table className="min-w-[980px] w-full border-collapse">
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
                    const active = user.status === 'active'
                    // An owner's activity is their whole account; anyone else's is just their own actions.
                    const activityLink =
                      user.role === 'owner'
                        ? `/admin/audit-log?account=${user.user_id}`
                        : `/admin/audit-log?user=${user.user_id}`

                    return (
                      <tr key={user.user_id} className="border-b border-[var(--line-soft)] last:border-b-0">
                        <td className="px-[18px] py-[13px]">
                          <div className="text-[12px] font-bold">
                            {userName(user)}
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
                          <div className="flex justify-end gap-2">
                            <Link to={activityLink} className={smallButtonClass}>
                              Activity
                            </Link>

                            {user.role === 'user' && active ? (
                              <button
                                onClick={() => setPending({ action: 'promote', user })}
                                className={smallButtonClass}
                              >
                                Make owner
                              </button>
                            ) : null}

                            {isSelf || user.role === 'admin' ? null : active ? (
                              <button
                                onClick={() => setPending({ action: 'deactivate', user })}
                                className="rounded-[8px] border border-[#B3261E] bg-white px-3 py-2 text-[11px] font-bold text-[#B3261E] transition hover:bg-[#FBE4E2]"
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
    </>
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
        <div
          className={`rounded-[8px] border border-[var(--line)] border-l-2 bg-white px-4 py-4 ${
            action.danger ? 'border-l-[#B3261E]' : 'border-l-[var(--accent-soft-line)]'
          }`}
        >
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
              ? 'rounded-[8px] border border-[#B3261E] bg-[#B3261E] px-5 py-[10px] text-[12px] font-bold text-white disabled:opacity-50'
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
