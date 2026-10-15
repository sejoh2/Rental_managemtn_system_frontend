import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Download, FileText } from 'lucide-react'
import {
  deletePropertyTemplate,
  downloadAgreement,
  getDefaultTemplate,
  getPropertyTemplate,
  listAgreements,
  markAgreementSigned,
  regenerateAgreement,
  saveDefaultTemplate,
  savePropertyTemplate,
  unmarkAgreementSigned,
} from '../../api/agreements'
import { DataState, EmptyState, FormError } from '../../components/common/DataState'
import {
  Field,
  ModalBody,
  ModalFooter,
  ModalShell,
  inputClass,
  labelClass,
  primaryButtonClass,
  secondaryButtonClass,
} from '../../components/common/Modal'
import StatusBadge from '../../components/common/StatusBadge'
import { useProperties } from '../../context/PropertiesContext'
import { useApi } from '../../hooks/useApi'
import { formatDate, toDateInput } from '../../utils/format'

// The placeholders the backend can fill in. Any other {word} in a template is rejected on save.
const placeholders = [
  'landlord_name',
  'tenant_name',
  'property_name',
  'unit_number',
  'monthly_rent',
  'deposit_amount',
  'rent_due_day',
  'notice_period',
  'move_in_date',
]

const smallButtonClass =
  'inline-flex items-center gap-2 rounded-[8px] border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-[11px] font-bold disabled:opacity-50'

