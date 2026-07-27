import { useState } from 'react'
import { Plus, X } from 'lucide-react'
import { caretakers } from '../../data/caretakersData'

function CaretakersPage() {
  const [addOpen, setAddOpen] = useState(false)
  const [selectedCaretaker, setSelectedCaretaker] = useState(null)

  return (
    <>
      <div className="mb-7 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-[10px] text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--accent)]">
            Operations
          </div>
          <h1 className="font-display text-[20px] font-semibold tracking-[-0.01em]">
            Caretakers
          </h1>
          <p className="mt-2 text-[12px] text-[var(--ink-soft)]">
            Manage caretaker accounts and what they can access.
          </p>
        </div>

        <button
          onClick={() => setAddOpen(true)}
          className="inline-flex items-center gap-2 rounded-[8px] border border-[var(--accent)] bg-[var(--accent)] px-4 py-[10px] text-[12px] font-bold text-white"
        >
          <Plus size={15} />
          Add caretaker
        </button>
      </div>

      <section className="overflow-hidden rounded-[10px] border border-[var(--line)] bg-white">
        <div className="overflow-x-auto">
          <table className="min-w-[880px] w-full border-collapse">
            <thead>
              <tr className="bg-[var(--bg)] text-left text-[9px] uppercase tracking-[0.05em] text-[var(--ink-faint)]">
                <th className="px-[18px] py-[10px] font-bold">Caretaker</th>
                <th className="px-[18px] py-[10px] font-bold">Assigned property</th>
                <th className="px-[18px] py-[10px] font-bold">Permission level</th>
                <th className="px-[18px] py-[10px] font-bold">Status</th>
                <th className="px-[18px] py-[10px] font-bold"></th>
              </tr>
            </thead>
            <tbody>
              {caretakers.map((item) => (
                <tr key={item.name} className="border-b border-[var(--line-soft)] last:border-b-0">
                  <td className="px-[18px] py-[13px]">
                    <div className="text-[12px] font-bold">{item.name}</div>
                    <div className="mt-[3px] text-[10px] text-[var(--ink-faint)]">
                      {item.phone}
                    </div>
                  </td>

                  <td className="px-[18px] py-[13px] text-[12px]">
                    {item.property}
                  </td>

                  <td className="px-[18px] py-[13px]">
                    <PermissionBadge tone={item.permissionTone}>
                      {item.permission}
                    </PermissionBadge>
                  </td>

                  <td className="px-[18px] py-[13px]">
                    <StatusBadge tone={item.statusTone}>{item.status}</StatusBadge>
                  </td>

                  <td className="px-[18px] py-[13px]">
                    <button
                      onClick={() => setSelectedCaretaker(item)}
                      className="rounded-[8px] border border-[var(--line)] bg-white px-3 py-2 text-[11px] font-bold transition hover:border-[var(--accent-soft-line)] hover:text-[var(--accent)]"
                    >
                      Manage
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <AddCaretakerModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
      />

      <ManageCaretakerModal
        caretaker={selectedCaretaker}
        onClose={() => setSelectedCaretaker(null)}
      />
    </>
  )
}

function AddCaretakerModal({ open, onClose }) {
  if (!open) return null

  function handleSubmit(event) {
    event.preventDefault()
    window.alert('Caretaker added successfully.')
    onClose()
  }

  return (
    <ModalShell title="Add caretaker" onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <div className="px-[22px] py-[22px]">
          <div className="mb-[18px]">
            <Field label="Full name" placeholder="e.g. Ruth Chebet" />
          </div>

          <div className="mb-[18px]">
            <Field label="Phone number" placeholder="e.g. 0733 908 771" />
          </div>

          <div className="mb-[18px]">
            <label className="mb-2 block text-[11px] font-bold text-[var(--ink)]">
              Assigned property
            </label>
            <select className="h-10 w-full rounded-[8px] border border-[var(--line)] bg-white px-3 text-[12px] text-[var(--ink)] outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)]">
              <option>Green View Apartments - currently: Peter Mwangi</option>
              <option>Sunrise Bedsitters - currently: Ruth Chebet</option>
              <option>Riverside Court - currently: James Odhiambo</option>
            </select>

            <p className="mt-2 text-[10px] text-[var(--ink-faint)]">
              Every property has exactly one caretaker. Picking a property above
              will replace its current caretaker.
            </p>
          </div>

          <div className="mb-[18px]">
            <label className="mb-2 block text-[11px] font-bold text-[var(--ink)]">
              Permission level
            </label>
            <select className="h-10 w-full rounded-[8px] border border-[var(--line)] bg-white px-3 text-[12px] text-[var(--ink)] outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)]">
              <option>Level 1 - View tenants, submit readings & reports</option>
              <option>Level 2 - Also add / edit tenants</option>
            </select>
          </div>

          <div className="mb-[12px] rounded-[8px] border border-[var(--line)] border-l-2 border-l-[#B8790E] bg-white px-4 py-4">
            <h3 className="text-[14px] font-bold text-[#B8790E]">
              This will replace the current caretaker
            </h3>
            <p className="mt-1 text-[11px] leading-[1.5] text-[var(--ink-faint)]">
              Peter Mwangi will lose caretaker access to Green View Apartments
              as soon as you save.
            </p>
          </div>

          <p className="text-[11px] leading-[1.5] text-[var(--ink-faint)]">
            The caretaker will sign in with their phone number and a one-time
            code - no password to set up.
          </p>
        </div>

        <ModalFooter>
          <button
            type="button"
            onClick={onClose}
            className="rounded-[8px] border border-[var(--line)] bg-white px-5 py-[10px] text-[12px] font-bold"
          >
            Cancel
          </button>

          <button
            type="submit"
            className="rounded-[8px] border border-[var(--accent)] bg-[var(--accent)] px-5 py-[10px] text-[12px] font-bold text-white"
          >
            Add caretaker
          </button>
        </ModalFooter>
      </form>
    </ModalShell>
  )
}

function ManageCaretakerModal({ caretaker, onClose }) {
  if (!caretaker) return null

  function saveChanges(event) {
    event.preventDefault()
    window.alert(`${caretaker.name}'s caretaker settings were saved successfully.`)
    onClose()
  }

  function removeCaretaker() {
    window.alert(`${caretaker.name} has been removed from this property.`)
    onClose()
  }

  return (
    <ModalShell title={`Manage caretaker - ${caretaker.name}`} onClose={onClose}>
      <form onSubmit={saveChanges}>
        <div className="px-[22px] py-[22px]">
          <div className="mb-[18px]">
            <Field label="Full name" defaultValue={caretaker.name} />
          </div>

          <div className="mb-[18px]">
            <Field label="Phone number" defaultValue={caretaker.phone} />
          </div>

          <div className="mb-[18px]">
            <label className="mb-2 block text-[11px] font-bold text-[var(--ink)]">
              Assigned property
            </label>
            <select
              defaultValue={caretaker.property}
              className="h-10 w-full rounded-[8px] border border-[var(--line)] bg-white px-3 text-[12px] text-[var(--ink)] outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)]"
            >
              <option>Green View Apartments</option>
              <option>Sunrise Bedsitters</option>
              <option>Riverside Court</option>
            </select>
          </div>

          <div className="mb-[18px]">
            <label className="mb-2 block text-[11px] font-bold text-[var(--ink)]">
              Permission level
            </label>
            <select
              defaultValue={
                caretaker.permission.includes('Level 2')
                  ? 'Level 2 - Also add / edit tenants'
                  : 'Level 1 - View tenants, submit readings & reports'
              }
              className="h-10 w-full rounded-[8px] border border-[var(--line)] bg-white px-3 text-[12px] text-[var(--ink)] outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)]"
            >
              <option>Level 1 - View tenants, submit readings & reports</option>
              <option>Level 2 - Also add / edit tenants</option>
            </select>
          </div>

          <div className="mb-[18px]">
            <label className="mb-2 block text-[11px] font-bold text-[var(--ink)]">
              Status
            </label>
            <select
              defaultValue={caretaker.status === 'Active' ? 'Active' : 'Inactive - suspend access'}
              className="h-10 w-full rounded-[8px] border border-[var(--line)] bg-white px-3 text-[12px] text-[var(--ink)] outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)]"
            >
              <option>Active</option>
              <option>Inactive - suspend access</option>
            </select>
          </div>

          <div className="my-[18px] h-px bg-[var(--line)]" />

          <p className="mb-[10px] text-[11px] text-[var(--ink-faint)]">
            Recent activity: 12 water readings and 1 maintenance report
            submitted in the last 30 days.
          </p>

          <div className="rounded-[8px] border border-[var(--line)] border-l-2 border-l-[#B3261E] bg-white px-4 py-4">
            <h3 className="text-[14px] font-bold text-[#B3261E]">
              Remove caretaker
            </h3>
            <p className="mt-1 text-[11px] leading-[1.5] text-[var(--ink-faint)]">
              Revokes their login immediately. Readings and reports they already
              submitted stay on record. This property will have no caretaker
              until you add a new one.
            </p>

            <button
              type="button"
              onClick={removeCaretaker}
              className="mt-3 rounded-[8px] border border-[#B3261E] bg-white px-3 py-2 text-[11px] font-bold text-[#B3261E]"
            >
              Remove caretaker
            </button>
          </div>
        </div>

        <ModalFooter>
          <button
            type="button"
            onClick={onClose}
            className="rounded-[8px] border border-[var(--line)] bg-white px-5 py-[10px] text-[12px] font-bold"
          >
            Cancel
          </button>

          <button
            type="submit"
            className="rounded-[8px] border border-[var(--accent)] bg-[var(--accent)] px-5 py-[10px] text-[12px] font-bold text-white"
          >
            Save changes
          </button>
        </ModalFooter>
      </form>
    </ModalShell>
  )
}

function Field({ label, placeholder, defaultValue }) {
  return (
    <div>
      <label className="mb-2 block text-[11px] font-bold text-[var(--ink)]">
        {label}
      </label>
      <input
        placeholder={placeholder}
        defaultValue={defaultValue}
        className="h-10 w-full rounded-[8px] border border-[var(--line)] bg-white px-3 text-[12px] text-[var(--ink)] outline-none placeholder:text-[var(--ink-faint)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)]"
      />
    </div>
  )
}

function ModalShell({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/45 px-4 py-8">
      <div className="w-full max-w-[640px] overflow-hidden rounded-[14px] bg-white shadow-[0_24px_80px_rgba(0,0,0,0.28)]">
        <div className="flex items-center justify-between border-b border-[var(--line)] px-[22px] py-[18px]">
          <h2 className="font-display text-[15px] font-semibold text-[var(--ink)]">
            {title}
          </h2>

          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--line-soft)] text-[var(--ink-soft)] transition hover:bg-[var(--line)] hover:text-[var(--ink)]"
          >
            <X size={15} />
          </button>
        </div>

        {children}
      </div>
    </div>
  )
}

function ModalFooter({ children }) {
  return (
    <div className="flex justify-end gap-[10px] border-t border-[var(--line)] px-[22px] py-[16px]">
      {children}
    </div>
  )
}

function PermissionBadge({ tone, children }) {
  const tones = {
    accent: 'bg-[var(--accent-soft)] text-[var(--accent-hover)]',
    neutral: 'bg-[var(--line-soft)] text-[var(--ink-soft)]',
  }

  return (
    <span className={`inline-flex items-center gap-[6px] rounded-full px-[9px] py-[3px] text-[9px] font-bold ${tones[tone]}`}>
      <span className="h-[6px] w-[6px] rounded-full bg-current" />
      {children}
    </span>
  )
}

function StatusBadge({ tone, children }) {
  const tones = {
    success: 'bg-[#E3F1E8] text-[#2E7D4F]',
    neutral: 'bg-[var(--line-soft)] text-[var(--ink-soft)]',
  }

  return (
    <span className={`inline-flex items-center gap-[6px] rounded-full px-[9px] py-[3px] text-[9px] font-bold ${tones[tone]}`}>
      <span className="h-[6px] w-[6px] rounded-full bg-current" />
      {children}
    </span>
  )
}

export default CaretakersPage