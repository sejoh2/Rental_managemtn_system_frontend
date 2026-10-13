# Kodi: frontend–backend integration handoff

Read this before doing anything. It replaces the earlier conversations, which are too long to load.
Last updated 2026-10-12, after the session that added light and dark mode and the reminder rule.

**First thing to do in a new chat.** The user asked for this explicitly: after reading this file, write one numbered list of everything that is pending, then go through it with the user one item at a time. Build the list from three places in this file: the checks the user still has to do (section 8), the tasks the user has asked for and that are not done (section 2, "Requested and not done"), and the open items (section 7). Ask the user which item to start with. Do not start building before that.

## 1. What this project is

Kodi is a rental management system for Kenyan property owners.

| | Path | Stack |
|---|---|---|
| Frontend | `C:\Users\Other\Documents\My_Apps\Rental_managemtn_system_frontend` | React 19, Vite, Tailwind 4, react-router-dom 7, lucide-react |
| Backend | `C:\Users\Other\Documents\My_Apps\Rental_management_system_backend` | Express 5, PostgreSQL (`pg`), zod, pdfkit, CommonJS |

- Backend runs on `http://localhost:8080` (`npm run dev`, nodemon, restarts on every file save). API docs at `/api-docs`, source in `docs/openapi.yaml`. Keep that file updated with every backend change; it is parsed at startup, so a YAML mistake (for example a duplicate key) stops the server.
- Frontend runs on `http://localhost:5173` (`npm run dev`). API base URL is `VITE_API_URL` in `.env`.
- The database is a real hosted PostgreSQL (Aiven) with the owner's test data. It allows 15 connections; the backend pool is capped at 8 (`DB_POOL_MAX`).
- Sign-in is by phone and OTP. `SMS_MODE=console` in the backend `.env`, so codes and every SMS are printed in the backend terminal and nothing reaches a phone. You cannot sign in yourself, so you cannot click through the screens.
- Test data: owner is user id 3 ("New User"); property id 1 "Test Appartment" (rent and water accounts, `move_in_billing` and `move_out_billing` both `prorated`, rent due day 5); unit id 2 "A1" (metered water); tenant id 1 "John Otieno", moved in 2026-10-04, rent KES 11,000, rent deposit 11,000, water deposit 2,000, all paid, and he holds some credit. There were no caretakers when last checked.
- Tables are created and upgraded at backend startup by the `*_tables.js` files. Upgrades must be idempotent (`ADD COLUMN IF NOT EXISTS`, drop and re-add constraints).

## 2. Where things stand

Every screen in the owner web app now uses the backend. All fifteen steps are built. `src/data/` (mock data) is deleted and no `window.alert` placeholders remain.

| # | Step | Status |
|---|---|---|
| 0–8 | Foundation, auth, properties, units, tenants, agreements, payments, admin area, water billing, expenses | Done and tested by the user in earlier sessions |
| — | Tenant charges: service charges, entered electricity, repair charges, expense reconciliation, deposit reconciliation | Built this session |
| 9 | Maintenance | Built this session |
| 10 | Caretakers | Built this session |
| 11 | SMS centre | Built this session |
| 12 | Reports | Built this session |
| 13 | Dashboard home (and the top bar: search, property filter, bell) | Built this session |
| 14 | Settings | Built this session |
| 15 | Cleanup | Done |

**What "built this session" means for testing.** Each piece was tested on the backend against the real database, inside a transaction that was rolled back (or read-only), and lint and the production build pass. None of it was clicked through in a browser by the assistant. The user was given click-by-click test steps for each piece and committed and pushed each one, but has not reported test results. Expect the next messages to be bug reports or change requests from that testing.

**Branches.** Both repos are on `feature/dashboard-settings`, pushed. Earlier work is on `feature/tenant-charges` and `feature/sms-reports`, also pushed. Uncommitted in the frontend at handoff: the removal of the page-name pill from the top strip, the sidebar unit count, and this file. The backend is clean. The user was given this to run in the frontend:

```
git add -A
git commit -m "Remove page-name pill, show unit count in sidebar, update integration handoff"
git push
```

**The step list is finished.** What is left is in section 7.

### What the user asked for this session, in order

So the new chat knows what was requested and how each request ended.

