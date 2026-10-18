import { Link } from 'react-router-dom'
import { LEGAL } from '../../config/legal'
import LegalLayout, { List, Section } from './LegalLayout'

/*
  The terms of service. Draft (2026-10-16), to be checked by someone
  qualified. Fees are not set yet (billing is not built): nothing is
  charged without agreement, and these say so.
*/
function TermsPage() {
  const mail = <a href={`mailto:${LEGAL.email}`} className="font-semibold text-[var(--accent-ink)] hover:underline">{LEGAL.email}</a>
  const privacy = <Link to="/privacy" className="font-semibold text-[var(--accent-ink)] hover:underline">Privacy policy</Link>

  return (
    <LegalLayout title="Terms of service">
      <p>
        These terms apply to {LEGAL.shortName}, rental management software for landlords and property owners, provided by {LEGAL.provider}{' '}
        (&quot;we&quot;). By creating an account or using {LEGAL.shortName} you agree to them. Questions: {mail}.
      </p>

      <Section title="What Kodi does">
        <p>
          {LEGAL.shortName} helps you record properties, units, tenants, rent, payments, water, charges, expenses, maintenance, agreements and
          messages to tenants, and can receive M-Pesa payments through your own paybill or till. Features may change as we improve it; we
          will not remove something you rely on without telling you first.
        </p>
      </Section>

      <Section title="Your account">
        <List
          items={[
            'You sign in with a code sent to your phone. Keep your phone and SIM secure; actions taken after signing in with your code are treated as yours.',
            'Give accurate details, and keep caretakers\' access to what they need. You are responsible for what you and your caretakers do in your account.',
          ]}
        />
      </Section>

      <Section title="Your tenants' data">
        <List
          items={[
            'You decide what you record about your tenants, and you must have a lawful reason under the Data Protection Act, 2019, and tell your tenants that you use Kodi.',
            'Send SMS to tenants only about their tenancy (rent, water, notices) or with their agreement.',
            `We process tenants' data only to provide ${LEGAL.shortName} to you, keep it confidential and secure, and help you answer your tenants' requests. See our `,
          ].map((text, index) => (index === 2 ? <span key="tenants">{text}{privacy}.</span> : text))}
        />
      </Section>

      <Section title="Fees">
        <p>
          {LEGAL.shortName}&apos;s prices are agreed with you before you are charged anything. We will not charge you without that
          agreement, and we give at least 30 days&apos; notice before any change to what you pay. Payments you receive from tenants through
          M-Pesa go to your own paybill or till, not to us.
        </p>
      </Section>

      <Section title="Our assistant">
        <p>
          Our assistant on the website, WhatsApp and SMS is an AI. It may make mistakes: prices, discounts, trials and promises are only
          binding once we confirm them, and its suggestions are advice, not professional, legal or financial advice.
        </p>
      </Section>

      <Section title="Fair use">
        <List
          items={[
            'Do not use Kodi to break the law, send spam, harass anyone, or record data you have no right to.',
            'Do not try to get into accounts that are not yours, overload the service, or copy or resell the software.',
            'We may suspend access that puts other users, tenants or the service at risk, and will tell you why.',
          ]}
        />
      </Section>

      <Section title="Availability and your records">
        <p>
          We work to keep {LEGAL.shortName} available and your records safe, but cannot promise it will never be interrupted. Keep your own
          copies of important records (Kodi lets you export payments, expenses and reports). You can ask us for a copy of all your account&apos;s
          data at any time.
        </p>
      </Section>

      <Section title="Liability">
        <p>
          To the extent the law allows, we are not liable for indirect losses (such as lost profit) or for losses caused by events outside
          our control, and our total liability to you is limited to what you paid us in the 12 months before the claim. Nothing here limits
          rights you have under Kenyan law that cannot be limited.
        </p>
      </Section>

      <Section title="Ending">
        <p>
          You may stop using {LEGAL.shortName} at any time; write to {mail} to close your account and get a copy of your data. We may end the
          service with 30 days&apos; notice, or at once if these terms are seriously broken. After an account is closed its data is deleted
          as our {privacy} says.
        </p>
      </Section>

      <Section title="Changes and law">
        <p>
          We may update these terms; the new version is published here with its date, and important changes are told to account holders at
          least 30 days before they apply. These terms are governed by the laws of {LEGAL.country}, and disputes go to the courts of{' '}
          {LEGAL.country}.
        </p>
      </Section>
    </LegalLayout>
  )
}

export default TermsPage
