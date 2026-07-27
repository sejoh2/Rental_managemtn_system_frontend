import { useState } from 'react'
import { Download, FileText, X } from 'lucide-react'
import { agreements, agreementPreview } from '../../data/agreementsData'

const defaultTemplate = `TENANCY AGREEMENT

Landlord: {landlord_name}
Tenant: {tenant_name}
Property: {property_name}, House {unit_number}
Monthly rent: KES {monthly_rent}
Deposit: KES {deposit_amount}
Rent due: {rent_due_day} of every month
Water: billed separately per meter reading
Notice period: {notice_period} days

Signature: ______________________`

function AgreementsPage() {
  const [templateOpen, setTemplateOpen] = useState(false)

  return (
    <>
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-[10px] text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--accent)]">
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
          className="inline-flex items-center gap-2 rounded-[8px] border border-[var(--line)] bg-white px-4 py-[10px] text-[12px] font-bold"
        >
          <FileText size={15} />
          Manage templates
        </button>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.6fr_1fr]">
        <section className="overflow-hidden rounded-[10px] border border-[var(--line)] bg-white">
          <div className="flex items-center justify-between border-b border-[var(--line)] px-[18px] py-4">
            <h3 className="text-[12px] font-bold">All agreements</h3>
            <span className="text-[10px] text-[var(--ink-faint)]">123 total</span>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-[720px] w-full border-collapse">
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
                {agreements.map((item) => (
                  <tr key={item.tenant} className="border-b border-[var(--line-soft)] last:border-b-0">
                    <td className="px-[18px] py-[13px] text-[12px] font-bold">{item.tenant}</td>
                    <td className="px-[18px] py-[13px] text-[12px]">{item.unit}</td>
                    <td className="px-[18px] py-[13px] text-[12px]">{item.signed}</td>
                    <td className="px-[18px] py-[13px]">
                      <StatusBadge tone={item.tone}>{item.status}</StatusBadge>
                    </td>
                    <td className="px-[18px] py-[13px] text-right">
                      <button
                        onClick={() => window.alert('Agreement PDF downloaded successfully.')}
                        className="inline-flex items-center gap-2 rounded-[8px] border border-[var(--line)] bg-white px-3 py-2 text-[11px] font-bold"
                      >
                        <Download size={14} />
                        PDF
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="overflow-hidden rounded-[10px] border border-[var(--line)] bg-white">
          <div className="border-b border-[var(--line)] px-[18px] py-4">
            <h3 className="text-[12px] font-bold">Agreement preview</h3>
          </div>

          <div className="p-[14px]">
            <pre className="font-mono whitespace-pre-wrap rounded-[8px] bg-[var(--bg)] p-[18px] text-[11px] leading-[1.8] text-[var(--ink-soft)]">
              {agreementPreview.join('\n')}
            </pre>
          </div>
        </section>
      </div>

      <TemplateModal open={templateOpen} onClose={() => setTemplateOpen(false)} />
    </>
  )
}

function TemplateModal({ open, onClose }) {
  const [template, setTemplate] = useState(defaultTemplate)

  if (!open) return null

  function saveTemplate() {
    window.alert('Agreement template saved successfully.')
    onClose()
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/45 px-4 py-8">
      <div className="w-full max-w-[640px] overflow-hidden rounded-[14px] bg-white shadow-[0_24px_80px_rgba(0,0,0,0.28)]">
        <div className="flex items-center justify-between border-b border-[var(--line)] px-[22px] py-[18px]">
          <h2 className="font-display text-[15px] font-semibold">
            Manage agreement templates
          </h2>

          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--line-soft)] text-[var(--ink-soft)]"
          >
            <X size={15} />
          </button>
        </div>

        <div className="px-[22px] py-[22px]">
          <p className="mb-[18px] text-[11px] leading-[1.5] text-[var(--ink-faint)]">
            This is the wording used to auto-generate an agreement the moment a
            new tenant is added. The bracketed placeholders fill themselves in
            from the property, unit and tenant details.
          </p>

          <label className="mb-2 block text-[11px] font-bold text-[var(--ink)]">
            Applies to
          </label>
          <select className="mb-[16px] h-10 w-full rounded-[8px] border border-[var(--line)] bg-white px-3 text-[12px] outline-none">
            <option>All properties (default template)</option>
            <option>Green View Apartments</option>
            <option>Sunrise Bedsitters</option>
            <option>Riverside Court</option>
          </select>

          <label className="mb-2 block text-[11px] font-bold text-[var(--ink)]">
            Template text
          </label>
          <textarea
            value={template}
            onChange={(event) => setTemplate(event.target.value)}
            rows={13}
            className="font-mono w-full rounded-[8px] border border-[var(--line)] bg-white p-3 text-[11px] leading-[1.7] outline-none"
          />

          <p className="mt-2 text-[10px] leading-[1.4] text-[var(--ink-faint)]">
            Available placeholders: {'{landlord_name}'}, {'{tenant_name}'}, {'{property_name}'}, {'{unit_number}'}, {'{monthly_rent}'}, {'{deposit_amount}'}, {'{rent_due_day}'}, {'{notice_period}'}, {'{move_in_date}'}
          </p>
        </div>

        <div className="flex justify-end gap-[10px] border-t border-[var(--line)] px-[22px] py-[16px]">
          <button
            onClick={onClose}
            className="rounded-[8px] border border-[var(--line)] bg-white px-5 py-[10px] text-[12px] font-bold"
          >
            Cancel
          </button>
          <button
            onClick={saveTemplate}
            className="rounded-[8px] border border-[var(--accent)] bg-[var(--accent)] px-5 py-[10px] text-[12px] font-bold text-white"
          >
            Save template
          </button>
        </div>
      </div>
    </div>
  )
}

function StatusBadge({ tone, children }) {
  const tones = {
    success: 'bg-[#E3F1E8] text-[#2E7D4F]',
    warning: 'bg-[#FBF0DA] text-[#B8790E]',
  }

  return (
    <span className={`inline-flex items-center gap-[6px] rounded-full px-[9px] py-[3px] text-[9px] font-bold ${tones[tone]}`}>
      <span className="h-[6px] w-[6px] rounded-full bg-current" />
      {children}
    </span>
  )
}

export default AgreementsPage