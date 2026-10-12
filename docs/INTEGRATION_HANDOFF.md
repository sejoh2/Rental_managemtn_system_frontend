# Kodi: frontend–backend integration handoff

Read this before doing anything. It replaces the earlier conversation, which is too long to load.
Last updated 2026-10-12.

## 1. What this project is

Kodi is a rental management system for Kenyan property owners.

| | Path | Stack |
|---|---|---|
| Frontend | `C:\Users\Other\Documents\My_Apps\Rental_managemtn_system_frontend` | React 19, Vite, Tailwind 4, react-router-dom 7, lucide-react |
| Backend | `C:\Users\Other\Documents\My_Apps\Rental_management_system_backend` | Express 5, PostgreSQL (`pg`), zod, CommonJS |

- Backend runs on `http://localhost:8080` (`npm run dev`, nodemon, restarts on every file save). API docs at `/api-docs`, source in `docs/openapi.yaml`. Keep that file updated with every backend change.
- Frontend runs on `http://localhost:5173` (`npm run dev`). API base URL is `VITE_API_URL` in `.env`.
- The database is a real hosted PostgreSQL (Aiven) with the owner's test data. It allows 15 connections; the backend pool is capped at 8 (`DB_POOL_MAX`).
- Sign-in is by phone and OTP. In dev the code is printed in the backend terminal (`SMS_MODE=console`), so you cannot sign in yourself. Owner test account is user id 3 ("New User"); property id 1 "Test Appartment"; unit id 2 "A1"; tenant id 1 "John Otieno".
- Tables are created and upgraded at backend startup by the `*_tables.js` files. Upgrades must be idempotent (`ADD COLUMN IF NOT EXISTS`, drop and re-add constraints).

## 2. How the user wants to work

These were stated by the user and must be followed.

1. Work one step at a time, in the order of the step list in section 5. The user says which step is next.
2. Before building a step, list its gaps and mismatches and get answers. If the backend is missing something, say so and build the backend part first.
3. After every implementation, say what changed, and give numbered steps for where to test it in the browser.
4. Keep the existing visual design. Reuse the existing classes, CSS variables and components. No new styling language.
5. Navigation uses real routes and links, with state such as the selected property, month, tab and filters kept in the URL.
6. Two steps share one branch, named for the pair, for example `feature/water-expenses`, in both repos. The user commits and pushes manually: give the commands, never push. Tell the user when a pair is finished.
7. Every action that changes data must be written to the audit log, so the admin can see who did what in which owner account.
8. Exports are built by the backend, are audited, and neutralise spreadsheet formulas. See `src/utils/csv.js` in the backend.
9. Explain money rules with a concrete scenario and numbers. The user decides money rules; do not guess them.
10. No loading shimmers. Use the existing loading, error and empty states.

Practical rules learned the hard way:

- Do not change the user's real data. Test backend logic inside a transaction that is always rolled back. `scratchpad/test_billing.js` in the earlier session showed the pattern: swap `db.query` and `db.get_client` for a client wrapper that turns `BEGIN`/`COMMIT`/`ROLLBACK` into savepoints, run the services, then `ROLLBACK`.
- The backend dev server is usually running under nodemon, so every saved backend file restarts it and runs the table upgrades on the real database. To test first, copy `src`, `docs`, `app.js`, `server.js` and `.env` to a scratch folder with a junction to `node_modules`, apply the edits there with a patch script, run the rolled-back test there, then run the same patch script on the real backend. Delete the scratch copy afterwards because it holds `.env`.
- Bash heredocs containing apostrophes fail in this environment. Write multi-line edit scripts to a file with the Write tool, then run the file.
- Apply multi-file backend edits in one script that writes all files at the end, so nodemon never restarts on a half-applied change.
- PostgreSQL `DATE` columns come back as JS `Date` at local midnight. Never call `toISOString().slice(0, 10)` on them; use `TO_CHAR(col, 'YYYY-MM-DD')` in SQL. "Today" and month boundaries use `AT TIME ZONE 'Africa/Nairobi'`.
- Routers mounted on `/api` must attach their guard per route (`const guard = [authenticate, require_role(...)]`), never with `router.use`, or they block requests meant for other routers.
- The machine is low on memory; avoid running many Node processes at once.

## 3. Frontend structure

