import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  Banknote,
  Bell,
  Camera,
  Check,
  ChevronDown,
  ClipboardList,
  Droplets,
  FileText,
  Mail,
  MessageSquare,
  Phone,
  ShieldCheck,
  Smartphone,
  Users,
  Wrench,
} from 'lucide-react'
import ThemeToggle from '../../components/common/ThemeToggle'
import KodiChat from '../../components/home/KodiChat'
import { CONTACT } from '../../config/contact'

/*
  The public home page. Its one goal is a new owner asking for an account;
  signing in is for people who already have one.

  Everything said here must be true of the system today. Prices, client names,
  numbers and testimonials are added only when real ones are given.
*/

// The product name, in one place, because the system will be renamed.
const APP_NAME = 'Kodi'

const problems = [
  'Matching M-Pesa messages to tenants by hand at the end of every month',
  'Arguments over water bills nobody can prove',
  'Deposits worked out on paper when a tenant moves out',
  'Not knowing who owes what until you sit down with the rent book',
]

const features = [
  {
    icon: Banknote,
    title: 'Payments that match themselves',
    text: 'M-Pesa payments to your paybill or till land on the right tenant and bill on their own. Cash and bank payments are recorded in seconds.',
  },
  {
    icon: Droplets,
    title: 'Water bills you can prove',
    text: 'Each meter reading carries a photo and becomes a bill at your rate. A reading lower than the last is held back before anyone is charged.',
  },
  {
    icon: MessageSquare,
    title: 'Reminders that go out for you',
    text: 'Rent reminders by SMS on the days you choose, only to tenants who owe, with their balance in the message.',
  },
  {
    icon: Users,
    title: 'Move-ins and move-outs, settled',
    text: 'Deposits, the first and last month, repairs to deduct and the refund: worked out and kept on record.',
  },
  {
    icon: Wrench,
    title: 'What each property really costs',
    text: 'Repairs and expenses per property and per unit, with who pays for what, so the profit you see is the real one.',
  },
  {
    icon: FileText,
    title: 'Reports when you need them',
    text: 'Income, arrears and tenant statements for any month, ready to download.',
  },
]

const steps = [
  {
    title: 'Get in touch',
    text: 'We open your owner account on your phone number. You sign in with a code sent by SMS; there is no password to forget.',
  },
  {
    title: 'Add your properties',
    text: 'Your properties, units, rents, tenants and payment accounts. Deposits and first bills are worked out for you.',
  },
  {
    title: 'Let it run',
    text: 'Payments match, bills go out each month, reminders reach those who owe, and the bell tells you what needs you.',
  },
]

const faqs = [
  {
    question: 'Do my tenants need to install anything?',
    answer:
      'No. Tenants keep paying by M-Pesa as they do now, and receive reminders and receipts by SMS.',
  },
  {
    question: 'Which payments are matched automatically?',
    answer:
      'M-Pesa payments to a paybill or till you connect. Cash, cheque and bank payments are recorded by you in a few taps and count the same way.',
  },
  {
    question: 'Can I use it for just one property?',
    answer: 'Yes. Add one property or many; each has its own units, tenants, rules and payment accounts.',
  },
  {
    question: 'Do I need a computer?',
    answer: `No. ${APP_NAME} works in your phone's browser and can be installed on your home screen like an app.`,
  },
  {
    question: 'Is my data safe?',
    answer:
      'Sign-in is by a code sent to your phone, every change is recorded with who made it, and files such as ID copies are stored privately.',
  },
  {
    question: 'What does it cost?',
    answer: 'Talk to us: we will look at how many units you manage and agree a plan with you.',
  },
]

const sectionClass = 'mx-auto w-full max-w-[1120px] px-5 sm:px-8'
const eyebrowClass = 'mb-[10px] text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--accent-ink)]'
const headingClass = 'font-display text-[24px] font-semibold leading-[1.2] tracking-[-0.01em] sm:text-[30px]'
const primaryClass =
  'inline-flex items-center justify-center gap-2 rounded-[8px] border border-[var(--accent)] bg-[var(--accent)] px-5 py-[11px] text-[13px] font-bold text-white transition hover:border-[var(--accent-hover)] hover:bg-[var(--accent-hover)]'