| # | The user asked | Outcome |
|---|---|---|
| 1 | Continue from the previous handoff; answered the open question on service charges: bill the remaining days, like a mid-month move-in | Service charges built with that rule |
| 2 | Repairs: tick "charge to tenant" each time; service charge amounts differ per unit; some monthly, some once; reconcile in Expenses; deduct at move-out | All built (section 5) |
| 3 | Let the owner choose the account service charges are paid into, or connect their own | Built: `service_charge_account` and an optional "service" payment account |
| 4 | At move-out each deposit covers its own bills; owner clicks Calculate for the final figure; owner enters extra deductions; a tenant who owes more keeps the debt | Built: deposit reconciliation |
| 5 | Electricity should have two options: fixed, or amount entered | Built |
| 6 | "Implement everything", then asked for a click-by-click explanation of what was added, where to test, what to expect | Done for every piece since; this is now a standing rule (section 3) |
| 7 | Caretakers; added mid-way: a caretaker should record and update maintenance like the owner, only for assigned properties | Built |
| 8 | SMS centre; create the branch locally and give the commands | Built; branches are created locally when both repos are clean |
| 9 | Confirmed the repair SMS should be sent manually, with a Send SMS action | Changed from automatic to a "Send SMS" button |
| 10 | "Send to" in the SMS centre should be a searchable dropdown where one person can be chosen | Built (`SearchableSelect`) |
| 11 | Reports | Built |
| 12 | Dashboard home and Settings together | Built |
| 13 | Asked how the invite works | Explained: there is no invite; a caretaker is added by phone and nothing is sent to them |
| 14 | Asked whether SMS centre messages go out when testing | Explained: no, `SMS_MODE=console`; told how to switch to live. Not changed |
| 15 | Remove the page-name pill at the right of the top strip | Done (owner dashboard and admin area) |
| 16 | Asked what "1 property · 1 account" in the sidebar means | Explained; "1 account" was fixed text. Replaced with the live unit count: "1 property · 1 unit" |
| 17 | Light mode and dark mode under Settings | Built in the next session (section 5, "Light and dark mode"); not yet checked by the user |
| 18 | A tenant who owes nothing should not get a due date reminder | Built in the next session (section 5, SMS); not yet checked by the user |
| 19 | Remove the waving-hand emoji from the dashboard greeting; no emoji anywhere | Done. Both repos were scanned and there is no other emoji. Do not add any |
| 20 | Ask for the person's name at sign-in instead of showing the backend default "New User" | Built (section 5, "Name at first sign-in"); not yet checked by the user |

### Requested and not done

Nothing. Both items from the previous handoff (light and dark mode, and the blank due date in reminders) were built on 2026-10-12 in the session after this file was first written. They are uncommitted in both repos until the user commits them, and the user has not tested them yet (section 8).

## 3. How the user wants to work

These were stated by the user and must be followed.

1. Work one step at a time. The user says which step is next.
2. Before building, list the gaps and mismatches between the design and the backend, and get answers. If the backend is missing something, say so and build the backend part first.
3. After every implementation, say what was added, where to test it, what to expect, and what each click or option means, as numbered steps for the browser.
4. Keep the existing visual design. Reuse the existing classes, CSS variables and components. No new styling language. (The IDE reports Tailwind "can be written as" suggestions on every edit; ignore them, the codebase uses the long form throughout.)
5. Navigation uses real routes and links, with state such as the selected property, month, tab and filters kept in the URL.
6. Two steps share one branch, named for the pair, in both repos. The user commits and pushes manually: give the commands, never commit or push. When asked, create the new branch locally in both repos (only when both are clean). Tell the user when a pair is finished.
7. Every action that changes data must be written to the audit log, so the admin can see who did what in which owner account.
8. Exports are built by the backend, are audited, and neutralise spreadsheet formulas (`src/utils/csv.js` in the backend).
9. The user decides money rules and behaviour choices. Do not guess them. Ask with a concrete scenario and numbers; the `AskUserQuestion` tool with a recommended option worked well and the user answers readily. A plain abstract question was not understood; a scenario was.
10. No loading shimmers. Use the existing loading, error and empty states.
11. SMS is manual. Nothing is sent to a tenant automatically. See section 5.

