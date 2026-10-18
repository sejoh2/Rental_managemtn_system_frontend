import { Link } from 'react-router-dom'
import { LEGAL } from '../../config/legal'
import LegalLayout, { List, Section } from './LegalLayout'

/*
  The privacy policy. Draft from what the system does (2026-10-16);
  keep it true when the system changes, and have it checked by someone
  qualified. Facts that change live in config/legal.js.
*/
function PrivacyPage() {
  const mail = <a href={`mailto:${LEGAL.email}`} className="font-semibold text-[var(--accent-ink)] hover:underline">{LEGAL.email}</a>

  return (
    <LegalLayout title="Privacy policy">
      <p>
        This policy explains what personal data {LEGAL.shortName} collects, why, who else handles it, how long it is kept, and
        your rights under Kenya&apos;s Data Protection Act, 2019. {LEGAL.shortName} is provided by {LEGAL.provider} (&quot;we&quot;).
        Questions or requests: {mail}.
        {LEGAL.odpcRegistration ? ` We are registered with the Office of the Data Protection Commissioner, number ${LEGAL.odpcRegistration}.` : ''}
      </p>

      <Section title="Who is responsible for what">
        <List
          items={[
            'For landlords and property owners who use Kodi, and for people who contact us (our website chat, WhatsApp, SMS, our social media pages, demos), we decide how the data is used: we are the data controller.',
            'For tenants and caretakers recorded in a landlord\'s Kodi account, the landlord decides what is recorded and why; we process it on the landlord\'s behalf (data processor). Tenants with questions about their records should first ask their landlord; we will help the landlord answer.',
          ]}
        />
      </Section>

      <Section title="What we collect">
        <p className="font-semibold text-[var(--ink)]">Landlords and their staff using Kodi</p>
        <List
          items={[
            'Name, phone number and email; sign-in codes sent by SMS; the network address and time of each sign-in (for security).',
            'Properties, units, rents, charges, expenses, maintenance requests, water readings and their photos, agreements and other files you upload.',
            'If you connect M-Pesa: your paybill or till details and the credentials needed to receive payments, stored encrypted.',
            'A record of important actions in your account (who did what and when), kept for security and to resolve disputes.',
          ]}
        />
        <p className="font-semibold text-[var(--ink)]">Tenants, as recorded by their landlord</p>
        <List
          items={[
            'Name, phone number used for payments, email if given, the unit and rent, payments received (including the payer\'s M-Pesa name and number), charges, deposits, agreements, water readings and messages sent to them by SMS.',
          ]}
        />
        <p className="font-semibold text-[var(--ink)]">People who talk to our assistant</p>
        <List
          items={[
            'What you write in the chat on our website or send us on WhatsApp or SMS, and our replies. Voice notes and photos sent on WhatsApp are not kept; only that one was received.',
            'What you choose to tell us: name, phone, email, business name, number of properties and units, town; and whether you agreed to be contacted and to receive news and offers, with the exact wording and time.',
            'Demos you book: the time, and what you would like to see.',
            'On our Facebook, Instagram and TikTok pages: comments you post on our posts, and private messages you send us on Messenger or Instagram, with your public name or username as the platform shows it. If you comment that you are interested, we may reply once privately and save you as someone to follow up with.',
            'On our website, your browser keeps a random chat key for 30 days so you can carry on a conversation; it is not used for anything else, and we do not use advertising or tracking cookies.',
          ]}
        />
      </Section>

      <Section title="Our assistant is an AI">
        <p>
          The assistant on our website, WhatsApp, SMS, Messenger and Instagram is an AI, and it also writes our social media posts and
          makes their images (each post is approved by us, and marked as AI-generated where the platform asks). It says so when it starts a conversation. It answers from what we have
          told it about Kodi, records your details and consent, books demos in our calendar, and hands over to a person when you ask or
          when something needs us. It cannot agree prices, discounts, free trials or promises on its own: those wait for our approval. It
          can make mistakes; anything important is confirmed by us.
        </p>
      </Section>

      <Section title="Why we use it">
        <List
          items={[
            'To provide Kodi to landlords, and to keep accounts and payments secure (performance of our contract with you; our legitimate interest in security).',
            'To answer people who contact us, arrange demos and follow up, when they asked us to or agreed to be contacted (consent; steps before a contract).',
            'To send news and offers only to people who agreed to receive them (consent, which you can withdraw at any time by writing STOP).',
            'To keep the records the law requires, such as for tax.',
          ]}
        />
      </Section>

      <Section title="Who else handles it">
        <p>We use these services to run Kodi. Each receives only what it needs for its task:</p>
        <List
          items={[
            'Render (hosting and databases, in Frankfurt, Germany) and Cloudflare (storage of uploaded files).',
            'Africa\'s Talking (sending SMS: sign-in codes, reminders, notices).',
            'Safaricom M-Pesa (payments landlords receive through Kodi).',
            'Meta (WhatsApp messages with us, and our Facebook and Instagram pages and their messages) and TikTok (our TikTok page). Your use of those platforms is also covered by their own privacy policies.',
            'Google: Gemini, the AI that writes the assistant\'s replies, our posts and their images, and our internal reports, receives the conversation and the records it needs; Google Calendar and Meet, for demos.',
          ]}
        />
        <p>
          {LEGAL.aiPaidTier
            ? 'We use Google Gemini on terms under which Google does not use this content to improve its products.'
            : 'While Kodi is in its testing period we use Google Gemini\'s free terms, under which Google may use what is sent to it to improve its products, and people at Google may review it. We will move to terms that do not allow this before real customers\' data is sent to it.'}{' '}
          We do not sell personal data, and we do not share it with anyone else except where the law requires.
        </p>
      </Section>

      <Section title="Data stored outside Kenya">
        <p>
          Our hosting and some of the services above store or process data outside Kenya, including in the European Union and the United
          States. We use these providers because they offer appropriate safeguards for personal data, as the Data Protection Act requires.
        </p>
      </Section>

      <Section title="How long we keep it">
        <List
          items={[
            'Landlords\' accounts and their records: while the account is open, then as long as the law requires (for example tax records); the rest is deleted.',
            `People who talked to our assistant but did not become customers: ${LEGAL.leadRetentionMonths} months after the last contact, then deleted with their conversations.`,
            'Reports we make for ourselves: 30 days. The website chat key: 30 days.',
            'Security records of actions and sign-ins: as long as needed to protect accounts and resolve disputes.',
          ]}
        />
      </Section>

      <Section title="Your rights">
        <p>Under the Data Protection Act, 2019, you may:</p>
        <List
          items={[
            'be told what data we hold about you, and get a copy;',
            'have wrong data corrected, and data we no longer need deleted;',
            'object to its use, and withdraw consent (for example by writing STOP to us on WhatsApp, SMS, Messenger or Instagram);',
            'complain to the Office of the Data Protection Commissioner (odpc.go.ke).',
          ]}
        />
        <p>Write to {mail}. We answer within the time the law allows and may ask you to prove who you are first.</p>
      </Section>

      <Section title="Security">
        <p>
          Sign-in is by a code sent to your phone. Connections are encrypted, M-Pesa credentials are stored encrypted, each person sees only
          what their role allows, and important actions are recorded. No system is perfectly secure; if a breach affects you, we will tell
          you and the Data Protection Commissioner as the law requires.
        </p>
      </Section>

      <Section title="Changes">
        <p>
          If this policy changes, the new version is published here with its date, and we tell account holders of important changes before
          they take effect. See also our <Link to="/terms" className="font-semibold text-[var(--accent-ink)] hover:underline">Terms</Link>.
        </p>
      </Section>
    </LegalLayout>
  )
}

export default PrivacyPage
