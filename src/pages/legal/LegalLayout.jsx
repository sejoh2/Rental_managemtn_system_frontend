import { Link } from 'react-router-dom'
import ThemeToggle from '../../components/common/ThemeToggle'
import { LEGAL } from '../../config/legal'

// The frame of the Terms and Privacy pages: readable on a phone, open to everyone.
function LegalLayout({ title, children }) {
  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--ink)]">
      <header className="sticky top-0 z-30 border-b border-[var(--line)] bg-[var(--surface)]">
        <div className="mx-auto flex h-[60px] w-full max-w-[860px] items-center justify-between gap-4 px-5 sm:px-8">
          <Link to="/" className="flex items-center gap-[10px]" aria-label={`${LEGAL.shortName} home`}>
            <div className="brand-mark">K</div>
            <span className="font-display text-[16px] font-semibold">{LEGAL.shortName}</span>
          </Link>
          <ThemeToggle />
        </div>
      </header>

      <main className="mx-auto w-full max-w-[860px] px-5 py-10 sm:px-8">
        <h1 className="font-display text-[30px] font-semibold leading-tight sm:text-[36px]">{title}</h1>
        <p className="mt-2 text-[13px] text-[var(--ink-faint)]">
          Effective {LEGAL.effectiveDate} · {LEGAL.provider}
        </p>
        <div className="legal-text mt-8 grid gap-6 text-[14.5px] leading-[1.75] text-[var(--ink-soft)]">{children}</div>
      </main>

      <footer className="border-t border-[var(--line)] bg-[var(--surface)]">
        <div className="mx-auto flex w-full max-w-[860px] flex-wrap gap-5 px-5 py-6 text-[12px] font-semibold text-[var(--ink-faint)] sm:px-8">
          <Link to="/" className="hover:text-[var(--ink)]">Home</Link>
          <Link to="/terms" className="hover:text-[var(--ink)]">Terms</Link>
          <Link to="/privacy" className="hover:text-[var(--ink)]">Privacy</Link>
          <a href={`mailto:${LEGAL.email}`} className="hover:text-[var(--ink)]">{LEGAL.email}</a>
        </div>
      </footer>
    </div>
  )
}

export function Section({ title, children }) {
  return (
    <section className="grid gap-3">
      <h2 className="font-display text-[19px] font-semibold text-[var(--ink)]">{title}</h2>
      {children}
    </section>
  )
}

export function List({ items }) {
  return (
    <ul className="grid list-disc gap-[6px] pl-5">
      {items.map((item) => (
        <li key={typeof item === 'string' ? item : item.key}>{item}</li>
      ))}
    </ul>
  )
}

export default LegalLayout
