import { useEffect, useState } from 'react'
import { getPossibleDuplicates, matchPayment } from '../../api/payments'
import { listTenants, recordManualPayment } from '../../api/tenants'
import { useProperties } from '../../context/PropertiesContext'
import { useApi } from '../../hooks/useApi'
import { paymentAccountHint } from '../../utils/accountSharing'
import { formatDateTime, formatKES, formatPhone, toDateInput } from '../../utils/format'
import { PAYMENT_ACCOUNTS, PAYMENT_ACCOUNT_HINTS, PAYMENT_METHODS } from '../../utils/payments'
import { isCurrentTenant } from '../../utils/tenantStatus'
import { FormError } from '../common/DataState'
import {
  Field,
  ModalBody,
  ModalFooter,
  ModalShell,
  SelectField,
  inputClass,
  labelClass,
  primaryButtonClass,
  secondaryButtonClass,
} from '../common/Modal'

// Why Kodi thinks an unmatched payment may be this money.
function reasonText(reason, payer) {
  if (reason === 'receipt') return 'Same receipt number'
  if (reason === 'phone') return `From ${payer.full_name}'s number`
  return 'Same amount'
}

/*
  Records cash or any payment that did not arrive through M-Pesa matching.
  Pass `tenant` to record for that tenant; without it the owner picks one.

  Before saving, Kodi looks for an unmatched M-Pesa payment that may be this
  same money. The owner matches that payment instead, or says why this is a
  different payment, so the same shilling is never counted twice.
*/
function RecordPaymentModal({ tenant, onClose, onDone }) {
  // Only loaded when the tenant has to be chosen.
  const tenantsState = useApi(tenant ? null : 'tenants', () => listTenants())
  const tenants = (tenantsState.data || []).filter(isCurrentTenant)

  const [form, setForm] = useState({
    tenant_id: '',
    amount: '',
    received_on: toDateInput(),
    payment_method: 'cash',
    account_for: 'rent',
    reference: '',
    notes: '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  // What the last lookup found, for the tenant, amount and receipt it was made for.
  const [found, setFound] = useState({ key: null, already_recorded: null, candidates: [] })
  const [different, setDifferent] = useState(false)
  const [overrideReason, setOverrideReason] = useState('')
  const [matching, setMatching] = useState(null)

  const payer = tenant || tenants.find((item) => String(item.id) === form.tenant_id)
  // The payer's property: which bills each account pays there.
  const property = useProperties()?.data?.find((item) => item.id === payer?.property_id)

  const isMpesa = form.payment_method === 'mpesa'
  const receipt = isMpesa ? form.reference.replace(/\s+/g, '').toUpperCase() : ''
  const amount = Number(form.amount) > 0 ? Number(form.amount) : null

  const lookupKey = payer?.id && (amount || receipt) ? `${payer.id}|${amount}|${receipt}` : null
  const check = found.key === lookupKey ? found : { already_recorded: null, candidates: [] }
  const payerId = payer?.id

  // Looks again a moment after the tenant, amount or receipt number changes.
  useEffect(() => {
    if (!lookupKey) return undefined

    let cancelled = false
    const timer = setTimeout(() => {
      getPossibleDuplicates(payerId, { amount, reference: receipt })
        .then((result) => {
          if (!cancelled) setFound({ key: lookupKey, ...result })
        })
        .catch(() => {})
    }, 400)

    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [lookupKey, payerId, amount, receipt])

  const candidates = check.candidates || []
  const exactReceipt = candidates.find((item) => item.reasons.includes('receipt'))
  const mustAnswer = candidates.length > 0 && !different
  const blocked =
    Boolean(check.already_recorded) ||
    Boolean(exactReceipt) ||
    mustAnswer ||
    (different && overrideReason.trim().length < 3)

  function setField(field) {
    return (event) => setForm((current) => ({ ...current, [field]: event.target.value }))
  }

  async function handleMatch(candidate) {
    setMatching(candidate.id)
    setError(null)

    try {
      await matchPayment(candidate.id, { tenant_id: payer.id, remember_payment_phone: false })
      onDone()
      onClose()
    } catch (matchError) {
      setError(matchError)
      setMatching(null)
    }
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setSaving(true)
    setError(null)

    try {
      await recordManualPayment(payer.id, {
        amount: Number(form.amount),
        payment_method: form.payment_method,
        account_for: form.account_for,
        // Today's payments keep the current time; earlier dates are recorded at midday.
        received_at:
          form.received_on === toDateInput()
            ? new Date().toISOString()
            : new Date(`${form.received_on}T12:00:00`).toISOString(),
        reference: (isMpesa ? receipt : form.reference.trim()) || null,
        notes: form.notes.trim() || null,
        duplicate_override_reason: different && candidates.length ? overrideReason.trim() : null,
      })

      onDone()
      onClose()
    } catch (saveError) {
      // The server found a payment the form had not shown yet.
      const candidatesFromServer = saveError.payload?.details?.candidates

      if (candidatesFromServer?.length) {
        setFound({ key: lookupKey, already_recorded: null, candidates: candidatesFromServer })
        setDifferent(false)
      }

      setError(saveError)
      setSaving(false)
    }
  }

  return (
    <ModalShell title="Record manual payment" onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-hidden">
        <ModalBody>
          <p className="mb-[18px] text-[11px] leading-[1.5] text-[var(--ink-faint)]">
            For cash, or any payment that didn't come through M-Pesa
            auto-matching.{' '}
            {payer
              ? `This is applied straight to ${payer.full_name}'s balance for House ${payer.unit_number}, deposits first.`
              : 'It is applied straight to the tenant’s balance, deposits first.'}
          </p>

          {tenant ? null : (
            <div className="mb-[14px]">
              <label className={labelClass}>Tenant</label>
              <select
                value={form.tenant_id}
                onChange={setField('tenant_id')}
                required
                className={inputClass}
              >
                <option value="">
                  {tenantsState.loading ? 'Loading tenants...' : 'Choose a tenant'}
                </option>
                {tenants.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.full_name} - {item.property_name} · {item.unit_number}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="grid gap-[14px] sm:grid-cols-2">
            <Field
              label="Amount (KES)"
              placeholder="e.g. 5000"
              type="number"
              min="1"
              step="any"
              value={form.amount}
              onChange={setField('amount')}
              required
            />
            <Field
              label="Date received"
              type="date"
              max={toDateInput()}
              value={form.received_on}
              onChange={setField('received_on')}
              required
            />

            <SelectField
              label="Payment method"
              value={form.payment_method}
              onChange={setField('payment_method')}
              options={PAYMENT_METHODS}
            />
            <SelectField
              label="Apply to"
              value={form.account_for}
              onChange={setField('account_for')}
              options={PAYMENT_ACCOUNTS}
            />
          </div>

          <p className="mt-2 text-[10px] leading-[1.5] text-[var(--ink-faint)]">
            {paymentAccountHint(form.account_for, property) || PAYMENT_ACCOUNT_HINTS[form.account_for]} Anything left over is
            kept as credit for the next bill.
          </p>

          <div className="mt-[18px] grid gap-[14px]">
            {isMpesa ? (
              <div>
                <Field
                  label="M-Pesa receipt number"
                  placeholder="e.g. TJU4K8P2QX"
                  value={form.reference}
                  onChange={setField('reference')}
                  required
                  pattern="[A-Za-z0-9 ]{8,14}"
                  title="The receipt number in the tenant's M-Pesa message, for example TJU4K8P2QX."
                />
                <p className="mt-1 text-[10px] leading-[1.5] text-[var(--ink-faint)]">
                  Required for M-Pesa, so the same money is never counted twice. It is at the start of the
                  tenant's M-Pesa message.
                </p>
              </div>
            ) : (
              <Field
                label="Reference (optional)"
                placeholder="e.g. receipt or transaction number"
                value={form.reference}
                onChange={setField('reference')}
              />
            )}
            <Field
              label="Notes (optional)"
              placeholder="e.g. Paid in person at the office"
              value={form.notes}
              onChange={setField('notes')}
            />
          </div>

          {check.already_recorded ? (
            <div className="mt-[14px] rounded-[8px] border border-[var(--danger-line)] bg-[var(--danger-soft)] px-3 py-[10px] text-[11px] font-bold leading-[1.5] text-[var(--danger)]">
              Receipt {receipt} is already recorded, for {check.already_recorded.tenant_name || 'a tenant'}, on{' '}
              {check.already_recorded.received_on}. It can't be recorded again.
            </div>
          ) : null}

          {payer && candidates.length ? (
            <div className="mt-[14px] rounded-[8px] border border-[var(--line)] bg-[var(--warning-soft)] px-3 py-3">
              <p className="text-[12px] font-bold text-[var(--ink)]">This payment may already be in Kodi</p>
              <p className="mt-1 text-[11px] leading-[1.5] text-[var(--ink-soft)]">
                {exactReceipt
                  ? `This receipt came in by M-Pesa and is not matched yet. Match it to ${payer.full_name} instead of recording it again.`
                  : `An M-Pesa payment that came in but is not matched yet looks like this money. If it is, match it to ${payer.full_name} so it is counted once.`}
              </p>

              <ul className="mt-[10px] grid gap-2">
                {candidates.map((candidate) => (
                  <li
                    key={candidate.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-[8px] border border-[var(--line)] bg-[var(--surface)] px-3 py-2"
                  >
                    <div className="min-w-0">
                      <p className="text-[12px] font-bold text-[var(--ink)]">
                        M-Pesa {candidate.provider_transaction_id} · {formatKES(candidate.amount)}
                      </p>
                      <p className="text-[10px] text-[var(--ink-faint)]">
                        from {formatPhone(candidate.payer_phone)} · {formatDateTime(candidate.received_at)} · not
                        matched yet
                      </p>
                      <p className="mt-1 flex flex-wrap gap-1">
                        {candidate.reasons.map((reason) => (
                          <span
                            key={reason}
                            className="rounded-full bg-[var(--warning-soft)] px-2 py-[1px] text-[10px] font-bold text-[var(--warning)]"
                          >
                            {reasonText(reason, payer)}
                          </span>
                        ))}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleMatch(candidate)}
                      disabled={Boolean(matching)}
                      className={primaryButtonClass}
                    >
                      {matching === candidate.id ? 'Matching...' : `Match this payment to ${payer.full_name}`}
                    </button>
                  </li>
                ))}
              </ul>

              {exactReceipt ? null : different ? (
                <div className="mt-[12px]">
                  <Field
                    label="Why is this a different payment?"
                    placeholder="e.g. He paid cash as well"
                    value={overrideReason}
                    onChange={(event) => setOverrideReason(event.target.value)}
                    required
                  />
                  <p className="mt-1 text-[10px] leading-[1.5] text-[var(--ink-faint)]">
                    Saved with the payment and in the audit log.{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setDifferent(false)
                        setOverrideReason('')
                      }}
                      className="font-bold text-[var(--accent-ink)] underline"
                    >
                      Go back
                    </button>
                  </p>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setDifferent(true)}
                  className="mt-[12px] text-[11px] font-bold text-[var(--accent-ink)] underline"
                >
                  It's a different payment
                </button>
              )}
            </div>
          ) : null}

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
          <button type="submit" disabled={saving || !payer || blocked} className={primaryButtonClass}>
            {saving ? 'Recording...' : 'Record payment'}
          </button>
        </ModalFooter>
      </form>
    </ModalShell>
  )
}

export default RecordPaymentModal
