import { useCallback, useEffect, useRef, useState } from 'react'
import { MessageCircle, Send, X } from 'lucide-react'

/*
  The chat with Kodi's assistant on the home page (the customer agent,
  a separate service: VITE_AGENT_URL). Visitors chat first and give
  their details when it helps; the browser keeps a random chat key for
  30 days so a returning visitor carries on. Replies the owner sends
  later appear while the chat is open (checked every 5 seconds).

  Hidden when VITE_AGENT_URL is not set. VITE_AGENT_WHATSAPP is the
  business WhatsApp number the agent answers (digits only), for
  "Continue on WhatsApp".
*/

const AGENT_URL = (import.meta.env.VITE_AGENT_URL || '').replace(/\/+$/, '')
const AGENT_WHATSAPP = (import.meta.env.VITE_AGENT_WHATSAPP || '').replace(/\D/g, '')
const KEY_STORAGE = 'kodi_chat_key'
const POLL_MS = 5000

const GREETING =
  "Hi, I'm Kodi's assistant, an AI. Ask me anything about managing your rentals with Kodi, or ask for a free demo. Unaweza pia kuandika kwa Kiswahili."

function readKey() {
  try {
    return localStorage.getItem(KEY_STORAGE)
  } catch {
    return null
  }
}

function saveKey(key) {
  try {
    if (key) localStorage.setItem(KEY_STORAGE, key)
    else localStorage.removeItem(KEY_STORAGE)
  } catch {
    // Without storage the chat still works; it just starts fresh next visit.
  }
}