```
src/
  api/          client.js (request, refresh on 401, download) + one file per module
  hooks/        useApi.js  ->  { data, loading, error, reload } keyed by a string
  context/      Auth, Properties, PaymentStats (context file + provider file each)
  components/
    common/     DataState.jsx (Loading/Error/Empty/DataState/FormError),
                Modal.jsx (ModalShell, ModalBody, ModalFooter, Field, SelectField, class constants),
                StatusBadge.jsx
    dashboard/  sidebar, stat card, shared modals and form pieces
    auth/
  pages/
    auth/       SignInPage, NoAccessPage
    admin/      AdminPage, AdminUsersPage, AdminAuditLogPage
    dashboard/  one file per page, routed from DashboardPage.jsx
  utils/        format.js, labels.js, billing.js, payments.js, tenantStatus.js, propertyForm.js
  data/         mock data still used by unwired pages (see section 5)
```

Conventions:

- A page loads data with `useApi('key', loader)` and renders through `<DataState state={...}>`.
- A modal is a thin wrapper that returns `null` when closed and renders an inner form component, so hooks are never conditional and state resets on each open.
- Select options are `[value, label]` pairs in `utils/labels.js`.
- `npm run lint` and `npx vite build` must both pass with zero errors before handing work back.
- Role routing is in `App.jsx`: owner gets the dashboard, admin gets the admin area, anyone else gets `NoAccessPage`.

## 4. Backend rules already built

Billing (`src/billing/billing_service.js`):

- A job runs at startup and hourly. On the 1st (Nairobi time) it bills every active or notice-given tenant for the current month: rent, the unit's fixed electricity amount, and fixed water. It never back-bills earlier months. A tenant has one charge of each type per month, so it is safe to run twice.
- Per property: `rent_due_day` (integer 1–28), `move_in_billing` (`prorated` | `full_month` | `free_until_next_month`), `move_out_billing` (`prorated` | `full_month`).
- Pro-rated move-in: amount × (days in month − move-in day) ÷ days in month. Moving in on the 1st is a full month. Pro-rated move-out: amount × move-out day ÷ days in month. Deposits are never pro-rated.
- Move-out voids later charges, reduces the move-out month when pro-rated, and returns anything overpaid as tenant credit.
- Credits are applied automatically to new charges and after a reversal.
- Metered water is billed when a reading is submitted (units × unit rate). A reading lower than the previous one is flagged and unbilled until the owner corrects or rejects it.

Charges and payments:

- Charge types: `rent_deposit`, `water_deposit`, `electricity_deposit`, `rent`, `water`, `electricity`, `service`, `repair`.
- `tenant_charges` has `UNIQUE (tenant_id, charge_type, billing_period, source_id)`. Deposits and one-off charges use billing period `1970-01-01`.
- Payment accounts per property: rent is required; water and electricity are optional. Money paid into the water account settles water deposit and water bills only; electricity likewise. The rent account settles rent deposit then rent, and also water or electricity deposits and bills only when the property has no separate account for them (`get_payable_charge_types`).
- A reversed manual payment stays on record as `reversed`. A reversed M-Pesa payment returns to `unmatched`.
- Unit fields set by the owner: `water_deposit`, `electricity_monthly_charge`, `electricity_deposit` (all optional, zero or empty means not charged).

Other additions: property edit, change or remove a payment account, caretaker created at assignment even if they never signed in, agreement regenerate and unmark signed, all-tenants endpoint with balances, admin audit log endpoint with owner account on every entry, CSV exports for payments and expenses, income totals that exclude deposits.

## 5. Step status

| # | Step | Status |
|---|---|---|
| 0 | Foundation, routing | Done |
| 1 | Auth | Done |
| 2 | Properties | Done |
| 3 | Units / Houses | Done |
| 4 | Tenants | Done, except document uploads |
| 5 | Agreements | Done |
| 6 | Payments | Done |
| — | Admin area (users, audit log) | Done |
| 7 | Water billing | Done |
| 8 | Expenses | Done, but see section 6: tenant charges come next |
| 9 | Maintenance | Done as part of tenant charges (section 6, part C). No assigning to a caretaker from the screen yet |
| 10 | Caretakers | Built 2026-10-12, awaiting the user's test. See "Caretaker rules" below |
| 11 | SMS centre | Not started. Uses `src/data/smsCentreData.js` |
| 12 | Reports | Not started. Uses `src/data/reportsData.js`. Must add electricity to income |
| 13 | Dashboard home | Not started. Uses `src/data/dashboardData.js`. Top-bar property select and search are still static |
| 14 | Settings | Not started. Hard-coded data inside `SettingsPage.jsx`. Reuse `WaterRulesModal` |
| 15 | Cleanup | Delete `src/data/`, final lint and build |

Caretaker rules (decided by the user on 2026-10-12):

