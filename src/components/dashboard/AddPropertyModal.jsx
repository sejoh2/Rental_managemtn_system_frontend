import { useState } from 'react';
import { X, Check, X as XIcon } from 'lucide-react';

function AddPropertyModal({ open, onClose }) {
  if (!open) return null;

  const [rentProvider, setRentProvider] = useState('mpesa_paybill');
  const [waterProvider, setWaterProvider] = useState('bank_equity');
  const [rentConnected, setRentConnected] = useState(false);
  const [waterConnected, setWaterConnected] = useState(false);
  const [waterMethod, setWaterMethod] = useState('metered');
  const [rentConnecting, setRentConnecting] = useState(false);
  const [waterConnecting, setWaterConnecting] = useState(false);
  const [rentChecks, setRentChecks] = useState([false, false, false, false]);
  const [waterChecks, setWaterChecks] = useState([false, false, false, false]);

  const providerFieldGroups = {
    mpesa_paybill: 'paybill',
    mpesa_till: 'till',
    bank_equity: 'bank',
    bank_kcb: 'bank',
    bank_coop: 'bank',
    bank_ncba: 'bank',
    bank_absa: 'bank'
  };

  const providerSetupTimes = {
    paybill: '~10 minutes',
    till: '~10 minutes',
    bank: '~1–2 business days (bank approval required)'
  };

  const providerLabels = {
    mpesa_paybill: 'M-Pesa PayBill',
    mpesa_till: 'M-Pesa Till Number',
    bank_equity: 'Equity Bank',
    bank_kcb: 'KCB Bank',
    bank_coop: 'Co-operative Bank',
    bank_ncba: 'NCBA Bank',
    bank_absa: 'ABSA Bank'
  };

  const checkLabels = [
    'Credentials valid',
    'Authorization successful',
    'Callback registered',
    'Ready to receive payments'
  ];

  const connectGuideSteps = {
    paybill: [
      'Log in to the Safaricom Daraja portal and create an app',
      'Copy the Consumer Key from your app',
      'Copy the Consumer Secret from your app',
      'Enter your Business Shortcode (and Passkey if using STK Push)',
      'Click Connect — Kodi validates and registers the callback automatically'
    ],
    till: [
      'Log in to the Safaricom Daraja portal and create an app',
      'Copy the Consumer Key and Consumer Secret',
      'Enter your Till Number',
      'Click Connect — Kodi validates and registers the callback automatically'
    ],
    bank: [
      "Log in to your bank's business/developer portal",
      'Request API access for collections on this account',
      'Copy the Merchant ID and API Key',
      'Copy the API Secret and Webhook Token',
      'Enter your Collection Account and click Connect — approval can take 1–2 business days'
    ]
  };

  const getProviderGroup = (provider) => providerFieldGroups[provider] || 'paybill';
  const getSetupTime = (provider) => providerSetupTimes[getProviderGroup(provider)];

  function handleSubmit(event) {
    event.preventDefault();
    onClose();
  }

  function handleConnect(prefix) {
    const setConnecting = prefix === 'rent' ? setRentConnecting : setWaterConnecting;
    const setChecks = prefix === 'rent' ? setRentChecks : setWaterChecks;
    const setConnected = prefix === 'rent' ? setRentConnected : setWaterConnected;

    setConnecting(true);
    setChecks([false, false, false, false]);

    // Simulate checks one by one
    [0, 1, 2, 3].forEach((index) => {
      setTimeout(() => {
        setChecks((prev) => {
          const newChecks = [...prev];
          newChecks[index] = true;
          return newChecks;
        });
        if (index === 3) {
          setTimeout(() => {
            setConnecting(false);
            setConnected(true);
          }, 300);
        }
      }, (index + 1) * 400);
    });
  }

  function handleDisconnect(prefix) {
    const setConnected = prefix === 'rent' ? setRentConnected : setWaterConnected;
    const setChecks = prefix === 'rent' ? setRentChecks : setWaterChecks;
    setConnected(false);
    setChecks([false, false, false, false]);
  }

  function renderProviderFields(prefix, provider, connected) {
    const group = getProviderGroup(provider);

    const fields = {
      paybill: [
        { id: 'shortcode', label: 'Business shortcode', placeholder: 'e.g. 400200', type: 'text' },
        { id: 'consumerKey', label: 'Consumer key', placeholder: 'Daraja consumer key', type: 'text' },
        { id: 'consumerSecret', label: 'Consumer secret', placeholder: 'Daraja consumer secret', type: 'password' },
        { id: 'passkey', label: 'Passkey (optional — STK Push)', placeholder: 'Optional', type: 'password' }
      ],
      till: [
        { id: 'tillNumber', label: 'Till number', placeholder: 'e.g. 552233', type: 'text' },
        { id: 'consumerKey', label: 'Consumer key', placeholder: 'Daraja consumer key', type: 'text' },
        { id: 'consumerSecret', label: 'Consumer secret', placeholder: 'Daraja consumer secret', type: 'password' }
      ],
      bank: [
        { id: 'merchantId', label: 'Merchant ID', placeholder: 'e.g. MER-40021', type: 'text' },
        { id: 'apiKey', label: 'API key', placeholder: 'Bank API key', type: 'text' },
        { id: 'apiSecret', label: 'API secret', placeholder: 'Bank API secret', type: 'password' },
        { id: 'webhookToken', label: 'Webhook token', placeholder: 'For payment notifications', type: 'password' },
        { id: 'collectionAccount', label: 'Collection account', placeholder: 'e.g. 1102334471', type: 'text' }
      ]
    };

    const fieldList = fields[group] || fields.paybill;
    const cols = fieldList.length > 2 ? 'grid-cols-2' : 'grid-cols-1';

    return (
      <div className={`grid gap-[14px] ${cols}`}>
        {fieldList.map((field) => (
          <div key={field.id} className={fieldList.length > 2 && field.id === 'passkey' ? 'col-span-2' : ''}>
            <label className="mb-2 block text-[11px] font-bold text-[var(--ink)]">
              {field.label}
            </label>
            <input
              type={field.type}
              placeholder={field.placeholder}
              disabled={connected}
              className="h-10 w-full rounded-[8px] border border-[var(--line)] bg-white px-3 text-[12px] text-[var(--ink)] outline-none transition placeholder:text-[var(--ink-faint)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)] disabled:bg-[var(--line-soft)] disabled:text-[var(--ink-faint)]"
            />
          </div>
        ))}
      </div>
    );
  }

  function renderChecks(checks, connecting, connected) {
    if (!connecting && !connected) return null;

    return (
      <div className="mt-3 space-y-1.5">
        {checkLabels.map((label, index) => {
          const passed = checks[index];
          const isPending = connecting && !passed;
          return (
            <div key={index} className="flex items-center gap-2 text-[11px]">
              <span className="flex h-4 w-4 items-center justify-center flex-shrink-0">
                {passed ? (
                  <Check size={12} className="text-[var(--success)]" strokeWidth={2.5} />
                ) : isPending ? (
                  <span className="h-3.5 w-3.5 rounded-full border border-[var(--line)]" />
                ) : (
                  <XIcon size={12} className="text-[var(--danger)]" strokeWidth={2.5} />
                )}
              </span>
              <span className={passed ? 'text-[var(--success)]' : isPending ? 'text-[var(--ink-faint)]' : 'text-[var(--danger)]'}>
                {label}
              </span>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/45 px-4 py-8">
      <div className="flex max-h-[90vh] w-full max-w-[720px] flex-col overflow-hidden rounded-[14px] bg-white shadow-[0_24px_80px_rgba(0,0,0,0.28)]">
        <div className="flex items-center justify-between border-b border-[var(--line)] px-[22px] py-[18px]">
          <h2 className="font-display text-[15px] font-semibold text-[var(--ink)]">
            Add property
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--line-soft)] text-[var(--ink-soft)] transition hover:bg-[var(--line)] hover:text-[var(--ink)]"
            aria-label="Close add property modal"
          >
            <X size={15} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto px-[22px] py-[22px]">
            <p className="mb-[18px] text-[11px] leading-[1.5] text-[var(--ink-faint)]">
              Your account can hold as many properties as you own — each with
              its own units, tenants, caretaker and payment accounts. You're
              currently managing 3.
            </p>

            {/* Property Details */}
            <div className="grid gap-[14px] sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="mb-2 block text-[11px] font-bold text-[var(--ink)]">
                  Property name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Green View Apartments"
                  className="h-10 w-full rounded-[8px] border border-[var(--line)] bg-white px-3 text-[12px] text-[var(--ink)] outline-none transition placeholder:text-[var(--ink-faint)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)]"
                />
              </div>

              <div>
                <label className="mb-2 block text-[11px] font-bold text-[var(--ink)]">
                  Location
                </label>
                <input
                  type="text"
                  placeholder="e.g. Kilimani, Nairobi"
                  className="h-10 w-full rounded-[8px] border border-[var(--line)] bg-white px-3 text-[12px] text-[var(--ink)] outline-none transition placeholder:text-[var(--ink-faint)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)]"
                />
              </div>

              <div>
                <label className="mb-2 block text-[11px] font-bold text-[var(--ink)]">
                  Property type
                </label>
                <select className="h-10 w-full rounded-[8px] border border-[var(--line)] bg-white px-3 text-[12px] text-[var(--ink)] outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)]">
                  <option>Apartment block</option>
                  <option>Bedsitter block</option>
                  <option>Commercial</option>
                  <option>Mixed-use</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-[11px] font-bold text-[var(--ink)]">
                  Number of units
                </label>
                <input
                  type="text"
                  placeholder="e.g. 24"
                  className="h-10 w-full rounded-[8px] border border-[var(--line)] bg-white px-3 text-[12px] text-[var(--ink)] outline-none transition placeholder:text-[var(--ink-faint)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)]"
                />
              </div>

              <div>
                <label className="mb-2 block text-[11px] font-bold text-[var(--ink)]">
                  Rent due day
                </label>
                <input
                  type="text"
                  placeholder="5th of every month"
                  className="h-10 w-full rounded-[8px] border border-[var(--line)] bg-white px-3 text-[12px] text-[var(--ink)] outline-none transition placeholder:text-[var(--ink-faint)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)]"
                />
              </div>

              <div>
                <label className="mb-2 block text-[11px] font-bold text-[var(--ink)]">
                  SMS sender ID
                </label>
                <input
                  type="text"
                  placeholder="e.g. KODI-GVA"
                  className="h-10 w-full rounded-[8px] border border-[var(--line)] bg-white px-3 text-[12px] text-[var(--ink)] outline-none transition placeholder:text-[var(--ink-faint)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)]"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="mb-2 block text-[11px] font-bold text-[var(--ink)]">
                  Assigned caretaker
                </label>
                <select className="h-10 w-full rounded-[8px] border border-[var(--line)] bg-white px-3 text-[12px] text-[var(--ink)] outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)]">
                  <option>None — assign later</option>
                  <option>Peter Mwangi</option>
                  <option>Ruth Chebet</option>
                  <option>James Odhiambo</option>
                </select>
              </div>
            </div>

            {/* Payment Accounts Section */}
            <div className="mt-[22px] mb-[14px] flex items-center gap-3">
              <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--accent)]">
                Payment accounts
              </div>
              <div className="h-px flex-1 bg-[var(--line)]" />
            </div>

            <p className="mb-4 text-[11px] leading-[1.5] text-[var(--ink-faint)]">
              Connect the account that should receive rent and water payments for
              this property — like connecting Stripe or M-Pesa to any other app.
              These credentials belong only to this property.
            </p>

            {/* Rent Account */}
            <div className="mb-4 rounded-[10px] border border-[var(--line)] bg-white p-4">
              <div className="mb-3 flex items-center justify-between">
                <div className="text-[13px] font-bold text-[var(--ink)]">Rent account</div>
                <span className={`text-[11px] font-bold ${rentConnected ? 'text-[var(--success)]' : 'text-[var(--ink-faint)]'}`}>
                  {rentConnected ? 'Connected' : 'Not connected'}
                </span>
              </div>

              <div className="mb-3">
                <label className="mb-2 block text-[11px] font-bold text-[var(--ink)]">
                  Payment provider
                </label>
                <select
                  value={rentProvider}
                  onChange={(e) => setRentProvider(e.target.value)}
                  disabled={rentConnected || rentConnecting}
                  className="h-10 w-full rounded-[8px] border border-[var(--line)] bg-white px-3 text-[12px] text-[var(--ink)] outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)] disabled:bg-[var(--line-soft)] disabled:text-[var(--ink-faint)]"
                >
                  <optgroup label="M-Pesa">
                    <option value="mpesa_paybill">M-Pesa PayBill</option>
                    <option value="mpesa_till">M-Pesa Till Number</option>
                  </optgroup>
                  <optgroup label="Bank">
                    <option value="bank_equity">Equity Bank</option>
                    <option value="bank_kcb">KCB Bank</option>
                    <option value="bank_coop">Co-operative Bank</option>
                    <option value="bank_ncba">NCBA Bank</option>
                    <option value="bank_absa">ABSA Bank</option>
                  </optgroup>
                </select>
              </div>

              {renderProviderFields('rent', rentProvider, rentConnected)}

              <div className="mt-3 flex items-center gap-2 text-[11px] text-[var(--ink-faint)]">
                <span>⏱</span>
                <span>Estimated setup time: {getSetupTime(rentProvider)}</span>
              </div>

              {renderChecks(rentChecks, rentConnecting, rentConnected)}

              <div className="mt-3 flex items-center justify-between gap-3">
                <button
                  type="button"
                  className="text-[11px] font-bold text-[var(--accent)] hover:underline"
                  onClick={() => alert('View guide for ' + providerLabels[rentProvider])}
                >
                  Need help? View guide
                </button>
                <div className="flex gap-2">
                  {rentConnected ? (
                    <>
                      <button
                        type="button"
                        className="rounded-[8px] border border-[var(--danger)] px-3 py-1.5 text-[11px] font-bold text-[var(--danger)] transition hover:bg-[var(--danger-soft)]"
                        onClick={() => handleDisconnect('rent')}
                      >
                        Disconnect
                      </button>
                      <button
                        type="button"
                        className="rounded-[8px] border border-[var(--accent)] bg-[var(--accent)] px-3 py-1.5 text-[11px] font-bold text-white transition hover:border-[var(--accent-hover)] hover:bg-[var(--accent-hover)]"
                        onClick={() => handleConnect('rent')}
                        disabled={rentConnecting}
                      >
                        {rentConnecting ? 'Connecting...' : 'Reconnect'}
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      className="rounded-[8px] border border-[var(--accent)] bg-[var(--accent)] px-3 py-1.5 text-[11px] font-bold text-white transition hover:border-[var(--accent-hover)] hover:bg-[var(--accent-hover)] disabled:opacity-50"
                      onClick={() => handleConnect('rent')}
                      disabled={rentConnecting}
                    >
                      {rentConnecting ? 'Connecting...' : 'Connect'}
                    </button>
                  )}
                </div>
              </div>

              <div className="mt-3 flex items-center gap-2 text-[10.5px] text-[var(--ink-faint)]">
                <span>✓</span>
                <span>Credentials are encrypted at rest — the full secret is never shown again after connecting.</span>
              </div>
            </div>

            {/* Water Account */}
            <div className="mb-4 rounded-[10px] border border-[var(--line)] bg-white p-4">
              <div className="mb-3 flex items-center justify-between">
                <div className="text-[13px] font-bold text-[var(--ink)]">Water account</div>
                <span className={`text-[11px] font-bold ${waterConnected ? 'text-[var(--success)]' : 'text-[var(--ink-faint)]'}`}>
                  {waterConnected ? 'Connected' : 'Not connected'}
                </span>
              </div>

              <div className="mb-3">
                <label className="mb-2 block text-[11px] font-bold text-[var(--ink)]">
                  Payment provider
                </label>
                <select
                  value={waterProvider}
                  onChange={(e) => setWaterProvider(e.target.value)}
                  disabled={waterConnected || waterConnecting}
                  className="h-10 w-full rounded-[8px] border border-[var(--line)] bg-white px-3 text-[12px] text-[var(--ink)] outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)] disabled:bg-[var(--line-soft)] disabled:text-[var(--ink-faint)]"
                >
                  <optgroup label="M-Pesa">
                    <option value="mpesa_paybill">M-Pesa PayBill</option>
                    <option value="mpesa_till">M-Pesa Till Number</option>
                  </optgroup>
                  <optgroup label="Bank">
                    <option value="bank_equity">Equity Bank</option>
                    <option value="bank_kcb">KCB Bank</option>
                    <option value="bank_coop">Co-operative Bank</option>
                    <option value="bank_ncba">NCBA Bank</option>
                    <option value="bank_absa">ABSA Bank</option>
                  </optgroup>
                </select>
              </div>

              {renderProviderFields('water', waterProvider, waterConnected)}

              <div className="mt-3 flex items-center gap-2 text-[11px] text-[var(--ink-faint)]">
                <span>⏱</span>
                <span>Estimated setup time: {getSetupTime(waterProvider)}</span>
              </div>

              {renderChecks(waterChecks, waterConnecting, waterConnected)}

              <div className="mt-3 flex items-center justify-between gap-3">
                <button
                  type="button"
                  className="text-[11px] font-bold text-[var(--accent)] hover:underline"
                  onClick={() => alert('View guide for ' + providerLabels[waterProvider])}
                >
                  Need help? View guide
                </button>
                <div className="flex gap-2">
                  {waterConnected ? (
                    <>
                      <button
                        type="button"
                        className="rounded-[8px] border border-[var(--danger)] px-3 py-1.5 text-[11px] font-bold text-[var(--danger)] transition hover:bg-[var(--danger-soft)]"
                        onClick={() => handleDisconnect('water')}
                      >
                        Disconnect
                      </button>
                      <button
                        type="button"
                        className="rounded-[8px] border border-[var(--accent)] bg-[var(--accent)] px-3 py-1.5 text-[11px] font-bold text-white transition hover:border-[var(--accent-hover)] hover:bg-[var(--accent-hover)]"
                        onClick={() => handleConnect('water')}
                        disabled={waterConnecting}
                      >
                        {waterConnecting ? 'Connecting...' : 'Reconnect'}
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      className="rounded-[8px] border border-[var(--accent)] bg-[var(--accent)] px-3 py-1.5 text-[11px] font-bold text-white transition hover:border-[var(--accent-hover)] hover:bg-[var(--accent-hover)] disabled:opacity-50"
                      onClick={() => handleConnect('water')}
                      disabled={waterConnecting}
                    >
                      {waterConnecting ? 'Connecting...' : 'Connect'}
                    </button>
                  )}
                </div>
              </div>

              <div className="mt-3 flex items-center gap-2 text-[10.5px] text-[var(--ink-faint)]">
                <span>✓</span>
                <span>Credentials are encrypted at rest — the full secret is never shown again after connecting.</span>
              </div>
            </div>

            {/* Water Billing Section */}
            <div className="mt-[6px] mb-[14px] flex items-center gap-3">
              <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--accent)]">
                Water billing
              </div>
              <div className="h-px flex-1 bg-[var(--line)]" />
            </div>

            <div className="grid gap-[14px]">
              <div>
                <label className="mb-2 block text-[11px] font-bold text-[var(--ink)]">
                  Billing method
                </label>
                <select
                  value={waterMethod}
                  onChange={(e) => setWaterMethod(e.target.value)}
                  className="h-10 w-full rounded-[8px] border border-[var(--line)] bg-white px-3 text-[12px] text-[var(--ink)] outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)]"
                >
                  <option value="metered">Per-unit metered (default)</option>
                  <option value="fixed">Fixed payment every month</option>
                </select>
              </div>

              {waterMethod === 'metered' ? (
                <div>
                  <label className="mb-2 block text-[11px] font-bold text-[var(--ink)]">
                    Water rate per unit (KES)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 100"
                    className="h-10 w-full rounded-[8px] border border-[var(--line)] bg-white px-3 text-[12px] text-[var(--ink)] outline-none transition placeholder:text-[var(--ink-faint)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)]"
                  />
                </div>
              ) : (
                <div>
                  <label className="mb-2 block text-[11px] font-bold text-[var(--ink)]">
                    Fixed water fee (KES / month)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 500"
                    className="h-10 w-full rounded-[8px] border border-[var(--line)] bg-white px-3 text-[12px] text-[var(--ink)] outline-none transition placeholder:text-[var(--ink-faint)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)]"
                  />
                </div>
              )}

              <p className="text-[11px] leading-[1.5] text-[var(--ink-faint)]">
                Most properties bill water per unit from the meter reading. Fixed
                monthly payment is less common — use it only if this property
                isn't metered. Full rules — billing day, reading deadlines and
                missed-reading handling — can be fine-tuned later from Settings
                › Water rules.
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-[10px] border-t border-[var(--line)] px-[22px] py-[16px]">
            <button
              type="button"
              onClick={onClose}
              className="rounded-[8px] border border-[var(--line)] bg-white px-5 py-[10px] text-[12px] font-bold text-[var(--ink)] transition hover:bg-[var(--line-soft)]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-[8px] border border-[var(--accent)] bg-[var(--accent)] px-5 py-[10px] text-[12px] font-bold text-white transition hover:border-[var(--accent-hover)] hover:bg-[var(--accent-hover)]"
            >
              Add property
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddPropertyModal;