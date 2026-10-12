import { useState } from 'react'
import { Download } from 'lucide-react'
import { exportReport } from '../../api/reports'
import { useProperties } from '../../context/PropertiesContext'
import { REPORT_PERIODS, REPORT_TYPES } from '../../utils/labels'
import { FormError } from '../common/DataState'
import {
  ModalBody,
  ModalFooter,
  ModalShell,
  SelectField,
  labelClass,
  primaryButtonClass,
  secondaryButtonClass,
} from '../common/Modal'

/*
  Downloads a report built by the backend, as PDF or CSV.
  defaultPropertyId / defaultPeriod start the form on what the page is showing.
*/
function ExportReportModal({ open, ...props }) {
  if (!open) return null

  return <ExportReportForm {...props} />
}

function ExportReportForm({ onClose, defaultPropertyId = '', defaultPeriod = 'this_month' }) {
  const properties = useProperties().data || []

  const [form, setForm] = useState({
    type: 'full_monthly_summary',
    property_id: String(defaultPropertyId || ''),
    period: defaultPeriod,
    format: 'pdf',
  })
  const [working, setWorking] = useState(false)
  const [error, setError] = useState(null)

  function setField(field) {
    return (event) => setForm((current) => ({ ...current, [field]: event.target.value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setWorking(true)
    setError(null)

    try {
      await exportReport(form)
      onClose()
    } catch (exportError) {
      setError(exportError)
      setWorking(false)
    }
  }

  return (
    <ModalShell title="Export report" onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-hidden">
        <ModalBody>
          <p className="mb-[18px] text-[11px] leading-[1.5] text-[var(--ink-faint)]">
            Download a report for the period and properties you choose. Each
            report gives the totals, then a line per tenant under them.
          </p>

          <div className="grid gap-[18px]">
            <SelectField
              label="What to include"
              value={form.type}
              onChange={setField('type')}
              options={REPORT_TYPES}
            />

            <div className="grid gap-[14px] sm:grid-cols-2">
              <SelectField
                label="Property"
                value={form.property_id}
                onChange={setField('property_id')}
                options={[
                  ['', `All ${properties.length || ''} properties`.replace('  ', ' ')],
                  ...properties.map((property) => [String(property.id), property.name]),
                ]}
              />
              <SelectField
                label="Period"
                value={form.period}
                onChange={setField('period')}
                options={REPORT_PERIODS}
              />
            </div>

            <div>
              <label className={labelClass}>Format</label>

              <div className="flex flex-wrap gap-5 text-[12px] text-[var(--ink)]">
                {[
                  ['pdf', 'PDF'],
                  ['csv', 'Excel (CSV)'],
                ].map(([value, label]) => (
                  <label key={value} className="inline-flex items-center gap-2">
                    <input
                      type="radio"
                      name="format"
                      checked={form.format === value}
                      onChange={() => setForm((current) => ({ ...current, format: value }))}
                    />
                    {label}
                  </label>
                ))}
              </div>
            </div>
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
            type="submit"
            disabled={working}
            className={`inline-flex items-center gap-2 ${primaryButtonClass}`}
          >
            <Download size={15} />
            {working ? 'Preparing...' : 'Generate report'}
          </button>
        </ModalFooter>
      </form>
    </ModalShell>
  )
}

export default ExportReportModal