- One caretaker can look after several properties, with a permission level per property. Each property still has one caretaker; assigning replaces the current one.
- **Suspend** (`users.status = 'suspended'`) stops sign-in but keeps the properties; **Remove** takes the caretaker off one property, and off their last property makes the account `inactive`. `PATCH /api/caretakers/:id` edits name, phone and suspend/reactivate; changing the phone signs them out.
- **Level 1** may view the tenants of an assigned property; **Level 2** may also add and edit them. Move-out, payments and the all-tenants list stay owner-only.
- A caretaker manages maintenance in assigned properties exactly like the owner, including costs and "charge to tenant".
- Any assigned caretaker may enter electricity bills.
- The Caretakers page lists one row per caretaker (grouped in the frontend from `GET /api/caretakers`, which returns one row per assignment). The Maintenance update form can assign a request to the property's caretaker.
- Caretakers still have no screens of their own in this web app (`NoAccessPage`); these are backend permissions for the later caretaker app.

Branch state at handoff: both repos are on `feature/water-expenses`. The last commit covers water billing and expenses. Uncommitted on top of it: backend CSV exports, the expense category filter, the database pool cap, and this file. Maintenance and Caretakers are the next pair and should get a new branch.

## 6. Current task: tenant charges, service charges and deposit reconciliation

Decided by the user on 2026-10-12. Built in five parts; the status of each is in the table.

| Part | What | Status |
|---|---|---|
| A | Service charges per property, billed to tenants, with a choice of account | Built, awaiting the user's test |
| B | Electricity: fixed monthly amount, or an amount the owner types each month per unit | Built, awaiting the user's test |
| C | Repairs: "charge to tenant" tick on resolving a maintenance request, expense created, SMS to the tenant. The Maintenance page (step 9) was wired for this | Built, awaiting the user's test |
| D | Expenses reconciliation: spent against charged to tenants and paid, per category | Built, awaiting the user's test |
| E | Move-out reconciliation: each deposit covers its own bills, extra deductions, a Calculate button, refund or debt | Built, awaiting the user's test |

All five were tested on the backend inside a rolled-back transaction. None has been clicked through in a browser by the assistant, because sign-in needs the OTP.

Rules decided:

- **Service charge added mid-month:** tenants already living there are billed for the rest of that month under the property's `move_in_billing` rule, then in full on the 1st. Move-out follows `move_out_billing`. Example: KES 300 added on the 12th of a 31-day month bills 300 × (31 − 12) ÷ 31 = KES 184.
- **One-off service charge:** billed once, in full, to every tenant living there when it is added, and to each new tenant when they move in.
- **Amounts** are per unit: the charge has one amount, and any unit can have its own. Zero means the unit is not charged.
- **Account:** per property, the owner chooses where service charges and repairs are paid: the rent, water or electricity account, or a separate "service" account (`properties.service_charge_account`). They are settled after that account's own charges.
- **Repairs:** the tenant sees the charge straight away and can pay it during the stay; an SMS tells them. Only what is unpaid is deducted at move-out.
- **Deposits at move-out:** each deposit covers its own kind of bill (the rent deposit also covers service charges, repairs and extra deductions). They are kept separate until the owner clicks Calculate in the move-out reconciliation, which merges them into one final figure: refund to the tenant, or amount the tenant owes. Extra deductions (for example repainting) are typed in by the owner there. A tenant who owes more than the deposits keeps the rest as a debt.
- **Electricity "amount entered":** the owner types the KES amount per unit each month; no meter readings.

How part A is built:

- Backend module `src/service_charges/` (tables `service_charges`, `service_charge_units`), routes `GET/POST /api/properties/:id/service-charges`, `PATCH/DELETE /api/service-charges/:id`.
- `tenant_charges` gained `description` and `source_id`; uniqueness is now `(tenant_id, charge_type, billing_period, source_id)`. Charge types `service` and `repair` exist. One-off charges use billing period `1970-01-01`, like deposits.
- `billing_service.js`: `bill_service_charges` (new charge or new tenant), a second insert in the monthly run, and service charges in `adjust_move_out_charges`.
- Frontend: `ServiceChargesSection` on the Properties page; the account choice in the Add and Edit property forms.
- A service charge already billed cannot be voided from the screen.

More rules decided on 2026-10-12 for parts B to E:

- **Deposits are always settled first** by any money that comes in (the existing payment order). If a deposit was still not fully paid at move-out, only the paid part counts as held and the unpaid part is cancelled.
- **Credit held** by the tenant is added to the final figure at Calculate.
- **The refund** is recorded once, in full.
- **Repair cost** is fixed once it is recorded as an expense; it cannot be edited from Maintenance afterwards.

How parts B to E are built:

- **B.** `units.electricity_billing_method` is `fixed_monthly` or `entered`. Module `src/electricity/`: `GET/PUT /api/properties/:id/electricity-bills` (period `YYYY-MM`). Entered bills are never pro-rated at move-out. Frontend: the unit form's "Electricity billing" choice and `ElectricityBillsModal`, opened from the Units page.
- **C.** `maintenance_requests` gained `charge_to_tenant`, `expense_id`, `tenant_charge_id`, `charged_tenant_id`. `record_repair_cost` in `maintenance_service.js` runs when a request is resolved with an actual cost: it always creates a `repairs_maintenance` expense, and with the tick a `repair` tenant charge (source id = request id) plus an SMS sent directly through `sms_provider` (it is not stored in `sms_messages`, which needs a broadcast). Frontend: `MaintenancePage.jsx` is wired (list, report, update); `src/data/maintenanceData.js` is deleted.
- **D.** `GET /api/expenses/reconciliation`, and the summary now includes `service_collected` and `repairs_collected` (repairs plus move-out deductions). Deposit money used at move-out counts as income on the confirmation day.
- **E.** Module `src/deposits/` (tables `deposit_settlements`, `deposit_applications`): `GET /api/tenants/:id/deposit-reconciliation`, `POST .../calculate`, `.../confirm`, `.../refund`. Deductions become `deduction` tenant charges. The move-out form no longer asks for a refund decision. A moved-out tenant can still record payments. Frontend: `DepositReconciliation` on the tenant profile.

Still open after these parts:

- `report_service.js` (Reports, step 12) does not yet count electricity, service charges, repairs or deposit money used at move-out as income. The tenant statement PDF does not show the deposit reconciliation.
- The caretaker app cannot enter electricity bills yet (owner only).
- A deposit reconciliation cannot be undone once confirmed.

Earlier context, kept for reference:

- **Repairs:** when a maintenance request on an occupied unit is resolved with a cost, the owner ticks "charge to tenant" each time. It is not automatic. If ticked, the cost is charged to that tenant. Either way the cost is an expense for the property. A repair outside a unit is a property expense only.
- **Service charges** (security, garbage, electricity and similar): whether tenants pay them depends on how each property is configured. Amounts are entered by the owner and can differ per unit. Some are billed every month; some are billed once.
- **Reconciliation in Expenses:** owners usually pay these costs first out of pocket, then recover them from that month's tenant income. Expenses should show what was spent against what tenants were charged and have paid for it.
- **Move-out:** tenant-chargeable repairs and any other unpaid amounts are deducted from the tenant's deposit at move-out. Today the move-out form only records "full, partial or no refund" as a note; nothing is calculated.

One question I asked that the user did not understand and wants a scenario for: "Should a new service charge apply to tenants already living there?" Scenario to give: the owner adds a KES 300 garbage fee to a property in mid-October. Three tenants already live there. Option 1: all three are billed KES 300 from 1 November onward. Option 2: only tenants who move in after the fee was added are billed, and the existing three never are. Ask which they want.

Technical notes for the build:

- The unique constraint `(tenant_id, charge_type, billing_period)` blocks two repair charges, or two different service charges, for one tenant in one month. Ad-hoc and service charges need a description and a source reference (maintenance request id or service charge id), and the uniqueness rule must be widened to include it.
- New charge types are needed, for example `service` and `repair`. Update the check constraint, `charge_priority_order_sql` and `get_payable_charge_types` in `billing_service.js`, `chargeLabel` in the frontend `utils/billing.js`, and the income totals in `expense_service.js` and `report_service.js`.
- Recurring service charges belong in the monthly billing job, following the property's move-in and move-out rules. One-off charges are billed once.
- Deposit reconciliation at move-out: deposits paid, less unpaid charges, less deductions, gives the refund due. Record the refund as money paid out and show it on the tenant statement.
- Present the full plan with a worked example and get the user's confirmation before writing money logic, as was done for monthly billing.

## 7. Open items

- **"If a reading is missed"** (carry forward, estimate, do not bill) is saved per property but nothing acts on it. The user has not decided whether to build the automatic behaviour.
- **Document uploads** (tenant documents, expense receipts, meter photos) will use Supabase, later.
- **Caretaker mobile app** comes later. The backend already lets a caretaker enter and view meter readings for an assigned property.
- **Expenses** have no Edit (void and re-add) and cannot be tied to a unit.
- **Units:** a house number cannot be reused after its unit is archived; there is no "Single room" type.
- **Assigning a payment** with "remember this number" and later unassigning it leaves the tenant with the new phone number.
- **SMS module** formats dates with `toISOString`, so due dates in messages can be one day early. Fix when wiring the SMS centre.
- **`OTP_EXPIRES_MINUTES`** is 120 in the backend `.env`; the user may have meant 5.
- **`PUBLIC_API_URL`** must be a live HTTPS address for Daraja callbacks; it was an ngrok URL.