async function call(path, { method = 'GET', key, body } = {}) {
  const response = await fetch(`${AGENT_URL}/api/website${path}`, {
    method,
    headers: {
      ...(key ? { Authorization: `Bearer ${key}` } : {}),
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    const error = new Error(data.error || 'The chat is not available right now.')

    error.status = response.status
    throw error
  }

  return data
}

function KodiChat() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [notice, setNotice] = useState(null)
  const keyRef = useRef(readKey())
  const lastIdRef = useRef(0)
  const bottomRef = useRef(null)
  const inputRef = useRef(null)

  const addMessages = useCallback((incoming) => {
    if (!incoming?.length) return

    setMessages((current) => {
      const seen = new Set(current.map((message) => message.id))
      const fresh = incoming.filter((message) => !seen.has(message.id))

      return fresh.length ? [...current, ...fresh] : current
    })
    lastIdRef.current = Math.max(lastIdRef.current, ...incoming.map((message) => message.id))
  }, [])

  const ensureKey = useCallback(async () => {
    if (keyRef.current) return keyRef.current

    const { key } = await call('/visitor', { method: 'POST' })

    keyRef.current = key
    saveKey(key)

    return key
  }, [])

  // On opening: the conversation so far, then new replies every few seconds.
  useEffect(() => {
    if (!open || !keyRef.current) return undefined

    let stopped = false

    const check = async () => {
      try {
        const { messages: incoming } = await call(`/messages?after=${lastIdRef.current}`, { key: keyRef.current })

        if (!stopped) addMessages(incoming)
      } catch (error) {
        if (error.status === 401) {
          keyRef.current = null
          saveKey(null)
        }
      }
    }

    check()
    const timer = setInterval(check, POLL_MS)

    return () => {
      stopped = true
      clearInterval(timer)
    }
  }, [open, addMessages])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'end' })
  }, [messages.length, sending, open])

  useEffect(() => {
    if (open) inputRef.current?.focus()
  }, [open])

  async function handleSend(event) {
    event.preventDefault()

    const body = text.trim()

    if (!body || sending) return

    setSending(true)
    setNotice(null)
    setText('')

    const pendingId = `pending-${Date.now()}`

    setMessages((current) => [...current, { id: pendingId, from: 'you', text: body, pending: true }])

    const attempt = async (retry) => {
      try {
        const key = await ensureKey()
        const result = await call('/messages', { method: 'POST', key, body: { text: body, after: lastIdRef.current } })

        setMessages((current) => current.filter((message) => message.id !== pendingId))
        addMessages(result.messages)
        if (result.reason) setNotice({ text: result.reason })
      } catch (error) {
        if (error.status === 401 && retry) {
          keyRef.current = null
          saveKey(null)
          return attempt(false)
        }

        setMessages((current) => current.filter((message) => message.id !== pendingId))
        setText(body)
        setNotice({ text: error.message, whatsapp: error.status === 429 })
      }

      return undefined
    }

    await attempt(true)
    setSending(false)
  }

  if (!AGENT_URL) return null

  const whatsappLink = AGENT_WHATSAPP
    ? `https://wa.me/${AGENT_WHATSAPP}?text=${encodeURIComponent('Hi Kodi, I was chatting on your website.')}`
    : null

  return (
    <>
      {open ? (
        <section
          role="dialog"
          aria-label="Chat with Kodi's assistant"
          onKeyDown={(event) => {
            if (event.key === 'Escape') setOpen(false)
          }}
          className="fixed inset-x-3 bottom-3 z-40 flex max-h-[85vh] flex-col overflow-hidden rounded-[14px] border border-[var(--line)] bg-[var(--surface)] shadow-[0_18px_50px_rgba(32,28,24,0.18)] sm:inset-x-auto sm:right-5 sm:bottom-5 sm:h-[560px] sm:w-[370px]"
        >
          <header className="flex items-center justify-between gap-3 border-b border-[var(--line)] px-4 py-3">
            <div className="flex items-center gap-[10px]">
              <div className="brand-mark !h-[28px] !w-[28px] !text-[13px]">K</div>
              <div>
                <div className="text-[13px] font-bold">Kodi assistant</div>
                <div className="text-[10.5px] text-[var(--ink-faint)]">AI · replies in seconds</div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close the chat"
              className="rounded-[8px] p-[6px] text-[var(--ink-soft)] hover:bg-[var(--line-soft)]"
            >
              <X size={17} />
            </button>
          </header>

          <div className="flex-1 overflow-y-auto px-4 py-3" aria-live="polite">
            <div className="flex flex-col gap-[10px]">
              <Bubble from="kodi" text={GREETING} />
              {messages.map((message) => (
                <Bubble key={message.id} from={message.from} text={message.text} pending={message.pending} />
              ))}
              {sending ? <div className="text-[11px] text-[var(--ink-faint)]">Kodi is typing...</div> : null}
              <div ref={bottomRef} />
            </div>
          </div>

          <form onSubmit={handleSend} className="border-t border-[var(--line)] px-3 pb-3 pt-[10px]">
            {notice ? (
              <p className="mb-2 text-[11px] font-semibold text-[var(--accent-ink)]">
                {notice.text}
                {notice.whatsapp && whatsappLink ? (
                  <>
                    {' '}
                    <a href={whatsappLink} target="_blank" rel="noreferrer" className="underline">
                      Open WhatsApp
                    </a>
                  </>
                ) : null}
              </p>
            ) : null}
            <div className="flex items-end gap-2">
              <textarea
                ref={inputRef}
                value={text}
                onChange={(event) => setText(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && !event.shiftKey) handleSend(event)
                }}
                rows={1}
                maxLength={1000}
                placeholder="Type your message..."
                aria-label="Your message"
                className="max-h-[110px] min-h-[40px] min-w-0 flex-1 resize-none rounded-[10px] border border-[var(--line)] bg-[var(--bg)] px-3 py-[9px] text-[13px] text-[var(--ink)] outline-none placeholder:text-[var(--ink-faint)] focus:border-[var(--accent)]"
              />
              <button
                type="submit"
                disabled={sending || !text.trim()}
                aria-label="Send"
                className="flex h-[40px] w-[40px] items-center justify-center rounded-[10px] bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] disabled:opacity-50"
              >
                <Send size={16} />
              </button>
            </div>
            <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[10.5px] text-[var(--ink-faint)]">
              <span>
                You are chatting with an AI. Messages are kept so we can follow up.{' '}
                <a href="/privacy" target="_blank" rel="noreferrer" className="underline hover:text-[var(--ink)]">
                  Privacy
                </a>
              </span>
              {whatsappLink ? (
                <a href={whatsappLink} target="_blank" rel="noreferrer" className="font-semibold text-[var(--accent-ink)] hover:underline">
                  Continue on WhatsApp
                </a>
              ) : null}
            </div>
          </form>
        </section>
      ) : null}

      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="fixed right-4 bottom-4 z-40 inline-flex items-center gap-2 rounded-full bg-[var(--accent)] px-4 py-3 text-[13px] font-bold text-white shadow-[0_10px_30px_rgba(193,68,14,0.35)] hover:bg-[var(--accent-hover)] sm:right-5 sm:bottom-5"
        >
          <MessageCircle size={18} />
          Chat with us
        </button>
      ) : null}
    </>
  )
}

function Bubble({ from, text, pending }) {
  const mine = from === 'you'

  return (
    <div
      className={`max-w-[85%] whitespace-pre-wrap break-words rounded-[12px] px-3 py-[9px] text-[13px] leading-[1.5] ${
        mine ? 'ml-auto bg-[var(--accent)] text-white' : 'mr-auto bg-[var(--line-soft)] text-[var(--ink)]'
      } ${pending ? 'opacity-60' : ''}`}
    >
      {from === 'owner' ? <div className="mb-[2px] text-[10px] font-bold text-[var(--accent-ink)]">From the Kodi team</div> : null}
      {text}
    </div>
  )
}

export default KodiChat
