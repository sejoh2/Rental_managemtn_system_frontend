import { useState } from 'react'
import AuthBrandPanel from '../../components/auth/AuthBrandPanel'
import PhoneSignInForm from '../../components/auth/PhoneSignInForm'
import OtpVerificationForm from '../../components/auth/OtpVerificationForm'

function SignInPage({ onAuthenticated }) {
  const [authStep, setAuthStep] = useState('phone')
  const [phone, setPhone] = useState('712 345 678')

  return (
    <main className="min-h-screen bg-[var(--bg)] text-[var(--ink)]">
      <div className="proto-strip">
        <span>KODI - Owner Web Dashboard</span>
        
        <span className="proto-pill">
          {authStep === 'phone' ? 'Login' : 'OTP verify'}
        </span>
      </div>

      <section className="grid min-h-screen pt-[34px] lg:grid-cols-[1.1fr_1fr]">
        <AuthBrandPanel />

        {authStep === 'phone' ? (
          <PhoneSignInForm
            phone={phone}
            onPhoneChange={setPhone}
            onSendCode={() => setAuthStep('otp')}
          />
        ) : (
          <OtpVerificationForm
            phone={phone}
            onChangeNumber={() => setAuthStep('phone')}
            onVerified={onAuthenticated}
          />
        )}
      </section>
    </main>
  )
}

export default SignInPage