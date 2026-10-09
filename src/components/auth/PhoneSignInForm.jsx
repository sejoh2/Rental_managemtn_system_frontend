import { FormError } from '../common/DataState'

function PhoneSignInForm({ phone, onPhoneChange, onSendCode, sending, error }) {
  function handleSubmit(event) {
    event.preventDefault()
    onSendCode()
  }

  return (
    <section className="flex min-h-[620px] items-center justify-center px-6 py-12 sm:px-10 lg:min-h-[calc(100vh-34px)]">
      <div className="w-full max-w-[360px]">
        <div className="mb-[10px] text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--accent)]">
          Sign in
        </div>

        <h2 className="font-display text-[22px] font-semibold tracking-[-0.01em] text-[var(--ink)]">
          Welcome back
        </h2>

        <p className="mt-2 mb-7 text-[12px] leading-[1.5] text-[var(--ink-soft)]">
          Enter the phone number registered to your owner account. We’ll send a
          6-digit code to verify access.
        </p>

        <div className="mb-[26px] rounded-[9px] bg-[var(--line-soft)] p-[3px]">
          <button
            type="button"
            className="w-full rounded-[7px] bg-white px-3 py-[9px] text-[11.5px] font-bold text-[var(--ink)] shadow-[0_1px_2px_rgba(0,0,0,0.08)]"
          >
            Owner / Landlord
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <label className="mb-2 block text-[11px] font-bold text-[var(--ink)]">
            Phone number
          </label>

          <div className="flex overflow-hidden rounded-[9px] border border-[var(--line)] bg-white">
            <div className="flex items-center border-r border-[var(--line)] bg-[var(--bg)] px-3 text-[12px] font-bold text-[var(--ink-soft)]">
              KE +254
            </div>

            <input
              value={phone}
              onChange={(event) => onPhoneChange(event.target.value)}
              inputMode="tel"
              autoFocus
              required
              placeholder="712 345 678"
              className="font-mono min-w-0 flex-1 border-0 px-3 py-3 text-[13px] text-[var(--ink)] outline-none"
            />
          </div>

          <p className="mt-2 text-[10px] text-[var(--ink-faint)]">
            We’ll text a 6-digit code to this number.
          </p>

          {error ? (
            <div className="mt-[18px]">
              <FormError error={error} />
            </div>
          ) : null}

          <button
            type="submit"
            disabled={sending}
            className="mt-[30px] flex w-full items-center justify-center rounded-[8px] border border-[var(--accent)] bg-[var(--accent)] px-4 py-3 text-[12.5px] font-bold text-white transition hover:border-[var(--accent-hover)] hover:bg-[var(--accent-hover)] disabled:opacity-50"
          >
            {sending ? 'Sending code...' : 'Send code'}
          </button>

          <p className="mt-6 text-center text-[11px] text-[var(--ink-faint)]">
            Need access?{' '}
            <span className="font-bold text-[var(--accent)]">
              Contact system admin
            </span>
          </p>
        </form>
      </div>
    </section>
  )
}

export default PhoneSignInForm