## 4. How to change the backend safely

The backend dev server is usually running under nodemon, so every saved backend file restarts it and runs the table upgrades on the real database. The method used all session:

1. Copy `src`, `docs`, `app.js`, `server.js`, `package.json` and `.env` to a `staging` folder in the scratchpad, with a directory junction to the backend's `node_modules` (`cmd /c mklink /J`).
2. Write the edits as a Node patch script: a `rep(file, from, to, count)` helper that throws unless the text matches exactly `count` times, a `replace_function(file, name, newText)` helper for whole top-level functions, and one loop at the end that writes every file. New files are written to a separate folder and copied in.
3. Run the patch on staging, run `node --check` on the changed files, load `app.js` (this parses `openapi.yaml`), then run a test script in staging.
4. Only then copy the new files and run the same patch on the real backend, wait about 15 seconds and check `http://localhost:8080/health`.
5. Remove the junction (`cmd /c rmdir`) and delete staging, because it holds `.env`.

The test script pattern: take one client from the pool, `BEGIN`, replace `db.query` and `db.get_client` with a wrapper that turns `BEGIN`/`COMMIT`/`ROLLBACK` into savepoints and makes `release` a no-op, call the `init_*_tables` functions and the services, print results, then `ROLLBACK` and check that nothing was kept. Set `process.env.SMS_MODE = "console"` in any test that can send SMS.

Things that bit during the session:

- Inside the test transaction `CURRENT_TIMESTAMP` is frozen at its start. Code that compares an app-side `new Date()` with it can behave differently from production.
- A parameter used twice with different inferred types fails ("inconsistent types deduced"); cast it, for example `$4::VARCHAR`.
- A parameter in a `SELECT` list of an `INSERT ... SELECT` needs a cast, for example `$1::BIGINT`.
- PostgreSQL `DATE` columns come back as JS `Date` at local midnight. Never call `toISOString().slice(0, 10)` on them; use `TO_CHAR(col, 'YYYY-MM-DD')` in SQL. "Today" and month boundaries use `AT TIME ZONE 'Africa/Nairobi'`.
- Routers mounted on `/api` must attach their guard per route (`const guard = [authenticate, require_role(...)]`), never with `router.use`.
- Bash heredocs containing apostrophes fail here. Write scripts to a file with the Write tool, then run the file. PowerShell is the primary shell.
- `git grep` returns exit code 1 when it finds nothing; that is not an error.
- The machine is low on memory; avoid running many Node processes at once.

## 5. Rules decided by the user

### Billing and charges

- A job runs at startup and hourly. On the 1st (Nairobi time) it bills every active or notice-given tenant for the month: rent, fixed electricity, fixed water and monthly service charges. It never back-bills.
- Per property: `rent_due_day` (1–28), `move_in_billing` (`prorated` | `full_month` | `free_until_next_month`), `move_out_billing` (`prorated` | `full_month`).
- Pro-rated move-in: amount × (days in month − move-in day) ÷ days in month; the 1st is a full month. Pro-rated move-out: amount × move-out day ÷ days in month. Deposits are never pro-rated.
- Charge types: `rent_deposit`, `water_deposit`, `electricity_deposit`, `rent`, `water`, `electricity`, `service`, `repair`, `deduction`. `tenant_charges` is unique on `(tenant_id, charge_type, billing_period, source_id)` and carries a `description`. Deposits and one-off charges use billing period `1970-01-01`.
- Payment accounts per property: rent is required; water, electricity and "service" are optional, M-Pesa paybill or till only. Money paid into an account settles that account's own charges first. The rent account also settles water or electricity when the property has no separate account for them. Deposits are always settled first.
- **Service charges** (`src/service_charges/`): per property, with one amount and optional per-unit amounts (zero means not charged). A monthly one added mid-month bills current tenants for the rest of the month under `move_in_billing` (KES 300 on the 12th of a 31-day month = 184), then in full on the 1st; move-out follows `move_out_billing`. A one-off one bills each current tenant once in full, and each new tenant at move-in. **Changed 2026-10-13:** a tenant who moves in part-way through a month is billed only the one-off charges on that day (they are in the Add tenant total); monthly service charges start with the next monthly billing run, due on the rent due day. Moving in on the 1st still bills the monthly ones. This is `at_move_in` in `bill_service_charges`; the Add tenant preview mirrors it in `moveInServiceCharges` (`utils/billing.js`). For tenants already living there when a monthly charge is added, the owner chooses in the form (`first_billing`, decided 2026-10-13): `now` bills them for the rest of this month under the mid-month rule, `next_billing` bills nobody until the next monthly run. It is not stored; a one-off charge is always billed now. The owner chooses which account they and repairs are paid into (`properties.service_charge_account`).
- **Electricity** per unit: not billed, fixed monthly, or `entered`, where the owner (or an assigned caretaker) types the amount per unit each month (`src/electricity/`). Entered bills are never pro-rated.
- **Repairs**: resolving a maintenance request with an actual cost always records a `repairs_maintenance` expense. Who pays is chosen when the issue is reported ("Who pays for this repair": owner or tenant) and can be changed until the cost is recorded; nothing is charged before then. If the tenant pays, a `repair` charge is created on the tenant living in the unit, and the owner also chooses how (decided 2026-10-13, `maintenance_requests.charge_timing`):
  - `now`: an ordinary open charge, paid from the tenant's credit or next payment; what is unpaid is deducted at move-out.
  - `move_out`: the charge is saved with status `held`. Every balance, arrears and payment query looks only at `open`/`partial`, so a held charge is not arrears and nothing pays it during the stay. `move_out_tenant` turns held charges into `open`, and the rent deposit covers them in the reconciliation.
  - The cost and both choices are fixed once the cost is recorded.
