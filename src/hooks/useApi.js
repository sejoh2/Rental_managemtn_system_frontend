import { useCallback, useEffect, useEffectEvent, useState } from 'react'

/*
  Loads data for a page and tracks loading / error state.

  key   - identifies what is being loaded (e.g. `units-${propertyId}`);
          the loader re-runs whenever it changes. Pass null to skip loading.
  loader - async function returning the data.

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
