import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { inputClass, labelClass } from './Modal'

/*
  A select with a search box, for lists too long to scroll through.

  options: [{ value, label, hint?, group? }]. Options are shown under their
  group heading, in the order given. hint is a second, smaller line.

  <SearchableSelect label="Send to" value={value} onChange={setValue} options={options} />
*/
function SearchableSelect({ label, value, onChange, options, placeholder = 'Search...' }) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')

  const selected = options.find((option) => option.value === value)
  const words = search.trim().toLowerCase().split(/\s+/).filter(Boolean)
  const matches = options.filter((option) => {
    const text = `${option.label} ${option.hint || ''}`.toLowerCase()

    return words.every((word) => text.includes(word))
  })

  function close() {
    setOpen(false)
    setSearch('')
  }

  function choose(option) {
    onChange(option.value)
    close()
  }

  return (
    <div className="relative">
      {label ? <label className={labelClass}>{label}</label> : null}

      {open ? (
        <input
          type="text"
          autoFocus
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          // Lets a click on an option register before the list closes.
          onBlur={() => setTimeout(close, 150)}
          onKeyDown={(event) => {
            if (event.key === 'Escape') close()

            if (event.key === 'Enter') {
              event.preventDefault()
              if (matches[0]) choose(matches[0])
            }
          }}
          placeholder={placeholder}
          className={inputClass}
        />
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className={`${inputClass} flex items-center justify-between gap-2 text-left`}
        >
          <span className={`truncate ${selected ? '' : 'text-[var(--ink-faint)]'}`}>
            {selected ? selected.label : placeholder}
          </span>
          <ChevronDown size={14} className="shrink-0 text-[var(--ink-faint)]" />
        </button>
      )}

      {open ? (
        <div className="absolute left-0 right-0 z-10 mt-1 max-h-[240px] overflow-y-auto rounded-[8px] border border-[var(--line)] bg-[var(--surface)] py-1 shadow-[0_10px_24px_rgba(32,28,24,0.12)]">
          {matches.length ? (
            matches.map((option, index) => (
              <div key={option.value}>
                {option.group && option.group !== matches[index - 1]?.group ? (
                  <div className="px-3 pb-1 pt-2 text-[9px] font-bold uppercase tracking-[0.05em] text-[var(--ink-faint)]">
                    {option.group}
                  </div>
                ) : null}

                <button
                  type="button"
                  // mousedown fires before the search box loses focus.
                  onMouseDown={(event) => {
                    event.preventDefault()
                    choose(option)
                  }}
                  className={`block w-full px-3 py-2 text-left text-[12px] hover:bg-[var(--line-soft)] ${
                    option.value === value ? 'font-bold text-[var(--accent-ink)]' : 'text-[var(--ink)]'
                  }`}
                >
                  {option.label}
                  {option.hint ? (
                    <span className="block text-[10px] font-normal text-[var(--ink-faint)]">
                      {option.hint}
                    </span>
                  ) : null}
                </button>
              </div>
            ))
          ) : (
            <div className="px-3 py-3 text-[11px] text-[var(--ink-faint)]">Nothing matches "{search}".</div>
          )}
        </div>
      ) : null}
    </div>
  )
}

export default SearchableSelect
