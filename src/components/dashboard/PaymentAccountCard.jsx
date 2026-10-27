import { useState } from 'react'
import { Check } from 'lucide-react'
import { connectPaymentAccount } from '../../api/properties'
import { FormError } from '../common/DataState'

const inputClass =
  'h-10 w-full rounded-[8px] border border-[var(--line)] bg-[var(--surface)] px-3 text-[12px] text-[var(--ink)] outline-none transition placeholder:text-[var(--ink-faint)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)] disabled:bg-[var(--line-soft)] disabled:text-[var(--ink-faint)]'

const labelClass = 'mb-2 block text-[11px] font-bold text-[var(--ink)]'

const linkClass = 'text-[11px] font-bold text-[var(--accent-ink)] hover:underline'

const accountTypes = [
  ['paybill', 'M-Pesa PayBill'],
  ['till', 'M-Pesa Till Number'],
]

const connectGuideSteps = {
  paybill: [
    'Log in to the Safaricom Daraja portal and create an app',
    'Copy the Consumer Key from your app',
    'Copy the Consumer Secret from your app',
    'Enter your Business Shortcode',
    'Click Connect — Kodi validates the credentials with Safaricom',
  ],
  till: [
    'Log in to the Safaricom Daraja portal and create an app',
    'Copy the Consumer Key and Consumer Secret',
    'Enter your Till Number',
    'Click Connect — Kodi validates the credentials with Safaricom',
  ],
}