- **The reconciliation lists every repair.** Its groups only show unpaid bills, so a repair already paid from credit used to look as if it was missing (the user reported this on 2026-10-13; the figures were right). The response now carries `repairs`, shown as "Repairs charged during the stay", each marked paid during the stay, taken from the deposit, or unpaid.
- **Expenses show who covers each one.** `recovery` on every expense: `owner_cost`, `recovered`, `pending` or `at_move_out`, with the tenant and amounts. Only a repair from a maintenance request can be tied to one tenant; other categories are recovered through service charges and stay in the per-category table.
- **Move-out** no longer asks for a refund decision. Afterwards the tenant profile shows a deposit reconciliation (`src/deposits/`): each deposit covers its own kind of bill (the rent deposit also covers service charges, repairs and deductions); the owner adds deductions; **Calculate** merges the deposits and any credit into one figure; **Confirm** is final. The refund is recorded once, in full. A tenant who owes more keeps the rest as a debt and can still record payments. Only deposit money actually paid counts as held.
- **Income** is what payments settled against rent, water, electricity, service charges, repairs and deductions, plus deposit money used for bills at move-out, counted on that day. Deposits themselves are not income. Expenses, Reports and the Dashboard all use this definition and were checked to agree.

### Caretakers

- One caretaker can look after several properties, with a level per property. Each property has one caretaker; assigning replaces the current one.
- **Suspend** stops sign-in but keeps their properties. **Remove** takes them off one property; off their last one makes the account inactive. Name and phone can be edited; changing the phone signs them out.
- Level 1 may view tenants of an assigned property; Level 2 may also add and edit them. A caretaker manages maintenance in assigned properties exactly like the owner, including costs and charging a tenant, and may enter electricity bills.
- Caretakers have no screens in this web app (they see `NoAccessPage`). These are backend permissions for a later caretaker app. Nothing is sent to a caretaker when they are added; there are no invitations.

### SMS

