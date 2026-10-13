import { useSyncExternalStore } from 'react'
import { Download } from 'lucide-react'
import { canInstall, installApp, isInstalled, subscribeToInstall } from '../../utils/installApp'

// Offers to install the app on this device, or says how when the browser gives no button.
function InstallApp() {
  const available = useSyncExternalStore(subscribeToInstall, canInstall)

  if (isInstalled()) {
    return (
      <p className="text-[11px] leading-[1.5] text-[var(--ink-faint)]">
        The app is installed on this device, and this is it.
      </p>
    )
  }

  return (
    <div>
      <button
        type="button"
        onClick={installApp}
        disabled={!available}
        className="inline-flex items-center gap-2 rounded-[8px] border border-[var(--line)] bg-[var(--surface)] px-4 py-[10px] text-[12px] font-bold disabled:opacity-50"
      >
        <Download size={15} />
        Install app
      </button>

      {available ? null : (
        <p className="mt-2 max-w-[520px] text-[10px] leading-[1.5] text-[var(--ink-faint)]">
          This browser has not offered a button. On a phone, open the browser&apos;s menu and choose
          &quot;Add to Home screen&quot; (on an iPhone: Share, then &quot;Add to Home Screen&quot;). On
          a computer, use the install icon at the end of the address bar in Chrome or Edge.
        </p>
      )}
    </div>
  )
}

export default InstallApp