/*
  M-Pesa credentials form with a real "Connect" check.

  account / onChange - form state shaped like emptyAccount (utils/propertyForm).
  propertyId - set when an existing property is changing this account.
  callbackNote - what happens to payment callbacks once the form is saved.
*/
function PaymentAccountCard({
  title,
  accountFor,
  account,
  onChange,
  propertyName,
  propertyId,
  callbackNote,
  onCancel,
  cancelLabel = 'Keep current account',
  // An extra account added by mistake: a Remove next to its name too, where it is easy to find.
  onRemove,
}) {
  const [guideOpen, setGuideOpen] = useState(false)

  const connected = account.status === 'connected'
  const connecting = account.status === 'connecting'
  const locked = connected || connecting

  async function handleConnect() {
    if (!account.businessNumber || !account.consumerKey || !account.consumerSecret) {
      onChange({
        error: { message: 'Enter the business number, consumer key and consumer secret first.' },
      })
      return
    }

    onChange({ status: 'connecting', error: null })

    const name = (propertyName || '').trim()

    try {
      const result = await connectPaymentAccount(
        accountFor,
        {
          provider_code: 'mpesa',
          account_type: account.accountType,
          business_number: account.businessNumber.trim(),
          environment: account.environment,
          credentials: {
            consumer_key: account.consumerKey.trim(),
            consumer_secret: account.consumerSecret.trim(),
          },
          ...(name
            ? {
                account_name: name.slice(0, 150),
                display_name: `${name} ${accountFor.charAt(0).toUpperCase()}${accountFor.slice(1)}`.slice(0, 100),
              }
            : {}),
        },
        propertyId
      )

      onChange({
        status: 'connected',
        connectionId: result.connection_id,
        expiresAt: Date.now() + result.expires_in_seconds * 1000,
      })
    } catch (connectError) {
      onChange({ status: 'idle', error: connectError })
    }
  }

  function handleDisconnect() {
    onChange({ status: 'idle', connectionId: null, expiresAt: 0, error: null })
  }

  return (
    <div className="mb-4 rounded-[10px] border border-[var(--line)] bg-[var(--surface)] p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="text-[13px] font-bold text-[var(--ink)]">{title}</div>
        <div className="flex items-center gap-3">
          <span className={`text-[11px] font-bold ${connected ? 'text-[var(--success)]' : 'text-[var(--ink-faint)]'}`}>
            {connected ? 'Connected' : 'Not connected'}
          </span>
          {onRemove ? (
            <button
              type="button"
              onClick={onRemove}
              disabled={connecting}
              className="text-[11px] font-bold text-[var(--danger)] hover:underline disabled:opacity-50"
            >
              Remove
            </button>
          ) : null}
        </div>
      </div>

      <div className="mb-3 grid gap-[14px] sm:grid-cols-2">
        <div>
          <label className={labelClass}>Payment provider</label>
          <select
            value={account.accountType}
            onChange={(event) => onChange({ accountType: event.target.value })}
            disabled={locked}
            className={inputClass}
          >
            {accountTypes.map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className={labelClass}>Environment</label>
          <select
            value={account.environment}
            onChange={(event) => onChange({ environment: event.target.value })}
            disabled={locked}
            className={inputClass}
          >
            <option value="sandbox">Sandbox (testing)</option>
            <option value="production">Production (live)</option>
          </select>
        </div>
      </div>

      <div className="grid gap-[14px] sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className={labelClass}>
            {account.accountType === 'till' ? 'Till number' : 'Business shortcode'}
          </label>
          <input
            type="text"
            inputMode="numeric"
            value={account.businessNumber}
            onChange={(event) => onChange({ businessNumber: event.target.value })}
            placeholder={account.accountType === 'till' ? 'e.g. 552233' : 'e.g. 400200'}
            disabled={locked}
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>Consumer key</label>
          <input
            type="text"
            value={account.consumerKey}
            onChange={(event) => onChange({ consumerKey: event.target.value })}
            placeholder="Daraja consumer key"
            disabled={locked}
            autoComplete="off"
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>Consumer secret</label>
          <input
            type="password"
            value={account.consumerSecret}
            onChange={(event) => onChange({ consumerSecret: event.target.value })}
            placeholder="Daraja consumer secret"
            disabled={locked}
            autoComplete="new-password"
            className={inputClass}
          />
        </div>
      </div>

      {connected ? (
        <div className="mt-3 space-y-1.5">
          {['Credentials valid', 'Authorization successful'].map((label) => (
            <div key={label} className="flex items-center gap-2 text-[11px] text-[var(--success)]">
              <Check size={12} strokeWidth={2.5} />
              {label}
            </div>
          ))}
          <p className="text-[11px] text-[var(--ink-faint)]">{callbackNote}</p>
        </div>
      ) : null}

      {account.error ? (
        <div className="mt-3">
          <FormError error={account.error} />
        </div>
      ) : null}

      {guideOpen ? (
        <ol className="mt-3 list-decimal space-y-1 rounded-[8px] bg-[var(--bg)] py-3 pl-8 pr-4 text-[11px] leading-[1.5] text-[var(--ink-soft)]">
          {connectGuideSteps[account.accountType].map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      ) : null}

      <div className="mt-3 flex items-center justify-between gap-3">
        <button
          type="button"
          className={linkClass}
          onClick={() => setGuideOpen((current) => !current)}
        >
          {guideOpen ? 'Hide guide' : 'Need help? View guide'}
        </button>

        <div className="flex gap-2">
          {onCancel ? (
            <button
              type="button"
              className="rounded-[8px] border border-[var(--line)] bg-[var(--surface)] px-3 py-1.5 text-[11px] font-bold text-[var(--ink)] transition hover:bg-[var(--line-soft)]"
              onClick={onCancel}
              disabled={connecting}
            >
              {cancelLabel}
            </button>
          ) : null}

          {connected ? (
            <button
              type="button"
              className="rounded-[8px] border border-[var(--danger)] px-3 py-1.5 text-[11px] font-bold text-[var(--danger)] transition hover:bg-[var(--danger-soft)]"
              onClick={handleDisconnect}
            >
              Disconnect
            </button>
          ) : (
            <button
              type="button"
              className="rounded-[8px] border border-[var(--accent)] bg-[var(--accent)] px-3 py-1.5 text-[11px] font-bold text-white transition hover:border-[var(--accent-hover)] hover:bg-[var(--accent-hover)] disabled:opacity-50"
              onClick={handleConnect}
              disabled={connecting}
            >
              {connecting ? 'Connecting...' : 'Connect'}
            </button>
          )}
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2 text-[10.5px] text-[var(--ink-faint)]">
        <span>✓</span>
        <span>Credentials are encrypted at rest — the full secret is never shown again after connecting.</span>
      </div>
    </div>
  )
}

export default PaymentAccountCard
