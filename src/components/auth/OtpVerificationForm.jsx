import { useEffect, useRef, useState } from 'react'
import { FormError } from '../common/DataState'

const OTP_LENGTH = 6

function formatCountdown(seconds) {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`
}

function OtpVerificationForm({
  phone,
  resendSeconds,
  expiresMinutes,
  attemptsLeft,
  onChangeNumber,
  onVerify,
  onResend,
}) {
  const [otp, setOtp] = useState(Array(OTP_LENGTH).fill(''))
  const [secondsLeft, setSecondsLeft] = useState(resendSeconds)
  const [verifying, setVerifying] = useState(false)
  const [resending, setResending] = useState(false)
  const [error, setError] = useState(null)
  const inputRefs = useRef([])

  const code = otp.join('')

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsLeft((current) => (current > 0 ? current - 1 : 0))
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  function handleChange(index, value) {
    const digit = value.replace(/\D/g, '').slice(-1)
    const nextOtp = [...otp]

    nextOtp[index] = digit
    setOtp(nextOtp)

    if (digit && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  function handleKeyDown(index, event) {
    if (event.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  function handlePaste(event) {
    event.preventDefault()

    const pastedDigits = event.clipboardData
      .getData('text')
      .replace(/\D/g, '')
      .slice(0, OTP_LENGTH)
      .split('')

    if (!pastedDigits.length) return

    const nextOtp = Array.from(
      { length: OTP_LENGTH },
      (_, index) => pastedDigits[index] || ''
    )

    setOtp(nextOtp)

    const nextFocusIndex = Math.min(pastedDigits.length, OTP_LENGTH - 1)
    inputRefs.current[nextFocusIndex]?.focus()
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setVerifying(true)
    setError(null)

    try {
      // On success the app leaves this screen, so there is nothing to reset.
      await onVerify(code)
    } catch (verifyError) {
      setError(verifyError)
      setOtp(Array(OTP_LENGTH).fill(''))
      setVerifying(false)
      inputRefs.current[0]?.focus()
    }
  }

  async function handleResend() {
    setResending(true)
    setError(null)

    try {
      // A successful resend remounts this form with a fresh countdown.
      await onResend()
    } catch (resendError) {
      setError(resendError)
      setResending(false)
    }
  }

  return (
    <section className="flex min-h-[620px] items-center justify-center px-6 py-12 sm:px-10 lg:min-h-[calc(100vh-34px)]">
      <div className="w-full max-w-[360px]">
        <button
          type="button"
          onClick={onChangeNumber}
          className="mb-[18px] inline-flex items-center gap-[6px] text-[10px] font-bold text-[var(--ink-soft)] transition hover:text-[var(--accent-ink)]"
        >
          <span className="text-[14px] leading-none">‹</span>
          Change number
        </button>

        <div className="mb-[10px] text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--accent-ink)]">
          Verify
        </div>

        <h2 className="font-display text-[22px] font-semibold tracking-[-0.01em] text-[var(--ink)]">
          Enter the code
        </h2>

        <p className="mt-2 mb-[28px] text-[12px] leading-[1.5] text-[var(--ink-soft)]">
          We sent a 6-digit code to{' '}
          <span className="font-mono font-bold text-[var(--ink)]">
            +254 {phone}
          </span>
          . It expires in {expiresMinutes} minutes.
        </p>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-6 gap-[9px]" onPaste={handlePaste}>
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={(element) => {
                  inputRefs.current[index] = element
                }}
                value={digit}
                onChange={(event) => handleChange(index, event.target.value)}
                onKeyDown={(event) => handleKeyDown(index, event)}
                inputMode="numeric"
                autoComplete={index === 0 ? 'one-time-code' : 'off'}
                autoFocus={index === 0}
                maxLength={1}
                aria-label={`OTP digit ${index + 1}`}
                className="font-mono h-[54px] w-full rounded-[9px] border border-[var(--line)] bg-[var(--surface)] text-center text-[18px] font-semibold text-[var(--ink)] shadow-[0_1px_0_rgba(32,28,24,0.02)] outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)]"
              />
            ))}
          </div>

          <div className="mt-[14px] flex items-center justify-between gap-4 text-[10px]">
            <span className="text-[var(--ink-faint)]">
              {attemptsLeft === null
                ? 'Didn’t get the code?'
                : `${attemptsLeft} ${attemptsLeft === 1 ? 'attempt' : 'attempts'} remaining`}
            </span>

            <button
              type="button"
              onClick={handleResend}
              disabled={secondsLeft > 0 || resending}
              className="font-bold text-[var(--accent-ink)] transition hover:text-[var(--accent-hover)] disabled:cursor-not-allowed disabled:text-[var(--ink-faint)]"
            >
              {resending
                ? 'Sending...'
                : secondsLeft > 0
                  ? `Resend code (${formatCountdown(secondsLeft)})`
                  : 'Resend code'}
            </button>
          </div>

          {error ? (
            <div className="mt-[14px]">
              <FormError error={error} />
            </div>
          ) : null}

          <button
            type="submit"
            disabled={code.length < OTP_LENGTH || verifying || attemptsLeft === 0}
            className="mt-[18px] flex w-full items-center justify-center rounded-[8px] border border-[var(--accent)] bg-[var(--accent)] px-4 py-3 text-[12.5px] font-bold text-white transition hover:border-[var(--accent-hover)] hover:bg-[var(--accent-hover)] disabled:opacity-50"
          >
            {verifying ? 'Verifying...' : 'Verify & sign in'}
          </button>
        </form>
      </div>
    </section>
  )
}

export default OtpVerificationForm