import { useEffect, useRef } from 'react'
import { openLiveBell } from '../api/live'

// Waits this long after the first "look again", so a burst of changes is one look.
const GATHER_MS = 500
const FIRST_RETRY_MS = 5000
const LONGEST_RETRY_MS = 120000

// Sent on window when the server says data changed: { area, property_id }.
export const DATA_CHANGED = 'kodi-data-changed'

/*
  Keeps a live connection for a bell and calls onChange when the server says it
  changed, and once each time the connection (re)opens, to catch up on anything
  missed while it was down. If the connection drops, it opens again with a new
  pass, waiting longer after each failure.

  scope - 'admin' | 'owner'
*/
export function useLiveBell(scope, onChange) {
  const latest = useRef(onChange)

  useEffect(() => {
    latest.current = onChange
  }, [onChange])

  useEffect(() => {
    // Old browsers without live connections rely on the regular checks.
    if (typeof EventSource === 'undefined') return undefined

    let source = null
    let retryTimer = null
    let gatherTimer = null
    let retryIn = FIRST_RETRY_MS
    let stopped = false

    function changed() {
      clearTimeout(gatherTimer)
      gatherTimer = setTimeout(() => latest.current(), GATHER_MS)
    }

    function retry() {
      if (stopped) return

      clearTimeout(retryTimer)
      retryTimer = setTimeout(connect, retryIn)
      retryIn = Math.min(retryIn * 2, LONGEST_RETRY_MS)
    }

    async function connect() {
      try {
        const opened = await openLiveBell(scope)

        if (stopped) {
          opened.close()
          return
        }

        source = opened

        source.addEventListener('ready', () => {
          retryIn = FIRST_RETRY_MS
          changed()
          // Anything missed while the connection was down: every page looks again.
          window.dispatchEvent(new CustomEvent(DATA_CHANGED, { detail: { area: 'all' } }))
        })

        source.addEventListener('bell', changed)

        // Data on screens changed (by anyone: the caretaker, M-Pesa, a job). Every
        // open page looks again (see useApi), also when the connection reopens.
        source.addEventListener('changed', (event) => {
          let detail = {}

          try {
            detail = JSON.parse(event.data)
          } catch {
            // Without details every page still looks again.
          }

          window.dispatchEvent(new CustomEvent(DATA_CHANGED, { detail }))
        })

        // The pass is single-use in practice (it runs out after a minute), so a
        // dropped connection is reopened here with a new one, not by the browser.
        source.onerror = () => {
          source.close()
          retry()
        }
      } catch {
        retry()
      }
    }

    connect()

    return () => {
      stopped = true
      clearTimeout(retryTimer)
      clearTimeout(gatherTimer)
      source?.close()
    }
  }, [scope])
}