function contactLinks() {
  return [
    CONTACT.whatsapp && {
      icon: MessageSquare,
      label: 'WhatsApp us',
      href: `https://wa.me/${CONTACT.whatsapp}?text=${encodeURIComponent(`Hello, I would like a ${APP_NAME} account.`)}`,
    },
    CONTACT.phone && { icon: Phone, label: `Call ${CONTACT.phone}`, href: `tel:${CONTACT.phone}` },
    CONTACT.email && {
      icon: Mail,
      label: CONTACT.email,
      href: `mailto:${CONTACT.email}?subject=${encodeURIComponent(`${APP_NAME} account`)}`,
    },
  ].filter(Boolean)
}

function HomePage() {
  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--ink)]">
      <Header />
      <Hero />
      <Problems />
      <Features />
      <HowItWorks />
      <Caretakers />
      <Faq />
      <GetAnAccount />
      <Footer />
      <KodiChat />
    </div>
  )
}

function Header() {
  return (
    <header className="sticky top-0 z-30 border-b border-[var(--line)] bg-[var(--surface)]">
      <div className={`${sectionClass} flex h-[60px] items-center justify-between gap-4`}>
        <Link to="/" className="flex items-center gap-[10px]" aria-label={`${APP_NAME} home`}>
          <div className="brand-mark">K</div>
          <span className="font-display text-[16px] font-semibold">{APP_NAME}</span>
        </Link>

        <nav className="hidden items-center gap-6 text-[12px] font-semibold text-[var(--ink-soft)] md:flex">
          <a href="#features" className="hover:text-[var(--ink)]">Features</a>
          <a href="#how-it-works" className="hover:text-[var(--ink)]">How it works</a>
          <a href="#questions" className="hover:text-[var(--ink)]">Questions</a>
        </nav>

        <div className="flex items-center gap-[10px]">
          <ThemeToggle />
          <Link to="/login" className="hidden px-2 text-[12px] font-bold text-[var(--ink-soft)] hover:text-[var(--ink)] sm:block">
            Sign in
          </Link>
          <a href="#get-an-account" className={`${primaryClass} !px-4 !py-[9px] !text-[12px]`}>
            Get an account
          </a>
        </div>
      </div>
    </header>
  )
}

function Hero() {
  return (
    <section className="auth-visual !p-0">
      <div className="ledger-lines" />
      <div className={`${sectionClass} relative z-10 grid items-center gap-12 py-14 sm:py-20 lg:grid-cols-[1.05fr_1fr]`}>
        <div>
          <div className="mb-[14px] text-[10px] font-bold uppercase tracking-[0.1em] text-[#E8A87C]">
            For property owners in Kenya
          </div>
          <h1 className="font-display text-[32px] font-semibold leading-[1.12] tracking-[-0.01em] text-white sm:text-[44px]">
            Every unit, tenant and shilling — accounted for automatically.
          </h1>
          <p className="mt-[18px] max-w-[520px] text-[14px] leading-[1.6] text-[var(--brand-panel-soft)]">
            Replace the rent book. M-Pesa payments match themselves, water is billed from readings
            with photos, and reminders reach the tenants who owe — so you know where every property
            stands, from your phone.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <a href="#get-an-account" className={primaryClass}>
              Get an account
              <ArrowRight size={15} />
            </a>
            <a
              href="#how-it-works"
              className="rounded-[8px] border border-white/30 px-5 py-[11px] text-[13px] font-bold text-white transition hover:bg-white/10"
            >
              See how it works
            </a>
          </div>

          <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-[12px] text-[var(--brand-panel-soft)]">
            {['No app for tenants', 'Works on your phone', 'Sign in with an SMS code'].map((point) => (
              <li key={point} className="flex items-center gap-[6px]">
                <Check size={14} className="text-[#E8A87C]" />
                {point}
              </li>
            ))}
          </ul>
        </div>

        <ProductPreview />
      </div>
    </section>
  )
}

