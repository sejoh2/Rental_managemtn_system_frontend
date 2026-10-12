import { Monitor, Moon, Sun } from 'lucide-react'
import { useTheme } from '../../context/ThemeContext'
import { THEME_MODES } from '../../utils/labels'

const icons = { light: Sun, dark: Moon, system: Monitor }

// One click moves to the next mode: Light, Dark, Follow device.
function ThemeToggle() {
  const { mode, setMode } = useTheme()

  const index = THEME_MODES.findIndex(([value]) => value === mode)
  const [nextMode, nextLabel] = THEME_MODES[(index + 1) % THEME_MODES.length]
  const Icon = icons[mode]
  const label = `Appearance: ${THEME_MODES[index][1]}. Click for ${nextLabel}.`

  return (
    <button
      type="button"
      onClick={() => setMode(nextMode)}
      title={label}
      aria-label={label}
      className="flex h-9 w-9 items-center justify-center rounded-[8px] border border-[var(--line)] bg-[var(--surface)] text-[var(--ink-soft)]"
    >
      <Icon size={17} />
    </button>
  )
}

export default ThemeToggle
