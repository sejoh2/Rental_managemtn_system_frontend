import { useRef, useState } from 'react'

const OTP_LENGTH = 6

function OtpVerificationForm({ phone, onChangeNumber, onVerified }) {
  const [otp, setOtp] = useState(['4', '8', '2', '', '', ''])
  const inputRefs = useRef([])

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

 function handleSubmit(event) {
  event.preventDefault()
  onVerified()
}

  return (
    <section className="flex min-h-[620px] items-center justify-center px-6 py-12 sm:px-10 lg:min-h-[calc(100vh-34px)]">
      <div className="w-full max-w-[360px]">
        <button
          type="button"
          onClick={onChangeNumber}
          className="mb-[18px] inline-flex items-center gap-[6px] text-[10px] font-bold text-[var(--ink-soft)] transition hover:text-[var(--accent)]"
        >
          <span className="text-[14px] leading-none">‹</span>
          Change number
        </button>

        <div className="mb-[10px] text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--accent)]">
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
          . It expires in 5 minutes.
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
                maxLength={1}
                aria-label={`OTP digit ${index + 1}`}
                className="font-mono h-[54px] w-full rounded-[9px] border border-[var(--line)] bg-white text-center text-[18px] font-semibold text-[var(--ink)] shadow-[0_1px_0_rgba(32,28,24,0.02)] outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)]"
              />
            ))}
          </div>

          <div className="mt-[14px] flex items-center justify-between gap-4 text-[10px]">
            <span className="text-[var(--ink-faint)]">
              3 attempts remaining
            </span>

            <button
              type="button"
              className="font-bold text-[var(--accent)] transition hover:text-[var(--accent-hover)]"
            >
              Resend code (0:52)
            </button>
          </div>

          <button
            type="submit"
            className="mt-[18px] flex w-full items-center justify-center rounded-[8px] border border-[var(--accent)] bg-[var(--accent)] px-4 py-3 text-[12.5px] font-bold text-white transition hover:border-[var(--accent-hover)] hover:bg-[var(--accent-hover)]"
          >
            Verify & sign in
          </button>
        </form>
      </div>
    </section>
  )
}

export default OtpVerificationForm