- **Nothing is sent to a tenant automatically.** Broadcasts are started by the owner. The repair charge notice is sent with a "Send SMS" button on the charged maintenance request (`POST /api/maintenance/:id/charge-sms`), and can be sent again.
- A scheduled broadcast stores only its selection; recipients and balances are worked out when it is sent.
- Broadcasts go to tenants who are active or on notice. "Send to" is a searchable dropdown of groups, properties and single tenants.
- Each owner gets four starter templates the first time their templates are listed.
- **Payment reminders skip tenants who owe nothing.** A message that uses `{balance}`, `{amount}`, `{due_date}` or `{days_overdue}` is a payment reminder; any other message goes to everyone selected. The rule is `leave_out_settled` in `sms_service.js`, applied when a broadcast is sent now and again when a scheduled one goes out. Sent now to people who all owe nothing (including one tenant chosen by name) it is refused with 422. The New broadcast modal shows who is left out and disables Send.
- "Accepted" means the provider took the message; there are no delivery reports. Cost is estimated per 160/153-character part. `SMS_COST_PER_MESSAGE` is 0.80.
- Two owner notifications act when switched on in Settings: an SMS to the owner when a water reading is flagged (off by default), and one SMS per property per month to its caretaker on the water billing day, after 8 AM, if readings are missing (on by default). The other four switches are shown as "Not active yet". There is no email sending.
- **Sender per property.** Add property and Edit property have an "SMS sender" choice (`components/dashboard/SmsSenderField.jsx`): "Default (Africa's Talking)", saved as no sender ID so messages go from Africa's Talking's own number, or "My own sender ID" with a text box. There is no backend change; an empty `sms_sender_id` was already the default.
- **A refused message is Failed, not Accepted.** Africa's Talking answers OK even when it turns a message down, so `check_provider_response` in `utils/sms_provider.js` reads the answer and throws with the reason (unapproved sender ID, no airtime, blocked number). The SMS centre keeps refreshing every 3 seconds while a message is queued.
- The user switched to `SMS_MODE=live` on 2026-10-12. The first live message was refused because the sender ID "Kodi" on Test Appartment is not approved; message 13 still reads "Accepted" from before the fix.
- To send for real, set `SMS_MODE=live` and restart the backend. The user was told that sign-in codes then go by SMS, that the sender ID must be approved by Africa's Talking (`AFRICASTALKING_SENDER_ID` is empty; Test Appartment's is "Kodi"), and that messages cost money. Do not change it without being asked.

### Reports, Dashboard, Settings

- Reports: property and period filters in the URL; arrears show current tenants and former tenants separately; archived properties are left out; exports hold totals and a line per tenant, as PDF or CSV built from the same sections; periods are Kenyan time.
- The top-bar property dropdown filters the Dashboard only and is hidden elsewhere. The bell lists what needs attention. The search box finds tenants and payments.
- Settings > Users & roles lists the owner and caretakers only. There are no Manager or Accountant roles. Bank accounts are not supported. The owner's phone number cannot be changed.

### Name at first sign-in

