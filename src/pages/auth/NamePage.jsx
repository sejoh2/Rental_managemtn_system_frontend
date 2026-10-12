import { useState } from 'react'
import { saveMyName } from '../../api/auth'
import AuthBrandPanel from '../../components/auth/AuthBrandPanel'
import { FormError } from '../../components/common/DataState'
import { useAuth } from '../../context/AuthContext'
import { formatPhone } from '../../utils/format'

// Shown once, after the code, to an account that has no name yet.
function NamePage() {
  const { user, signOut, refreshUser } = useAuth()
  const [fullName, setFullName] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  async function handleSubmit(event) {
    event.preventDefault()
    setSaving(true)
    setError(null)

    try {
      await saveMyName(fullName.trim())
      // The account now has a name, so the app moves on to the dashboard.
      await refreshUser()
    } catch (saveError) {
      // A rejected name comes back as one plain sentence about the field.
      setError(saveError.details?.[0] || saveError)
      setSaving(false)
    }
  }

  return (
    <main className="min-h-screen bg-[var(--bg)] text-[var(--ink)]">
      <div className="proto-strip">
        <span>KODI - Owner Web Dashboard</span>
      </div>

      <section className="grid min-h-screen pt-[34px] lg:grid-cols-[1.1fr_1fr]">
        <AuthBrandPanel />

        <section className="flex min-h-[620px] items-center justify-center px-6 py-12 sm:px-10 lg:min-h-[calc(100vh-34px)]">
          <div className="w-full max-w-[360px]">
            <div className="mb-[10px] text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--accent-ink)]">
              One last step
            </div>

            <h2 className="font-display text-[22px] font-semibold tracking-[-0.01em] text-[var(--ink)]">
              What is your name?
            </h2>

            <p className="mt-2 mb-7 text-[12px] leading-[1.5] text-[var(--ink-soft)]">
              You are signed in as{' '}
              <span className="font-mono font-bold text-[var(--ink)]">
                {formatPhone(user.phone)}
              </span>
              . Your name is shown on your dashboard and next to what you do
              in the system.
            </p>

            <form onSubmit={handleSubmit}>
              <label className="mb-2 block text-[11px] font-bold text-[var(--ink)]">
                Full names
              </label>

              <input
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                autoFocus
                required
                minLength={2}
                maxLength={100}
                autoComplete="name"
                placeholder="Joseph Kamau"
                className="w-full rounded-[9px] border border-[var(--line)] bg-[var(--surface)] px-3 py-3 text-[13px] text-[var(--ink)] outline-none focus:border-[var(--accent)]"
              />

              <p className="mt-2 text-[10px] text-[var(--ink-faint)]">
                Enter your first and last name. One name is also accepted.
              </p>

              {error ? (
                <div className="mt-[18px]">
                  <FormError error={error} />
                </div>
              ) : null}

              <button
                type="submit"
                disabled={saving}
                className="mt-[30px] flex w-full items-center justify-center rounded-[8px] border border-[var(--accent)] bg-[var(--accent)] px-4 py-3 text-[12.5px] font-bold text-white transition hover:border-[var(--accent-hover)] hover:bg-[var(--accent-hover)] disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Continue'}
              </button>

              <button
                type="button"
                onClick={signOut}
                className="mt-[10px] flex w-full items-center justify-center rounded-[8px] border border-[var(--line)] bg-[var(--surface)] px-4 py-3 text-[12.5px] font-bold text-[var(--ink)]"
              >
                Sign out
              </button>
            </form>
          </div>
        </section>
      </section>
    </main>
  )
}

export default NamePage
