import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';
import { assignCaretaker, listCaretakers } from '../../api/caretakers';
import { createProperty } from '../../api/properties';
import { getSettings } from '../../api/settings';
import { useProperties } from '../../context/PropertiesContext';
import { useApi } from '../../hooks/useApi';
import {
  MOVE_IN_BILLING,
  MOVE_OUT_BILLING,
  PROPERTY_TYPES,
  RENT_DUE_DAYS,
  SERVICE_CHARGE_ACCOUNTS,
  WATER_BILLING_METHODS,
} from '../../utils/labels';
import {
  caretakerDetails,
  emptyAccount,
  emptyCaretaker,
  uniqueCaretakers,
} from '../../utils/propertyForm';
import { FormError } from '../common/DataState';
import CaretakerField from './CaretakerField';
import PaymentAccountCard from './PaymentAccountCard';
import SmsSenderField from './SmsSenderField';

const inputClass =
  'h-10 w-full rounded-[8px] border border-[var(--line)] bg-[var(--surface)] px-3 text-[12px] text-[var(--ink)] outline-none transition placeholder:text-[var(--ink-faint)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)] disabled:bg-[var(--line-soft)] disabled:text-[var(--ink-faint)]';

const labelClass = 'mb-2 block text-[11px] font-bold text-[var(--ink)]';

// Water and electricity can each have their own account, or be paid through the rent account.
// Service charges can also have an account of their own, or be paid into one of the others.
const optionalAccounts = [
  ['water', 'Water account'],
  ['electricity', 'Electricity account'],
  ['service', 'Service charges account'],
];

function AddPropertyModal({ open, onClose }) {
  if (!open) return null;

  return <AddPropertyForm onClose={onClose} />;
}