- An account created by OTP is "New User" in the database (the column defaults). `public_user` now returns `needs_name: true` for such an account (`needs_name` in `security/token_service.js`); no rows or defaults were changed.
- While `needs_name` is true, `App.jsx` shows `pages/auth/NamePage.jsx` instead of the dashboard, admin area or no-access page: one required field, "Full names". It appears once, after the code, for any role.
- `PATCH /api/auth/me/name` `{ full_name }` saves it: the first word is the first name and the last word is the last name, so a middle name is dropped (the user's choice, 2026-10-13); one word leaves the last name empty. Letters, spaces, dots, hyphens and apostrophes only. Allowed only while `needs_name` is true (409 afterwards); an owner changes their name later in Settings > Account. Audited as `PROFILE_NAME_SET`.
- The test owner (user id 3) was still "New User" when this was built, so they are asked on the next page load.

### Light and dark mode

- Three choices: Light, Dark, Follow device (the default). Light is white including the side menu and top strip; dark is the earlier dark sidebar with dark pages.
- Saved per device, in the browser, one choice per account (`kodi-theme-<role>-<id>` in localStorage), so the owner and the admin each keep their own. No backend change and no audit entry. The sign-in page shows the choice last used on that device. A caretaker app would keep its own.
- The switch is in Settings > Appearance (`?tab=appearance`) and as a one-click button in the owner top bar and the admin header (`components/common/ThemeToggle.jsx`).
- How it works: `ThemeProvider` sets `data-theme` on `<html>`; `src/index.css` holds both sets of variables; a small script in `index.html` sets it before the first paint.
- Every colour in the `.jsx` files is now a variable. Do not add `bg-white` or hex colours: use `--surface`, `--success`, `--danger`, `--warning`, `--info` (each with a `-soft` background), `--danger-solid` for filled red buttons, and `--accent-ink` for orange text (`--accent` is for fills and borders and is the same orange in both modes). `text-white` is only for text on `--accent` or `--danger-solid`.
- The sign-in picture panel stays dark in both modes.
- No left accent lines on cards or panels: the orange bar on stat cards, the dark line on info panels and the red, amber and green lines on warning and delete panels were all removed at the user's request. Do not add them back.

## 6. Code map

Backend `src/`: one folder per module, each with `*_tables.js`, `*_validator.js`, `*_service.js`, `*_controller.js`, `*_routes.js` (the newer small modules put validation and handlers in the routes file). Added this session: `service_charges/`, `electricity/`, `deposits/`, `dashboard/`, `water/water_notification_service.js`, `reports/report_file_service.js` (rewritten). Key functions: `billing_service.js` (`bill_service_charges`, `run_monthly_billing`, `adjust_move_out_charges`, `get_payable_charge_types`, `apply_tenant_credits`), `maintenance_service.js` (`record_repair_cost`, `send_repair_charge_sms`), `sms_service.js` (`send_single_sms`, `create_messages`, `prepare_scheduled_messages`), `report_service.js` (`get_collection_summary`, `get_report_details`), `deposit_service.js` (`build_groups`, `confirm_reconciliation`).

Frontend `src/`:

```
api/          client.js (request, refresh on 401, download) + one file per module
hooks/        useApi.js  ->  { data, loading, error, reload } keyed by a string; pass null to skip
context/      Auth (has refreshUser), Properties, PaymentStats
components/
  common/     DataState.jsx (Loading/Error/Empty/DataState/FormError),
              Modal.jsx (ModalShell, ModalBody, ModalFooter, Field, SelectField, class constants),
              StatusBadge.jsx, SearchableSelect.jsx
  dashboard/  Topbar.jsx (search, property filter, bell), DashboardSidebar, StatCard,
              ExportReportModal, EditPropertyModal, AddPropertyModal, WaterRulesModal,
              ServiceChargesSection, ElectricityBillsModal, DepositReconciliation, ...
pages/
  auth/       SignInPage, NoAccessPage
  admin/      AdminPage, AdminUsersPage, AdminAuditLogPage
  dashboard/  DashboardPage.jsx (shell and routes), DashboardHomePage.jsx, one file per page
utils/        format.js, labels.js, billing.js, payments.js, tenantStatus.js, propertyForm.js
```

Conventions:

- A page loads data with `useApi('key', loader)` and renders through `<DataState state={...}>`.
- A modal is a thin wrapper that returns `null` when closed and renders an inner form component, so hooks are never conditional and state resets on each open.
- Select options are `[value, label]` pairs in `utils/labels.js`.
- `npm run lint` and `npx vite build` must both pass with zero errors before handing work back.
- Role routing is in `App.jsx`: owner gets the dashboard, admin gets the admin area, anyone else gets `NoAccessPage`.

## 7. What is left

Not built, by agreement or by postponement:

- **Caretaker app.** The backend permissions exist; there are no caretaker screens.
- **Document uploads** (tenant documents, expense receipts, meter photos), planned with Supabase.
- **Automatic tenant SMS** (payment confirmations, rent reminders). The user chose manual for now; the two matching Settings switches are inactive.
- **Manager and Accountant roles, invitations, bank payment accounts, email summaries** from the original design.
- **Checking an owner's own sender ID.** The user wants an entered sender ID confirmed with Africa's Talking before it is accepted, and postponed it on 2026-10-12. Africa's Talking has no lookup for this; the only check is to send a real SMS with that sender ID (about KES 0.80) and read the answer. The option offered was a test SMS to the owner's own phone on save. Ask again before building.
- **"If a reading is missed"** (carry forward, estimate, do not bill) is saved per property but nothing acts on it.

Known gaps in what is built:

- A service charge already billed, and a confirmed deposit reconciliation, cannot be undone from the screen.
- Expenses cannot be edited (void and re-add), and a hand-entered expense cannot be tied to a unit.
- A scheduled SMS broadcast cannot be edited (cancel and recreate).
- A search result for a payment opens the Payments page, not that payment.
- A house number cannot be reused after its unit is archived; there is no "Single room" unit type.
- Assigning a payment with "remember this number" and later unassigning it leaves the tenant with the new phone number.
- `OTP_EXPIRES_MINUTES` is 120 in the backend `.env`; the user may have meant 5.
- `PUBLIC_API_URL` must be a live HTTPS address for Daraja callbacks; it was an ngrok URL.

## 8. What the user still has to check in the browser

None of this was clicked through by the assistant. The user received detailed steps for each at the time; this is the short version to turn into a checklist. Testing changes the real test data, so two warnings apply: **move-out is permanent** (John is the only tenant, so add a second unit and tenant before testing move-out), and **John holds credit**, so new bills on him may show as paid at once.

**Service charges** (Properties page)
- The "service charges" section under a property: add a monthly charge and a one-off charge, see the amount billed now, edit a per-unit amount, remove one, and the duplicate-name refusal.
- "Service charges and repairs are paid into" in Edit property and Add property, and the optional service charges account.
- "Service charges" as an "Apply to" choice in Record manual payment.

**Electricity** (Units / Houses page)
- The "Electricity billing" choice on a unit: not billed, fixed, or amount entered.
- "Enter electricity bills": enter an amount, correct it, set it to 0, and check the tenant's charges.

**Maintenance and repairs** (Maintenance page)
- Report an issue (in a unit, and in a common area), the tabs and property filter in the address bar.
- Resolve with a cost, with and without "charge to tenant": the expense appears in Expenses, the charge on the tenant.
- The cost is locked afterwards.
- "Send SMS" on a charged repair, and "Send SMS again".
- "Assigned caretaker" on a request.

**Expenses** (Expenses page)
- The two new income lines and the net profit.
- The "Recovered from tenants" table: spent, charged, paid, still owed, own cost.

**Move-out and deposits** (tenant profile, on a second test tenant)
- The move-out form without the refund choice.
- The deposit reconciliation card: each deposit against its own bills, add a deduction, Calculate, Confirm.
- Record the refund, or record a payment from a former tenant who still owes.

**Caretakers** (Caretakers page)
- Add a caretaker; the replace warning.
- Manage: edit name and phone, suspend and reactivate, change a level, assign to another property, remove from a property.

**SMS centre**
- The four cards, the Test mode note, the starter templates.
- Create, edit and delete a template.
- Send a broadcast now; schedule one and cancel it.
- The searchable "Send to", including one tenant.
- The repair charge message appearing in Recent messages.

**Reports**
- The property and period filters and the five cards.
- Export report as PDF and as CSV, for each type; the top-bar Export button.
- The tenant statement PDF.

**Dashboard home and top bar**
- The eight cards, the chart, unmatched payments, recent activity.
- The property dropdown (Dashboard only), the search box, the bell.
- The sidebar line "1 property · 1 unit", and the top strip with no page-name pill.

**Settings**
- Account: save name, email and default rent due day; the audit log panel.
- Payment accounts and Water rules per property.
- Users & roles; Notifications (two working switches); Manage properties.
- The flagged-reading SMS, with its switch on.

**Light and dark mode**
- Settings > Appearance: Light, Dark, Follow device; the sun/moon button in the top bar.
- Every page and every modal in dark mode, looking for text that is hard to read or a panel that stayed white.
- Light mode: white side menu and top strip.
- As admin: the button in the admin header, and that it does not change the owner's choice.

**Name at first sign-in**
- Refresh the app as the owner still called "New User": the "What is your name?" screen appears instead of the dashboard.
- One name, two names, a name with a digit (refused), then Continue; the greeting has no emoji and uses the first name.
- Sign out and in again: the screen does not come back.

**Payment reminders**
- New broadcast with "Balance reminder" to John while he owes nothing: Send is disabled and the reason is shown.
- The same with "General notice": it can be sent.

**Admin** (as admin)
- The audit log shows the new actions under the owner's account: service charges, electricity bills, maintenance, expenses, repair charge and its SMS, deposit reconciled and refund paid, caretaker changes, SMS actions, report exported, statement downloaded, settings changes.

**Decisions the user may want to revisit while testing**
- A caretaker can charge a repair to a tenant (same rights as the owner on maintenance).
- The caretaker water-reading reminder is switched on by default.
- `SMS_COST_PER_MESSAGE` is 0.80, not the 1.50 shown in the original design.