function AgreementsPage() {
  // Only the agreements of the property chosen in the top bar, or all of them.
  const propertyId = useProperties().selectedId
  const agreementsState = useApi(`agreements-${propertyId || 'all'}`, () =>
    listAgreements(propertyId ? { property_id: propertyId } : undefined)
  )
  const [templateOpen, setTemplateOpen] = useState(false)
  const [selectedId, setSelectedId] = useState(null)
  const [signing, setSigning] = useState(null)
  const [busyId, setBusyId] = useState(null)
  const [error, setError] = useState(null)

  const agreements = agreementsState.data || []
  const selected = agreements.find((item) => item.id === selectedId) || agreements[0]

  async function run(agreement, action) {
    setBusyId(agreement.id)
    setError(null)

    try {
      await action()
    } catch (actionError) {
      setError(actionError)
    } finally {
      setBusyId(null)
    }
  }

  return (
    <>
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-[10px] text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--accent-ink)]">
            Property
          </div>
          <h1 className="font-display text-[20px] font-semibold tracking-[-0.01em]">
            Agreements
          </h1>
          <p className="mt-2 text-[12px] text-[var(--ink-soft)]">
            Auto-generated tenancy agreements, ready to print or download.
          </p>
        </div>

        <button
          onClick={() => setTemplateOpen(true)}
          className="inline-flex items-center gap-2 rounded-[8px] border border-[var(--line)] bg-[var(--surface)] px-4 py-[10px] text-[12px] font-bold"
        >
          <FileText size={15} />
          Manage templates
        </button>
      </div>

      {error ? (
        <div className="mb-4">
          <FormError error={error} />
        </div>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-[1.6fr_1fr]">
        <section className="overflow-hidden rounded-[10px] border border-[var(--line)] bg-[var(--surface)]">
          <div className="flex items-center justify-between border-b border-[var(--line)] px-[18px] py-4">
            <h3 className="text-[12px] font-bold">All agreements</h3>
            <span className="text-[10px] text-[var(--ink-faint)]">
              {agreementsState.data ? `${agreements.length} total` : ''}
            </span>
          </div>

          <DataState
            state={agreementsState}
            loadingLabel="Loading agreements..."
            isEmpty={(data) => !data.length}
            empty={
              <EmptyState
                title="No agreements yet"
                message="An agreement is generated automatically from your template each time you add a tenant."
              />
            }
          >
            {() => (
              <div className="overflow-x-auto">
                <table className="min-w-[760px] w-full border-collapse">
                  <thead>
                    <tr className="bg-[var(--bg)] text-left text-[9px] uppercase tracking-[0.05em] text-[var(--ink-faint)]">
                      <th className="px-[18px] py-[10px] font-bold">Tenant</th>
                      <th className="px-[18px] py-[10px] font-bold">Unit</th>
                      <th className="px-[18px] py-[10px] font-bold">Signed</th>
                      <th className="px-[18px] py-[10px] font-bold">Status</th>
                      <th className="px-[18px] py-[10px] font-bold"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {agreements.map((item) => {
                      const signed = item.status === 'signed'
                      const busy = busyId === item.id

                      return (
                        <tr
                          key={item.id}
                          onClick={() => setSelectedId(item.id)}
                          className={`cursor-pointer border-b border-[var(--line-soft)] transition last:border-b-0 ${
                            selected?.id === item.id ? 'bg-[var(--bg)]' : 'hover:bg-[var(--bg)]'
                          }`}
                        >
                          <td className="px-[18px] py-[13px] text-[12px] font-bold">
                            <Link
                              to={`/tenants/${item.tenant_id}`}
                              onClick={(event) => event.stopPropagation()}
                              className="hover:text-[var(--accent-ink)]"
                            >
                              {item.tenant_name}
                            </Link>
                          </td>
                          <td className="px-[18px] py-[13px] text-[12px]">
                            {item.property_name} · {item.unit_number}
                          </td>
                          <td className="px-[18px] py-[13px] text-[12px]">
                            {signed ? formatDate(item.signed_at) : '-'}
                          </td>
                          <td className="px-[18px] py-[13px]">
                            <StatusBadge tone={signed ? 'success' : 'warning'}>
                              {signed ? 'Signed' : 'Awaiting signature'}
                            </StatusBadge>
                          </td>
                          <td className="px-[18px] py-[13px]">
                            <div
                              className="flex justify-end gap-2"
                              onClick={(event) => event.stopPropagation()}
                            >
                              {signed ? (
                                <button
                                  onClick={() =>
                                    run(item, async () => {
                                      await unmarkAgreementSigned(item.id)
                                      agreementsState.reload()
                                    })
                                  }
                                  disabled={busy}
                                  title="Use this if the agreement was marked signed by mistake"
                                  className={smallButtonClass}
                                >
                                  {busy ? 'Working...' : 'Unmark signed'}
                                </button>
                              ) : (
                                <>
                                  <button
                                    onClick={() => setSigning(item)}
                                    disabled={busy}
                                    className={smallButtonClass}
                                  >
                                    Mark signed
                                  </button>
                                  <button
                                    onClick={() =>
                                      run(item, async () => {
                                        await regenerateAgreement(item.id)
                                        setSelectedId(item.id)
                                        agreementsState.reload()
                                      })
                                    }
                                    disabled={busy}
                                    title="Rewrite this agreement from the current template and tenant details"
                                    className={smallButtonClass}
                                  >
                                    {busy ? 'Working...' : 'Regenerate'}
                                  </button>
                                </>
                              )}
                              <button
                                onClick={() => run(item, () => downloadAgreement(item.id))}
                                disabled={busy}
                                className={smallButtonClass}
                              >
                                <Download size={14} />
                                PDF
                              </button>
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

        <section className="overflow-hidden rounded-[10px] border border-[var(--line)] bg-[var(--surface)]">
          <div className="border-b border-[var(--line)] px-[18px] py-4">
            <h3 className="text-[12px] font-bold">
              Agreement preview{selected ? ` - ${selected.tenant_name}` : ''}
            </h3>
          </div>

          <div className="p-[14px]">
            {selected ? (
              <pre className="font-mono whitespace-pre-wrap rounded-[8px] bg-[var(--bg)] p-[18px] text-[11px] leading-[1.8] text-[var(--ink-soft)]">
                {selected.rendered_content}
              </pre>
            ) : (
              <p className="px-1 py-6 text-center text-[11px] text-[var(--ink-faint)]">
                Select an agreement to preview it here.
              </p>
            )}
          </div>
        </section>
      </div>

      {templateOpen ? (
        <TemplateModal
          onClose={() => setTemplateOpen(false)}
        />
      ) : null}

      {signing ? (
        <MarkSignedModal
          agreement={signing}
          onClose={() => setSigning(null)}
          onDone={agreementsState.reload}
        />
      ) : null}
    </>
  )
}

function MarkSignedModal({ agreement, onClose, onDone }) {
  const [signedAt, setSignedAt] = useState(toDateInput())
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  async function handleSubmit(event) {
    event.preventDefault()
    setSaving(true)
    setError(null)

    try {
      await markAgreementSigned(agreement.id, {
        signed_at: signedAt,
        signed_notes: notes.trim() || null,
      })
      onDone()
      onClose()
    } catch (saveError) {
      setError(saveError)
      setSaving(false)
    }
  }

  return (
    <ModalShell title={`Mark signed - ${agreement.tenant_name}`} onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-hidden">
        <ModalBody>
          <p className="mb-[18px] text-[11px] leading-[1.5] text-[var(--ink-faint)]">
            Records that {agreement.tenant_name} has signed the agreement for
            House {agreement.unit_number}. A signed agreement is locked and
            can't be regenerated, unless you unmark it.
          </p>

          <div className="grid gap-[14px]">
            <div className="max-w-[292px]">
              <Field
                label="Date signed"
                type="date"
                max={toDateInput()}
                value={signedAt}
                onChange={(event) => setSignedAt(event.target.value)}
                required
              />
            </div>
            <Field
              label="Notes (optional)"
              placeholder="e.g. Signed copy kept at the office"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
            />
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
          <button type="submit" disabled={saving} className={primaryButtonClass}>
            {saving ? 'Saving...' : 'Mark signed'}
          </button>
        </ModalFooter>
      </form>
    </ModalShell>
  )
}

function TemplateModal({ onClose }) {
  const properties = useProperties().data || []
  // '' is the owner's default template; otherwise a property id.
  const [target, setTarget] = useState('')

  // Both shapes are reduced to { template, usingDefault } for the form.
  const templateState = useApi(`agreement-template-${target || 'default'}`, async () => {
    if (!target) {
      return { template: await getDefaultTemplate(), usingDefault: false }
    }

    const result = await getPropertyTemplate(target)

    return { template: result.effective_template, usingDefault: result.using_default }
  })

  return (
    <ModalShell title="Manage agreement templates" onClose={onClose}>
      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="px-[22px] pt-[22px]">
          <p className="mb-[18px] text-[11px] leading-[1.5] text-[var(--ink-faint)]">
            This is the wording used to auto-generate an agreement the moment a
            new tenant is added. The bracketed placeholders fill themselves in
            from the property, unit and tenant details.
          </p>

          <label className={labelClass}>Applies to</label>
          <select
            value={target}
            onChange={(event) => setTarget(event.target.value)}
            className={inputClass}
          >
            <option value="">All properties (default template)</option>
            {properties.map((property) => (
              <option key={property.id} value={property.id}>
                {property.name}
              </option>
            ))}
          </select>
        </div>

        <DataState state={templateState} loadingLabel="Loading template...">
          {(loaded) => (
            <TemplateForm
              // Remount with fresh fields whenever a different template is loaded.
              key={`${target}-${loaded.template.id}-${loaded.template.version}-${loaded.usingDefault}`}
              target={target}
              template={loaded.template}
              usingDefault={loaded.usingDefault}
              onClose={onClose}
              onChanged={templateState.reload}
            />
          )}
        </DataState>
      </div>
    </ModalShell>
  )
}

function TemplateForm({ target, template, usingDefault, onClose, onChanged }) {
  const [content, setContent] = useState(template.content)
  const [noticeDays, setNoticeDays] = useState(String(template.notice_period_days))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [savedMessage, setSavedMessage] = useState(null)

  async function run(action, message) {
    setSaving(true)
    setError(null)
    setSavedMessage(null)

    try {
      await action()
      setSavedMessage(message)
      onChanged()
    } catch (saveError) {
      setError(saveError)
    } finally {
      setSaving(false)
    }
  }

  function handleSubmit(event) {
    event.preventDefault()

    const body = { content, notice_period_days: Number(noticeDays) || 30 }

    run(
      () => (target ? savePropertyTemplate(target, body) : saveDefaultTemplate(body)),
      'Template saved. It is used for new agreements and when you regenerate an unsigned one.'
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-hidden">
      <ModalBody>
        {target ? (
          <div className="mb-[16px] flex items-center justify-between gap-4 rounded-[8px] border border-[var(--line)] bg-[var(--surface)] px-4 py-3">
            <p className="text-[11px] leading-[1.5] text-[var(--ink-faint)]">
              {usingDefault
                ? 'This property uses the default template. Saving here gives it its own.'
                : 'This property has its own template.'}
            </p>

            {usingDefault ? null : (
              <button
                type="button"
                disabled={saving}
                onClick={() =>
                  run(
                    () => deletePropertyTemplate(target),
                    'This property now uses the default template.'
                  )
                }
                className="shrink-0 rounded-[8px] border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-[11px] font-bold disabled:opacity-50"
              >
                Use default template
              </button>
            )}
          </div>
        ) : null}

        <label className={labelClass}>Template text</label>
        <textarea
          value={content}
          onChange={(event) => setContent(event.target.value)}
          rows={13}
          required
          minLength={40}
          className="font-mono w-full rounded-[8px] border border-[var(--line)] bg-[var(--surface)] p-3 text-[11px] leading-[1.7] outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)]"
        />

        <p className="mt-2 text-[10px] leading-[1.4] text-[var(--ink-faint)]">
          Available placeholders: {placeholders.map((name) => `{${name}}`).join(', ')}
        </p>

        <div className="mt-[16px] max-w-[292px]">
          <Field
            label="Notice period (days)"
            type="number"
            min="1"
            max="365"
            value={noticeDays}
            onChange={(event) => setNoticeDays(event.target.value)}
            required
            hint="Fills the {notice_period} placeholder."
          />
        </div>

        {savedMessage ? (
          <p className="mt-[14px] text-[11px] font-bold text-[var(--success)]">{savedMessage}</p>
        ) : null}

        {error ? (
          <div className="mt-[14px]">
            <FormError error={error} />
          </div>
        ) : null}
      </ModalBody>

      <ModalFooter>
        <button type="button" onClick={onClose} className={secondaryButtonClass}>
          Close
        </button>
        <button type="submit" disabled={saving} className={primaryButtonClass}>
          {saving ? 'Saving...' : 'Save template'}
        </button>
      </ModalFooter>
    </form>
  )
}

export default AgreementsPage
