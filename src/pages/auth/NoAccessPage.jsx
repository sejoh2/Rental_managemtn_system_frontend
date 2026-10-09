import { useState } from 'react'
import AuthBrandPanel from '../../components/auth/AuthBrandPanel'
import { FormError } from '../../components/common/DataState'
import { useAuth } from '../../context/AuthContext'
import { formatPhone, humanize } from '../../utils/format'

// Shown to signed-in accounts that are neither an owner nor an admin.
function NoAccessPage() {
  const { user, signOut, refreshUser } = useAuth()
  const [checking, setChecking] = useState(false)
  const [error, setError] = useState(null)

  const isCaretaker = user.role === 'caretaker'

  async function checkAgain() {
    setChecking(true)
    setError(null)

    try {
      await refreshUser()
    } catch (refreshError) {
      setError(refreshError)
    } finally {
      setChecking(false)
    }
  }

  return (
    <main className="min-h-screen bg-[var(--bg)] text-[var(--ink)]">
      <div className="proto-strip">
        <span>KODI - Owner Web Dashboard</span>

        <span className="proto-pill">No access</span>
      </div>

      <section className="grid min-h-screen pt-[34px] lg:grid-cols-[1.1fr_1fr]">
        <AuthBrandPanel />

        <section className="flex min-h-[620px] items-center justify-center px-6 py-12 sm:px-10 lg:min-h-[calc(100vh-34px)]">
          <div className="w-full max-w-[360px]">
            <div className="mb-[10px] text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--accent)]">
              {isCaretaker ? 'Caretaker account' : `${humanize(user.role)} account`}
            </div>

            <h2 className="font-display text-[22px] font-semibold tracking-[-0.01em] text-[var(--ink)]">
              {isCaretaker ? 'This dashboard is for owners' : 'Owner access not set up yet'}
            </h2>

            <p className="mt-2 mb-7 text-[12px] leading-[1.5] text-[var(--ink-soft)]">
              You are signed in as{' '}
              <span className="font-mono font-bold text-[var(--ink)]">
                {formatPhone(user.phone)}
              </span>
              .{' '}
              {isCaretaker
                ? 'Caretaker accounts cannot use the owner web dashboard.'
                : 'A system admin has to make this number an owner account before you can manage properties.'}
            </p>

            {error ? (
              <div className="mb-4">
                <FormError error={error} />
              </div>
            ) : null}

            {isCaretaker ? null : (
              <button
                type="button"
                onClick={checkAgain}
                disabled={checking}
                className="flex w-full items-center justify-center rounded-[8px] border border-[var(--accent)] bg-[var(--accent)] px-4 py-3 text-[12.5px] font-bold text-white transition hover:border-[var(--accent-hover)] hover:bg-[var(--accent-hover)] disabled:opacity-50"
              >
                {checking ? 'Checking...' : 'I have been given access - check again'}
              </button>
            )}

            <button
              type="button"
              onClick={signOut}
              className="mt-[10px] flex w-full items-center justify-center rounded-[8px] border border-[var(--line)] bg-white px-4 py-3 text-[12.5px] font-bold text-[var(--ink)]"
            >
              Sign out
            </button>
          </div>
        </section>
      </section>
    </main>
  )
}

export default NoAccessPage
