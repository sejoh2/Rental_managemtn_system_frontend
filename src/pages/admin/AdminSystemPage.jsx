import { getSystemStatus } from '../../api/admin'
import { DataState } from '../../components/common/DataState'
import StatusBadge from '../../components/common/StatusBadge'
import { useApi } from '../../hooks/useApi'
import { formatDateTime, formatKES } from '../../utils/format'

const cardClass = 'overflow-hidden rounded-[10px] border border-[var(--line)] bg-[var(--surface)]'

function Row({ label, hint, children }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-[var(--line-soft)] px-[18px] py-[11px] text-[12px] last:border-b-0">
      <span>
        <span className="text-[var(--ink-soft)]">{label}</span>
        {hint ? <span className="mt-[2px] block text-[10px] text-[var(--ink-faint)]">{hint}</span> : null}
      </span>
      <span className="shrink-0 text-right font-bold">{children}</span>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <section className={cardClass}>
      <div className="border-b border-[var(--line)] px-[18px] py-4">
        <h3 className="text-[12px] font-bold">{title}</h3>
      </div>
      {children}
    </section>
  )
}

// How the server is set up. Read-only, and only what is safe to show on a screen.
function AdminSystemPage() {
  const state = useApi('admin-system', getSystemStatus)

  return (
    <>
      <div className="mb-7">
        <div className="mb-[10px] text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--accent-ink)]">
          Administration
        </div>
        <h1 className="font-display text-[20px] font-semibold tracking-[-0.01em]">System</h1>
        <p className="mt-2 max-w-[640px] text-[12px] leading-[1.5] text-[var(--ink-soft)]">
          How the server is set up, for checking. Nothing can be changed
          here: these values live in the server&apos;s environment. Keys,
          passwords and secrets are never shown.
        </p>
      </div>

      <DataState state={state} loadingLabel="Loading system status...">
        {({ sms, sign_in: signIn, payments, server }) => (
          <div className="grid gap-4 xl:grid-cols-2">
            <Section title="SMS">
              <Row
                label="Mode"
                hint={
                  sms.mode === 'live'
                    ? 'Messages and sign-in codes are sent to phones and cost money.'
                    : 'Messages and sign-in codes are only printed on the server. Nothing reaches a phone.'
                }
              >
                <StatusBadge tone={sms.mode === 'live' ? 'success' : 'warning'}>
                  {sms.mode === 'live' ? 'Live' : 'Test'}
                </StatusBadge>
              </Row>
              <Row label="SMS provider account" hint="Africa's Talking username and key">
                <StatusBadge tone={sms.provider_account_set ? 'success' : 'danger'}>
                  {sms.provider_account_set ? 'Set' : 'Missing'}
                </StatusBadge>
              </Row>
              <Row label="Default sender ID" hint="Used when an owner has no approved sender ID of their own">
                {sms.default_sender_id || "Africa's Talking default number"}
              </Row>
              <Row label="Cost counted per SMS">{formatKES(sms.cost_per_message)}</Row>
            </Section>

            <Section title="Sign-in">
              <Row label="A code is valid for">{signIn.code_expires_minutes} minutes</Row>
              <Row label="Wrong codes allowed">{signIn.code_max_attempts}</Row>
              <Row label="Wait before another code">{signIn.code_resend_seconds} seconds</Row>
              <Row
                label="Administrator"
                hint="The only admin. Set on the server at deployment; it cannot be changed from any screen."
              >
                <span className="font-mono">{signIn.admin_phone}</span>
              </Row>
            </Section>

            <Section title="M-Pesa payments">
              <Row label="Address M-Pesa reports payments to" hint="Must be a live HTTPS address">
                <span className="font-mono">{payments.callback_host || 'Not set'}</span>
              </Row>
              <Row label="Secure (HTTPS)">
                <StatusBadge tone={payments.callback_is_https ? 'success' : 'danger'}>
                  {payments.callback_is_https ? 'Yes' : 'No'}
                </StatusBadge>
              </Row>
            </Section>

            <Section title="Server">
              <Row label="Environment">{server.environment}</Row>
              <Row
                label="Only this web app may call the API"
                hint="When off, any website can send requests to the API from a browser."
              >
                <StatusBadge tone={server.frontend_origin_restricted ? 'success' : 'danger'}>
                  {server.frontend_origin_restricted ? 'Yes' : 'No'}
                </StatusBadge>
              </Row>
              <Row label="Server time">{formatDateTime(server.time)}</Row>
            </Section>
          </div>
        )}
      </DataState>
    </>
  )
}

export default AdminSystemPage