function AddPropertyForm({ onClose }) {
  const navigate = useNavigate();
  const properties = useProperties();
  const caretakers = useApi('caretakers', listCaretakers);
  const settings = useApi('settings', getSettings);

  const [form, setForm] = useState({
    name: '',
    location: '',
    property_type: 'apartment_block',
    expected_units: '',
    // Empty until the owner picks one; the Settings default is used meanwhile.
    rent_due_day: '',
    move_in_billing: 'prorated',
    move_out_billing: 'prorated',
    sms_sender_id: '',
    water_billing_method: 'per_unit_metered',
    water_rate_per_unit: '',
    water_fixed_fee: '',
    service_charge_account: 'rent',
  });
  const [accounts, setAccounts] = useState({
    rent: emptyAccount,
    water: emptyAccount,
    electricity: emptyAccount,
    service: emptyAccount,
  });
  const [separateAccount, setSeparateAccount] = useState({
    water: true,
    electricity: false,
    service: false,
  });
  const [caretaker, setCaretaker] = useState(emptyCaretaker);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  // Set when the property was saved but assigning the caretaker failed.
  const [partialResult, setPartialResult] = useState(null);

  const existingCaretakers = uniqueCaretakers(caretakers.data);
  const rentDueDay =
    form.rent_due_day || String(settings.data?.defaults.default_rent_due_day || 5);

  /*
    Service charges and repairs are paid into one account: their own account
    when one is being added, otherwise rent, or a separate water or
    electricity account being added.
  */
  const serviceChargeAccounts = SERVICE_CHARGE_ACCOUNTS.filter(
    ([accountFor]) => accountFor === 'rent' || (accountFor !== 'service' && separateAccount[accountFor])
  );
  const serviceChargeAccount = separateAccount.service
    ? 'service'
    : serviceChargeAccounts.some(([accountFor]) => accountFor === form.service_charge_account)
      ? form.service_charge_account
      : 'rent';

  function setField(field) {
    return (event) => setForm((current) => ({ ...current, [field]: event.target.value }));
  }

  function patchAccount(accountFor, patch) {
    setAccounts((current) => ({
      ...current,
      [accountFor]: { ...current[accountFor], ...patch },
    }));
  }

  function finish(property) {
    properties.reload();
    onClose();
    navigate(`/properties/${property.id}`);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError(null);

    const usedAccounts = [
      'rent',
      ...optionalAccounts.map(([accountFor]) => accountFor).filter((accountFor) => separateAccount[accountFor]),
    ];
    const notConnected = usedAccounts.find((accountFor) => accounts[accountFor].status !== 'connected');

    if (notConnected) {
      setError({
        message:
          notConnected === 'rent'
            ? 'Connect the rent account before adding the property.'
            : notConnected === 'service'
              ? 'Connect the service charges account, or remove it.'
              : `Connect the ${notConnected} account, or choose to pay ${notConnected} through the rent account.`,
      });
      return;
    }

    // A validated connection is only held by the backend for a few minutes.
    const expired = usedAccounts.filter((accountFor) => Date.now() > accounts[accountFor].expiresAt);

    if (expired.length) {
      expired.forEach((accountFor) =>
        patchAccount(accountFor, {
          status: 'idle',
          connectionId: null,
          error: { message: 'This connection expired. Click Connect again.' },
        })
      );
      setError({ message: 'A payment account connection expired. Reconnect it and try again.' });
      return;
    }

    setSubmitting(true);

    let property;

    try {
      property = await createProperty({
        name: form.name,
        location: form.location,
        property_type: form.property_type,
        expected_units: Number(form.expected_units) || 0,
        rent_due_day: Number(rentDueDay),
        move_in_billing: form.move_in_billing,
        move_out_billing: form.move_out_billing,
        sms_sender_id: form.sms_sender_id.trim() || null,
        water_billing_method: form.water_billing_method,
        ...(form.water_billing_method === 'per_unit_metered'
          ? { water_rate_per_unit: Number(form.water_rate_per_unit) }
          : {}),
        ...(form.water_billing_method === 'fixed_monthly'
          ? { water_fixed_fee: Number(form.water_fixed_fee) }
          : {}),
        rent_connection_id: accounts.rent.connectionId,
        water_connection_id: separateAccount.water ? accounts.water.connectionId : null,
        electricity_connection_id: separateAccount.electricity
          ? accounts.electricity.connectionId
          : null,
        service_connection_id: separateAccount.service ? accounts.service.connectionId : null,
        service_charge_account: serviceChargeAccount,
      });
    } catch (createError) {
      setError(createError);
      setSubmitting(false);
      return;
    }

    const details = caretakerDetails(caretaker, existingCaretakers);

    if (!details) {
      finish(property);
      return;
    }

    try {
      await assignCaretaker(property.id, details);
      finish(property);
    } catch (caretakerError) {
      // The property exists now, so do not let the owner submit the form again.
      properties.reload();
      setPartialResult({ property, caretakerError });
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/45 px-4 py-8">
      <div className="flex max-h-[90vh] w-full max-w-[720px] flex-col overflow-hidden rounded-[14px] bg-[var(--surface)] shadow-[0_24px_80px_rgba(0,0,0,0.28)]">
        <div className="flex items-center justify-between border-b border-[var(--line)] px-[22px] py-[18px]">
          <h2 className="font-display text-[15px] font-semibold text-[var(--ink)]">
            Add property
          </h2>
          <button
            type="button"
            onClick={partialResult ? () => finish(partialResult.property) : onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--line-soft)] text-[var(--ink-soft)] transition hover:bg-[var(--line)] hover:text-[var(--ink)]"
            aria-label="Close add property modal"
          >
            <X size={15} />
          </button>
        </div>

        {partialResult ? (
          <>
            <div className="flex-1 overflow-y-auto px-[22px] py-[22px]">
              <div className="mb-[14px] rounded-[8px] border border-[var(--line)] bg-[var(--surface)] px-4 py-4">
                <h3 className="text-[14px] font-bold text-[var(--success)]">
                  {partialResult.property.name} was added
                </h3>
                <p className="mt-1 text-[11px] leading-[1.5] text-[var(--ink-faint)]">
                  The property and its payment accounts are saved.
                </p>
              </div>

              <div className="rounded-[8px] border border-[var(--line)] bg-[var(--surface)] px-4 py-4">
                <h3 className="text-[14px] font-bold text-[var(--warning)]">
                  The caretaker could not be assigned
                </h3>
                <p className="mt-1 text-[11px] leading-[1.5] text-[var(--ink-faint)]">
                  {partialResult.caretakerError.message} You can assign a
                  caretaker to this property from the Caretakers page.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-[10px] border-t border-[var(--line)] px-[22px] py-[16px]">
              <button
                type="button"
                onClick={() => finish(partialResult.property)}
                className="rounded-[8px] border border-[var(--accent)] bg-[var(--accent)] px-5 py-[10px] text-[12px] font-bold text-white transition hover:border-[var(--accent-hover)] hover:bg-[var(--accent-hover)]"
              >
                Done
              </button>
            </div>
          </>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto px-[22px] py-[22px]">
              <p className="mb-[18px] text-[11px] leading-[1.5] text-[var(--ink-faint)]">
                Your account can hold as many properties as you own — each with
                its own units, tenants, caretaker and payment accounts.
                {properties.data ? ` You're currently managing ${properties.data.length}.` : ''}
              </p>

              {/* Property Details */}
              <div className="grid gap-[14px] sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className={labelClass}>Property name</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={setField('name')}
                    required
                    minLength={2}
                    placeholder="e.g. Green View Apartments"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>Location</label>
                  <input
                    type="text"
                    value={form.location}
                    onChange={setField('location')}
                    required
                    minLength={2}
                    placeholder="e.g. Kilimani, Nairobi"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>Property type</label>
                  <select
                    value={form.property_type}
                    onChange={setField('property_type')}
                    className={inputClass}
                  >
                    {PROPERTY_TYPES.map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={labelClass}>Number of units</label>
                  <input
                    type="number"
                    min="0"
                    value={form.expected_units}
                    onChange={setField('expected_units')}
                    placeholder="e.g. 24"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>Rent due day</label>
                  <select
                    value={rentDueDay}
                    onChange={setField('rent_due_day')}
                    className={inputClass}
                  >
                    {RENT_DUE_DAYS.map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>

                <SmsSenderField
                  value={form.sms_sender_id}
                  onChange={(value) => setForm((current) => ({ ...current, sms_sender_id: value }))}
                />

                <div className="sm:col-span-2">
                  <label className={labelClass}>If a tenant moves in mid-month</label>
                  <select
                    value={form.move_in_billing}
                    onChange={setField('move_in_billing')}
                    className={inputClass}
                  >
                    {MOVE_IN_BILLING.map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className={labelClass}>If a tenant moves out mid-month</label>
                  <select
                    value={form.move_out_billing}
                    onChange={setField('move_out_billing')}
                    className={inputClass}
                  >
                    {MOVE_OUT_BILLING.map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                  <p className="mt-2 text-[10px] leading-[1.5] text-[var(--ink-faint)]">
                    Rent is billed on the 1st of every month. These two rules
                    decide what a tenant pays for a first or last month they
                    only spend part of. Deposits are always charged in full.
                  </p>
                </div>

                <div className="sm:col-span-2">
                  <CaretakerField
                    caretaker={caretaker}
                    onChange={(patch) => setCaretaker((current) => ({ ...current, ...patch }))}
                    existingCaretakers={existingCaretakers}
                    loading={caretakers.loading}
                    newCaretakerNote="The caretaker is created and assigned when you add the property."
                  />
                </div>
              </div>

              {/* Payment Accounts Section */}
              <SectionTitle title="Payment accounts" className="mt-[22px]" />

              <p className="mb-4 text-[11px] leading-[1.5] text-[var(--ink-faint)]">
                Connect the M-Pesa account that receives rent. Water and
                electricity can each have their own account, or be paid
                through the rent account. Every account needs a different
                business number, and these credentials belong only to this
                property.
              </p>

              <PaymentAccountCard
                title="Rent account"
                accountFor="rent"
                account={accounts.rent}
                onChange={(patch) => patchAccount('rent', patch)}
                propertyName={form.name}
                callbackNote="Payment callbacks are registered with Safaricom when you add the property."
              />

              {optionalAccounts.map(([accountFor, title]) =>
                separateAccount[accountFor] ? (
                  <PaymentAccountCard
                    key={accountFor}
                    title={`${title} (optional)`}
                    accountFor={accountFor}
                    account={accounts[accountFor]}
                    onChange={(patch) => patchAccount(accountFor, patch)}
                    propertyName={form.name}
                    callbackNote="Payment callbacks are registered with Safaricom when you add the property."
                    cancelLabel={accountFor === 'service' ? 'Remove this account' : 'Use the rent account instead'}
                    onCancel={() => {
                      patchAccount(accountFor, emptyAccount);
                      setSeparateAccount((current) => ({ ...current, [accountFor]: false }));
                    }}
                  />
                ) : (
                  <div
                    key={accountFor}
                    className="mb-4 flex items-center justify-between gap-4 rounded-[10px] border border-[var(--line)] bg-[var(--surface)] p-4"
                  >
                    <div>
                      <div className="text-[13px] font-bold text-[var(--ink)]">{title}</div>
                      <p className="mt-[4px] text-[11px] text-[var(--ink-faint)]">
                        {accountFor === 'service'
                          ? 'No separate account - service charges are paid into the account chosen below.'
                          : `No separate account - ${accountFor} is paid through the rent account.`}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setSeparateAccount((current) => ({ ...current, [accountFor]: true }))}
                      className="shrink-0 rounded-[8px] border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-[11px] font-bold transition hover:border-[var(--accent-soft-line)] hover:text-[var(--accent-ink)]"
                    >
                      Add {accountFor === 'service' ? 'service charges' : accountFor} account
                    </button>
                  </div>
                )
              )}

              {separateAccount.service ? (
                <p className="mb-4 rounded-[8px] bg-[var(--line-soft)] px-3 py-[10px] text-[11px] leading-[1.5] text-[var(--ink-soft)]">
                  Service charges and repairs are paid into the service charges
                  account only. To have them paid into another account, remove it.
                </p>
              ) : (
                <div className="mb-4">
                  <label className={labelClass}>Service charges and repairs are paid into</label>
                  <select
                    value={serviceChargeAccount}
                    onChange={setField('service_charge_account')}
                    className={inputClass}
                  >
                    {serviceChargeAccounts.map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                  <p className="mt-2 text-[10px] leading-[1.5] text-[var(--ink-faint)]">
                    Service charges are costs you pass on to tenants, such as
                    garbage or security. You add them on the Properties page
                    after the property is created. Money paid into the account
                    chosen here settles that account&apos;s own bills first,
                    then service charges. For an account just for them, add a
                    service charges account above.
                  </p>
                </div>
              )}

              {/* Water Billing Section */}
              <SectionTitle title="Water billing" className="mt-[6px]" />

              <div className="grid gap-[14px]">
                <div>
                  <label className={labelClass}>Billing method</label>
                  <select
                    value={form.water_billing_method}
                    onChange={setField('water_billing_method')}
                    className={inputClass}
                  >
                    {WATER_BILLING_METHODS.map(([value, label]) => (
                      <option key={value} value={value}>
                        {value === 'per_unit_metered' ? `${label} (default)` : label}
                      </option>
                    ))}
                  </select>
                </div>

                {form.water_billing_method === 'per_unit_metered' ? (
                  <div>
                    <label className={labelClass}>Water rate per unit (KES)</label>
                    <input
                      type="number"
                      min="1"
                      step="any"
                      required
                      value={form.water_rate_per_unit}
                      onChange={setField('water_rate_per_unit')}
                      placeholder="e.g. 100"
                      className={inputClass}
                    />
                  </div>
                ) : null}

                {form.water_billing_method === 'fixed_monthly' ? (
                  <div>
                    <label className={labelClass}>Fixed water fee (KES / month)</label>
                    <input
                      type="number"
                      min="1"
                      step="any"
                      required
                      value={form.water_fixed_fee}
                      onChange={setField('water_fixed_fee')}
                      placeholder="e.g. 500"
                      className={inputClass}
                    />
                  </div>
                ) : null}

                <p className="text-[11px] leading-[1.5] text-[var(--ink-faint)]">
                  Most properties bill water per unit from the meter reading. Fixed
                  monthly payment is less common — use it only if this property
                  isn't metered. Full rules — billing day, reading deadlines and
                  missed-reading handling — can be fine-tuned later from Settings
                  › Water rules.
                </p>
              </div>

              {error ? (
                <div className="mt-[18px]">
                  <FormError error={error} />
                </div>
              ) : null}
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-[10px] border-t border-[var(--line)] px-[22px] py-[16px]">
              <button
                type="button"
                onClick={onClose}
                className="rounded-[8px] border border-[var(--line)] bg-[var(--surface)] px-5 py-[10px] text-[12px] font-bold text-[var(--ink)] transition hover:bg-[var(--line-soft)]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="rounded-[8px] border border-[var(--accent)] bg-[var(--accent)] px-5 py-[10px] text-[12px] font-bold text-white transition hover:border-[var(--accent-hover)] hover:bg-[var(--accent-hover)] disabled:opacity-50"
              >
                {submitting ? 'Adding property...' : 'Add property'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

function SectionTitle({ title, className = '' }) {
  return (
    <div className={`mb-[14px] flex items-center gap-3 ${className}`}>
      <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--accent-ink)]">
        {title}
      </div>
      <div className="h-px flex-1 bg-[var(--line)]" />
    </div>
  );
}

export default AddPropertyModal;
