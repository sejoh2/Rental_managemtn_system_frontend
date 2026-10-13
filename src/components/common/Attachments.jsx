import { useRef, useState } from 'react'
import { FileText, Image, Upload, X } from 'lucide-react'
import { deleteFile, getFileLink, listFiles, uploadFile } from '../../api/files'
import { useApi } from '../../hooks/useApi'
import { formatDateTime } from '../../utils/format'
import { FormError } from './DataState'
import { inputClass } from './Modal'

const MAX_BYTES = 5 * 1024 * 1024
const ACCEPT = 'image/jpeg,image/png,image/webp,application/pdf'

const smallButtonClass =
  'rounded-[8px] border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-[11px] font-bold disabled:opacity-50'

// "70 B", "48 KB", "1.2 MB"
function fileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

/*
  The files attached to one record, with upload, open and delete.

  kind      'tenant_document' | 'expense_receipt' | 'meter_photo'
  targetId  the tenant, expense or water reading
  labelHint placeholder for the optional description, e.g. "ID copy"
  compact   one "Attach file" button and nothing to type, for the panel under a table row
  onChanged called after a file is added or deleted
*/
function Attachments({ kind, targetId, labelHint, emptyText, compact = false, onChanged }) {
  const state = useApi(`files-${kind}-${targetId}`, () => listFiles(kind, targetId))
  const input = useRef(null)
  const [label, setLabel] = useState('')
  const [working, setWorking] = useState(null)
  const [error, setError] = useState(null)
  // The file whose delete is waiting for a second click.
  const [confirming, setConfirming] = useState(null)

  const files = state.data || []

  async function run(name, action) {
    setWorking(name)
    setError(null)

    try {
      await action()
    } catch (actionError) {
      setError(actionError)
    } finally {
      setWorking(null)
    }
  }

  function handleChosen(event) {
    const file = event.target.files[0]

    // Lets the same file be chosen again after a failed upload.
    event.target.value = ''

    if (!file) return

    if (file.size > MAX_BYTES) {
      setError({ message: `${file.name} is ${fileSize(file.size)}. The limit is 5 MB.` })
      return
    }

    run('upload', async () => {
      await uploadFile(kind, targetId, file, label.trim())
      setLabel('')
      state.reload()
      onChanged?.()
    })
  }

  // Opened in a new tab through a link that works for a few minutes.
  function open(file) {
    // The tab is opened at once, so the browser does not block it as a pop-up.
    const tab = window.open('', '_blank')

    run(`open-${file.id}`, async () => {
      try {
        const { url } = await getFileLink(file.id)

        if (tab) tab.location = url
        else window.location.assign(url)
      } catch (openError) {
        tab?.close()
        throw openError
      }
    })
  }

  function remove(file) {
    run(`delete-${file.id}`, async () => {
      await deleteFile(file.id)
      setConfirming(null)
      state.reload()
      onChanged?.()
    })
  }

  return (
    <div>
      {state.error ? <FormError error={state.error} /> : null}

      {state.data && !files.length ? (
        <p className="text-[11px] leading-[1.5] text-[var(--ink-faint)]">{emptyText}</p>
      ) : null}

      {!state.data && !state.error ? (
        <p className="text-[11px] text-[var(--ink-faint)]">Loading files...</p>
      ) : null}

      {files.map((file) => {
        const Icon = file.content_type === 'application/pdf' ? FileText : Image

        return (
          <div
            key={file.id}
            className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--line-soft)] py-[10px] text-[12px] last:border-b-0"
          >
            <span className="flex min-w-0 items-start gap-2">
              <Icon size={16} className="mt-[2px] shrink-0 text-[var(--ink-faint)]" />
              <span className="min-w-0">
                <span className="block truncate font-bold">{file.label || file.name}</span>
                <span className="block truncate text-[10px] text-[var(--ink-faint)]">
                  {file.label ? `${file.name} · ` : ''}
                  {fileSize(file.size_bytes)} · {formatDateTime(file.created_at)}
                  {file.uploaded_by_name ? ` · ${file.uploaded_by_name}` : ''}
                </span>
              </span>
            </span>

            <span className="flex shrink-0 gap-2">
              {confirming === file.id ? (
                <>
                  <button
                    type="button"
                    onClick={() => remove(file)}
                    disabled={working !== null}
                    className="rounded-[8px] border border-[var(--danger-solid)] bg-[var(--danger-solid)] px-3 py-2 text-[11px] font-bold text-white disabled:opacity-50"
                  >
                    {working === `delete-${file.id}` ? 'Deleting...' : 'Delete for good'}
                  </button>
                  <button type="button" onClick={() => setConfirming(null)} className={smallButtonClass}>
                    Keep
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => open(file)}
                    disabled={working !== null}
                    className={smallButtonClass}
                  >
                    {working === `open-${file.id}` ? 'Opening...' : 'Open'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirming(file.id)}
                    disabled={working !== null}
                    className="rounded-[8px] border border-[var(--danger)] bg-[var(--surface)] px-3 py-2 text-[11px] font-bold text-[var(--danger)] disabled:opacity-50"
                  >
                    Delete
                  </button>
                </>
              )}
            </span>
          </div>
        )
      })}

      {error ? (
        <div className="mt-3">
          <FormError error={error} />
        </div>
      ) : null}

      <div className={`${compact ? 'mt-3' : 'mt-4'} flex flex-wrap items-center gap-[10px]`}>
        {compact ? null : (
          <input
            type="text"
            value={label}
            onChange={(event) => setLabel(event.target.value)}
            placeholder={`What is it? (optional)${labelHint ? ` e.g. ${labelHint}` : ''}`}
            maxLength={120}
            className={`${inputClass} max-w-[280px]`}
          />
        )}

        <input ref={input} type="file" accept={ACCEPT} onChange={handleChosen} className="hidden" />

        <button
          type="button"
          onClick={() => input.current.click()}
          disabled={working !== null}
          className="inline-flex items-center gap-2 rounded-[8px] border border-[var(--accent)] bg-[var(--accent)] px-4 py-[10px] text-[12px] font-bold text-white disabled:opacity-50"
        >
          <Upload size={14} />
          {working === 'upload' ? 'Uploading...' : compact ? 'Attach file' : 'Upload a file'}
        </button>

        {compact ? (
          <span className="text-[10px] text-[var(--ink-faint)]">
            A photo (JPG, PNG, WEBP) or a PDF, up to 5 MB.
          </span>
        ) : null}
      </div>

      {compact ? null : (
        <p className="mt-2 text-[10px] leading-[1.5] text-[var(--ink-faint)]">
          A photo (JPG, PNG, WEBP) or a PDF, up to 5 MB. Files are stored
          privately; only you can open them, and each opening is recorded.
        </p>
      )}
    </div>
  )
}

// The same list opened under a table row, for the record on that row. No window is opened.
export function AttachmentsRow({ colSpan, title, onClose, ...props }) {
  return (
    <tr className="border-b border-[var(--line-soft)] bg-[var(--bg)] last:border-b-0">
      <td colSpan={colSpan} className="px-[18px] py-[14px] text-left text-[var(--ink)]">
        <div className="mb-2 flex items-center justify-between gap-3">
          <h4 className="text-[11px] font-bold">{title}</h4>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="text-[var(--ink-faint)] hover:text-[var(--ink)]"
          >
            <X size={15} />
          </button>
        </div>

        <Attachments compact {...props} />
      </td>
    </tr>
  )
}

export default Attachments