// A picture of the owner's dashboard, drawn with the app's own styles. The figures are an example.
function ProductPreview() {
  const stats = [
    ['Collected this month', 'KES 412,500', 'text-[var(--success)]'],
    ['Still owed', 'KES 38,000', 'text-[var(--danger)]'],
    ['Occupied', '23 of 24 units', ''],
  ]

  const rows = [
    ['A4 · Wanjiru', 'Paid', 'bg-[var(--success-soft)] text-[var(--success)]', 'M-Pesa matched'],
    ['B2 · Otieno', 'Part paid', 'bg-[var(--warning-soft)] text-[var(--warning)]', 'KES 4,000 left'],
    ['C1 · Achieng', 'Reminded', 'bg-[var(--info-soft)] text-[var(--info)]', 'SMS sent today'],
  ]

  return (
    <div aria-hidden="true" className="relative">
      <div className="rounded-[12px] border border-white/10 bg-[var(--surface)] p-4 text-[var(--ink)] shadow-[0_24px_60px_rgba(0,0,0,0.35)] sm:p-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <div className="text-[10px] uppercase tracking-[0.06em] text-[var(--ink-faint)]">Example property</div>
            <div className="font-display text-[15px] font-semibold">Riverside Apartments</div>
          </div>
          <span className="flex h-8 w-8 items-center justify-center rounded-[8px] border border-[var(--line)] text-[var(--ink-soft)]">
            <Bell size={15} />
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {stats.map(([label, value, tone]) => (
            <div key={label} className="rounded-[8px] border border-[var(--line)] bg-[var(--bg)] p-3">
              <div className="text-[9px] uppercase tracking-[0.04em] text-[var(--ink-faint)]">{label}</div>
              <div className={`font-mono mt-1 text-[12px] font-semibold sm:text-[13px] ${tone}`}>{value}</div>
            </div>
          ))}
        </div>

        <div className="mt-3 overflow-hidden rounded-[8px] border border-[var(--line)]">
          {rows.map(([who, status, tone, note]) => (
            <div key={who} className="flex items-center justify-between gap-3 border-b border-[var(--line-soft)] px-3 py-[10px] text-[11px] last:border-b-0">
              <span className="font-semibold">{who}</span>
              <span className="flex items-center gap-2">
                <span className="hidden text-[var(--ink-faint)] sm:inline">{note}</span>
                <span className={`rounded-full px-2 py-[2px] text-[9px] font-bold ${tone}`}>{status}</span>
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="absolute -bottom-5 -left-3 hidden items-center gap-3 rounded-[10px] border border-[var(--line)] bg-[var(--surface)] px-4 py-3 text-[var(--ink)] shadow-[0_12px_30px_rgba(0,0,0,0.25)] sm:flex">
        <span className="flex h-8 w-8 items-center justify-center rounded-[8px] bg-[var(--success-soft)] text-[var(--success)]">
          <Banknote size={16} />
        </span>
        <div>
          <div className="text-[11px] font-bold">KES 15,000 received</div>
          <div className="text-[10px] text-[var(--ink-faint)]">Matched to A4 automatically</div>
        </div>
      </div>
    </div>
  )
}

function Problems() {
  return (
    <section className={`${sectionClass} py-16 sm:py-20`}>
      <div className="grid gap-10 lg:grid-cols-[1fr_1.2fr] lg:items-center">
        <div>
          <div className={eyebrowClass}>Sound familiar?</div>
          <h2 className={headingClass}>The rent book costs you more than paper</h2>
          <p className="mt-4 max-w-[440px] text-[13px] leading-[1.6] text-[var(--ink-soft)]">
            Hours of matching messages, bills tenants dispute, and money you only find missing at
            the end of the month. {APP_NAME} takes that work off you.
          </p>
        </div>

        <ul className="grid gap-3 sm:grid-cols-2">
          {problems.map((problem) => (
            <li key={problem} className="rounded-[10px] border border-[var(--line)] bg-[var(--surface)] p-4 text-[13px] leading-[1.5] text-[var(--ink-soft)]">
              {problem}
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

function Features() {
  return (
    <section id="features" className="scroll-mt-[70px] border-y border-[var(--line)] bg-[var(--surface)]">
      <div className={`${sectionClass} py-16 sm:py-20`}>
        <div className={eyebrowClass}>What it does for you</div>
        <h2 className={`${headingClass} max-w-[600px]`}>Everything a rental business runs on, in one place</h2>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map(({ icon: Icon, title, text }) => (
            <article key={title} className="rounded-[10px] border border-[var(--line)] bg-[var(--bg)] p-5">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-[8px] bg-[var(--accent-soft)] text-[var(--accent-ink)]">
                <Icon size={19} />
              </div>
              <h3 className="text-[14px] font-bold">{title}</h3>
              <p className="mt-2 text-[12px] leading-[1.6] text-[var(--ink-soft)]">{text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

function HowItWorks() {
  return (
    <section id="how-it-works" className={`${sectionClass} scroll-mt-[70px] py-16 sm:py-20`}>
      <div className={eyebrowClass}>How it works</div>
      <h2 className={headingClass}>Up and running in an afternoon</h2>

      <ol className="mt-10 grid gap-6 md:grid-cols-3">
        {steps.map((step, index) => (
          <li key={step.title} className="rounded-[10px] border border-[var(--line)] bg-[var(--surface)] p-5">
            <div className="font-mono text-[13px] font-semibold text-[var(--accent-ink)]">0{index + 1}</div>
            <h3 className="mt-2 text-[15px] font-bold">{step.title}</h3>
            <p className="mt-2 text-[12px] leading-[1.6] text-[var(--ink-soft)]">{step.text}</p>
          </li>
        ))}
      </ol>

      <div className="mt-8">
        <a href="#get-an-account" className={primaryClass}>
          Get an account
          <ArrowRight size={15} />
        </a>
      </div>
    </section>
  )
}

function Caretakers() {
  const points = [
    [Droplets, 'Meter readings with a photo'],
    [Wrench, 'Repairs reported and updated'],
    [ClipboardList, 'Expenses with the receipt'],
    [Camera, 'Photos straight from the phone'],
  ]

  return (
    <section className="border-y border-[var(--line)] bg-[var(--surface)]">
      <div className={`${sectionClass} grid items-center gap-10 py-16 sm:py-20 lg:grid-cols-[1.1fr_1fr]`}>
        <div>
          <div className={eyebrowClass}>For your caretaker · coming soon</div>
          <h2 className={headingClass}>Your caretaker works from their phone</h2>
          <p className="mt-4 max-w-[480px] text-[13px] leading-[1.6] text-[var(--ink-soft)]">
            An Android app for the day-to-day work in the property. You decide, per property, what
            your caretaker may do, and everything they do is recorded under their name.
          </p>
          <ul className="mt-6 grid gap-3 sm:grid-cols-2">
            {points.map(([Icon, text]) => (
              <li key={text} className="flex items-center gap-3 text-[12px] font-semibold">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px] bg-[var(--accent-soft)] text-[var(--accent-ink)]">
                  <Icon size={16} />
                </span>
                {text}
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-[10px] border border-[var(--line)] bg-[var(--bg)] p-6">
          <div className="flex items-center gap-3">
            <Smartphone size={20} className="text-[var(--accent-ink)]" />
            <div className="text-[13px] font-bold">You stay in control</div>
          </div>
          <ul className="mt-4 space-y-3 text-[12px] leading-[1.6] text-[var(--ink-soft)]">
            <li className="flex gap-2"><Check size={14} className="mt-[3px] shrink-0 text-[var(--success)]" />Only a caretaker you allow can record payments.</li>
            <li className="flex gap-2"><Check size={14} className="mt-[3px] shrink-0 text-[var(--success)]" />Moving tenants out, deposits and settings stay with you.</li>
            <li className="flex gap-2"><Check size={14} className="mt-[3px] shrink-0 text-[var(--success)]" />Every reading, repair and payment shows who entered it.</li>
          </ul>
          <div className="mt-6 flex items-start gap-3 border-t border-[var(--line-soft)] pt-5">
            <ShieldCheck size={20} className="shrink-0 text-[var(--success)]" />
            <p className="text-[12px] leading-[1.5] text-[var(--ink-soft)]">
              Sign-in by SMS code, sessions you can end at once, and a record of every change.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

function Faq() {
  const [open, setOpen] = useState(0)

  return (
    <section id="questions" className={`${sectionClass} scroll-mt-[70px] py-16 sm:py-20`}>
      <div className="grid gap-10 lg:grid-cols-[1fr_1.6fr]">
        <div>
          <div className={eyebrowClass}>Questions</div>
          <h2 className={headingClass}>What owners ask first</h2>
          <p className="mt-4 max-w-[360px] text-[13px] leading-[1.6] text-[var(--ink-soft)]">
            Something else on your mind? <a href="#get-an-account" className="font-bold text-[var(--accent-ink)]">Get in touch</a>.
          </p>
        </div>

        <div className="overflow-hidden rounded-[10px] border border-[var(--line)] bg-[var(--surface)]">
          {faqs.map((faq, index) => {
            const expanded = open === index

            return (
              <div key={faq.question} className="border-b border-[var(--line-soft)] last:border-b-0">
                <button
                  type="button"
                  onClick={() => setOpen(expanded ? -1 : index)}
                  aria-expanded={expanded}
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left text-[13px] font-bold"
                >
                  {faq.question}
                  <ChevronDown size={16} className={`shrink-0 text-[var(--ink-faint)] transition ${expanded ? 'rotate-180' : ''}`} />
                </button>
                {expanded ? (
                  <p className="px-5 pb-4 text-[12px] leading-[1.6] text-[var(--ink-soft)]">{faq.answer}</p>
                ) : null}
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

function GetAnAccount() {
  const links = contactLinks()

  return (
    <section id="get-an-account" className="auth-visual scroll-mt-[70px] !p-0">
      <div className="ledger-lines" />
      <div className={`${sectionClass} relative z-10 py-16 text-center sm:py-20`}>
        <h2 className="font-display text-[28px] font-semibold leading-[1.2] text-white sm:text-[36px]">
          Ready to close the rent book?
        </h2>
        <p className="mx-auto mt-4 max-w-[520px] text-[13px] leading-[1.6] text-[var(--brand-panel-soft)]">
          Accounts are opened for you, so we can set up your properties and payment accounts
          together. Tell us how many units you manage and we will take it from there.
        </p>

        {links.length ? (
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            {links.map(({ icon: Icon, label, href }, index) => (
              <a
                key={href}
                href={href}
                target={href.startsWith('https:') ? '_blank' : undefined}
                rel={href.startsWith('https:') ? 'noreferrer' : undefined}
                className={
                  index === 0
                    ? primaryClass
                    : 'inline-flex items-center gap-2 rounded-[8px] border border-white/30 px-5 py-[11px] text-[13px] font-bold text-white transition hover:bg-white/10'
                }
              >
                <Icon size={15} />
                {label}
              </a>
            ))}
          </div>
        ) : (
          <p className="mt-8 text-[12px] text-[var(--brand-panel-soft)]">Contact details are coming soon.</p>
        )}

        <p className="mt-10 text-[12px] text-[var(--brand-panel-soft)]">
          Already have an account?{' '}
          <Link to="/login" className="font-bold text-white underline-offset-4 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </section>
  )
}

function Footer() {
  return (
    <footer className="border-t border-[var(--line)] bg-[var(--surface)]">
      <div className={`${sectionClass} flex flex-wrap items-center justify-between gap-3 py-6 text-[11px] text-[var(--ink-faint)]`}>
        <div className="flex items-center gap-[10px]">
          <div className="brand-mark !h-[22px] !w-[22px] !text-[11px]">K</div>
          <span>
            © {new Date().getFullYear()} {APP_NAME} · Rental management
          </span>
        </div>
        <div className="flex gap-5">
          <a href="#questions" className="font-semibold hover:text-[var(--ink)]">Questions</a>
          <Link to="/terms" className="font-semibold hover:text-[var(--ink)]">Terms</Link>
          <Link to="/privacy" className="font-semibold hover:text-[var(--ink)]">Privacy</Link>
          <Link to="/login" className="font-semibold hover:text-[var(--ink)]">Sign in</Link>
        </div>
      </div>
    </footer>
  )
}

export default HomePage
