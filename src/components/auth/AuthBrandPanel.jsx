function AuthBrandPanel() {
  return (
    <aside className="auth-visual min-h-[500px] lg:min-h-[calc(100vh-34px)]">
      <div className="ledger-lines" />

      <div className="relative z-10 flex items-center gap-[10px]">
        <div className="brand-mark">K</div>
        <div>
          <div className="font-display text-[15px] font-semibold leading-none text-white">
            Kodi
          </div>
          <div className="mt-[6px] text-[9.5px] uppercase tracking-[0.04em] text-[var(--brand-panel-soft)]">
            Rental Management
          </div>
        </div>
      </div>

      <div className="relative z-10 max-w-[460px] py-16 lg:py-0">
        <div className="mb-[14px] text-[10px] font-bold uppercase tracking-[0.1em] text-[#E8A87C]">
          No more lost rent books
        </div>

        <h1 className="font-display max-w-[440px] text-[26px] font-semibold leading-[1.2] tracking-[-0.01em] text-white sm:text-[30px]">
          Every unit, tenant and shilling — accounted for automatically.
        </h1>

        <p className="mt-[14px] max-w-[430px] text-[12px] leading-[1.6] text-[var(--brand-panel-soft)]">
          Kodi replaces the physical rent book with automatic M-Pesa and bank
          matching, water billing, and SMS reminders for property owners.
        </p>
      </div>

      <div className="relative z-10 flex flex-wrap gap-x-[24px] gap-y-4">
  <FeatureStat title="M-Pesa" label="Auto matching" />
  <FeatureStat title="Water" label="Meter billing" />
  <FeatureStat title="SMS" label="Rent reminders" />
</div>
    </aside>
  )
}

function FeatureStat({ title, label }) {
  return (
    <div>
      <div className="font-mono text-[18px] font-semibold leading-none text-white">
        {title}
      </div>
      <div className="mt-[5px] text-[9.5px] uppercase tracking-[0.04em] text-[var(--brand-panel-soft)]">
        {label}
      </div>
    </div>
  )
}

export default AuthBrandPanel