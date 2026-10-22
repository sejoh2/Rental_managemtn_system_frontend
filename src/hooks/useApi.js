import { useCallback, useEffect, useEffectEvent, useState } from 'react'
import { DATA_CHANGED } from './useLiveBell'

// A burst of changes (a whole month billed at once) is one look.
const GATHER_MS = 600

/*
  Loads data for a page and tracks loading / error state.

  key   - identifies what is being loaded (e.g. `units-${propertyId}`);
          the loader re-runs whenever it changes. Pass null to skip loading.
  loader - async function returning the data.

  It also looks again by itself when the live connection says data changed
  (useLiveBell), so every page is up to date without a reload.

  const { data, loading, error, reload } = useApi(`units-${id}`, () => listUnits(id))
*/
export function useApi(key, loader) {
  const [version, setVersion] = useState(0)
  const [result, setResult] = useState({ key: null, version: 0, data: null, error: null })

  const runLoader = useEffectEvent(() => loader())

  useEffect(() => {
    if (key === null || key === undefined) return undefined

    let cancelled = false

    runLoader().then(
      (data) => {
        if (!cancelled) setResult({ key, version, data, error: null })
      },
      (error) => {
        if (!cancelled) setResult({ key, version, data: null, error })
      }
    )

    return () => {
      cancelled = true
    }
  }, [key, version])

  const reload = useCallback(() => setVersion((current) => current + 1), [])

  // Real time: when the server says data changed, the page looks again by itself.
  // What is on screen stays until the new data arrives, so nothing flickers.
  useEffect(() => {
    if (key === null || key === undefined) return undefined

    let timer = null

    function changed() {
      clearTimeout(timer)
      timer = setTimeout(reload, GATHER_MS)
    }

    window.addEventListener(DATA_CHANGED, changed)

    return () => {
      clearTimeout(timer)
      window.removeEventListener(DATA_CHANGED, changed)
    }
  }, [key, reload])

  const enabled = key !== null && key !== undefined
  const sameKey = enabled && result.key === key
  const settled = sameKey && result.version === version

  return {
    // Data from a previous reload stays visible while refreshing; data for another key does not.
    data: sameKey ? result.data : null,
    error: settled ? result.error : null,
    loading: enabled && !settled,
    reload,
  }
}
