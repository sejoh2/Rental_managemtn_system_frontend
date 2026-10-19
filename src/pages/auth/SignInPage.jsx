import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { requestOtp, verifyOtp } from '../../api/auth'
import AuthBrandPanel from '../../components/auth/AuthBrandPanel'
import PhoneSignInForm from '../../components/auth/PhoneSignInForm'
import OtpVerificationForm from '../../components/auth/OtpVerificationForm'
import { useAuth } from '../../context/AuthContext'
import { planLabel, readChosenPlan, saveChosenPlan } from '../../utils/chosenPlan'

function SignInPage() {
  const { signIn } = useAuth()
  const [searchParams] = useSearchParams()
  // A card picked on the home page (in the link, or remembered from before).
  const [chosen] = useState(() => {
    const fromLink = Number(searchParams.get('plan'))

    if (fromLink) saveChosenPlan(fromLink)

    return readChosenPlan()
  })
  const [authStep, setAuthStep] = useState('phone')
  const [phone, setPhone] = useState('')
  const [sending, setSending] = useState(false)
  // Starts with a note when the admin was signed out for leaving the page untouched.
  const [error, setError] = useState(() => {
    try {
      return sessionStorage.getItem('kodi_signed_out_idle')
        ? { message: 'You were signed out after 15 minutes without activity. Sign in again to continue.' }
        : null
    } catch {
      return null
    }
  })

  // The note is for this visit only.
  useEffect(() => {
    try {
      sessionStorage.removeItem('kodi_signed_out_idle')
    } catch {
      // Nothing to clear.
    }
  }, [])
  // The latest code request: { id, phone, resendAt, resendSeconds, expiresMinutes, attemptsLeft }
  const [otpRequest, setOtpRequest] = useState(null)

  const cleanPhone = phone.replace(/\s/g, '')

  async function sendCode() {
    const response = await requestOtp(cleanPhone)

    setOtpRequest({
      id: Date.now(),
      phone: cleanPhone,
      resendAt: Date.now() + response.resend_in_seconds * 1000,
      resendSeconds: response.resend_in_seconds,
      expiresMinutes: Math.round(response.expires_in_seconds / 60),
      attemptsLeft: response.max_attempts ?? null,
    })
  }

  async function handleSendCode() {
    const secondsLeft = otpRequest ? Math.ceil((otpRequest.resendAt - Date.now()) / 1000) : 0

    // Coming back from "Change number" with the same number: the code already sent is still valid.
    if (otpRequest?.phone === cleanPhone && secondsLeft > 0) {
      setOtpRequest({ ...otpRequest, id: Date.now(), resendSeconds: secondsLeft })
      setAuthStep('otp')
      return
    }

    setSending(true)
    setError(null)

    try {
      await sendCode()
      setAuthStep('otp')
    } catch (sendError) {
      setError(sendError)
    } finally {
      setSending(false)
    }
  }

  async function handleVerify(code) {
    try {
      signIn(await verifyOtp(cleanPhone, code))
    } catch (verifyError) {
      const attemptsLeft = verifyError.payload?.attempts_remaining

      if (typeof attemptsLeft === 'number') {
        setOtpRequest((current) => ({ ...current, attemptsLeft }))
      }

      throw verifyError
    }
  }

  return (
    <main className="min-h-screen bg-[var(--bg)] text-[var(--ink)]">
      <div className="proto-strip">
        <Link to="/" className="inline-flex items-center gap-1 font-bold text-[var(--strip-ink-strong)] hover:underline">
          <ArrowLeft size={13} />
          Back to home
        </Link>
        <span className="hidden sm:inline">KODI - Owner Web Dashboard</span>
        {chosen ? (
          <span className="ml-auto">
            Your choice: <b className="text-[var(--strip-ink-strong)]">{planLabel(chosen)}</b>
          </span>
        ) : null}
      </div>

      <section className="grid min-h-screen pt-[34px] lg:grid-cols-[1.1fr_1fr]">
        <AuthBrandPanel />

        {authStep === 'phone' ? (
          <PhoneSignInForm
            phone={phone}
            onPhoneChange={setPhone}
            onSendCode={handleSendCode}
            sending={sending}
            error={error}
          />
        ) : (
          <OtpVerificationForm
            key={otpRequest.id}
            phone={phone}
            resendSeconds={otpRequest.resendSeconds}
            expiresMinutes={otpRequest.expiresMinutes}
            attemptsLeft={otpRequest.attemptsLeft}
            onChangeNumber={() => setAuthStep('phone')}
            onVerify={handleVerify}
            onResend={sendCode}
          />
        )}
      </section>
    </main>
  )
}

export default SignInPage
