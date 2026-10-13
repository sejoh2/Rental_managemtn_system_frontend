// The "play a sound" switch at the bottom of a bell's list.
function SoundToggle({ allowed, onChange }) {
  return (
    <label className="flex cursor-pointer items-start gap-2 border-t border-[var(--line)] px-3 py-[10px] text-[11px]">
      <input
        type="checkbox"
        checked={allowed}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-[2px] h-[13px] w-[13px] accent-[var(--accent)]"
      />
      <span>
        <span className="font-bold">Play a sound for new notifications</span>
        <span className="mt-[2px] block text-[10px] text-[var(--ink-faint)]">
          {allowed
            ? 'On for this device. It plays while Kodi is open in a tab.'
            : 'Off. Tick to hear a short tone when something new needs attention.'}
        </span>
      </span>
    </label>
  )
}

export default SoundToggle
