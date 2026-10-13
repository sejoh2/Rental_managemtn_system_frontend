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
- The database is a real hosted PostgreSQL (Aiven) with the owner's test data. It allows 15 connections, 3 of them reserved, and the user keeps DBeaver open (4 more). The backend pool is capped at 5 (`DB_POOL_MAX`); at 8 the Payments page failed with "remaining connection slots are reserved" on 2026-10-13. Test scripts must set `DB_POOL_MAX=2` before loading `src/config/db`. A refused connection is answered with "The server is busy" (503), never the database's own text.
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
- Never run a whole `init_*_tables` for the `users` table (or any table the running server uses constantly) inside a long test transaction: its `ALTER TABLE` waits on the live server and the live server waits on the test, a deadlock. Run only the statement being tested.
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

### Automatic payment reminders (decided 2026-10-13)

- Off by default; switched on **per property** in Settings > Payment reminders (`src/reminders/`, `PUT /api/properties/:id/reminders`, columns on `properties`).
- The owner chooses the days before the rent due day (7, 5, 3, 2, 1 and/or on the day) and the hour (6 AM to 8 PM, Kenyan time). On each chosen day, from that hour, every active or notice-given tenant of the property who **owes anything** gets one SMS with **everything they owe** (all open and partial charges; a repair held for move-out is not counted) and the due date. A tenant who owes nothing gets none.
- A separate tick box adds one **late notice** a chosen number of days after the due day, to tenants who still have a bill past its due date.
- Each reminder is recorded in `sms_auto_reminders` (unique per tenant, kind, due date and day) so it is sent once; it goes through `send_single_sms`, so it is in the SMS centre, costs like any message, and uses the property's approved sender ID. The hourly job is `start_payment_reminder_scheduler`; each batch is audited (`AUTO_PAYMENT_REMINDERS_SENT`, `AUTO_LATE_NOTICES_SENT`).
- A reminder that falls before the 1st cannot include the new month's rent, which is billed on the 1st; the screen warns about it.

### Undoing money actions (decided 2026-10-13)

- **Remove a service charge and cancel its bills.** The remove dialog offers "Also cancel the bills already made for it". Each bill is voided and what a tenant had paid towards it returns to them as credit (`release_charge_payments`), which then settles their other bills. Bills already settled from a deposit at move-out are left alone. `DELETE /api/service-charges/:id?cancel_bills=true`, preview at `GET .../billed`.
- **Reopen a confirmed deposit reconciliation** (`POST /api/tenants/:id/deposit-reconciliation/reopen`, a reason is required, audited). The bills the deposits paid are unpaid again, the deductions are deleted, the credit is restored from a snapshot saved at confirmation, and the settlement is removed, so the owner can add the right deductions and confirm again. Refused once the refund is recorded as paid, or once the tenant has paid anything after the confirmation.
- **Unassigning an M-Pesa payment forgets a remembered number.** When "remember this number" replaced the tenant's payment number, the old one is kept on the payment (`remembered_previous_phone`) and put back when the payment is unassigned.
- **"If a reading is missed"** was removed from the screens on the user's instruction: nothing acted on it and it concerns money. The column and its stored value remain in the backend; do not show it again unless the behaviour is built.

### Water readings (changed 2026-10-13)

- Water is set **per unit**: its method (metered, fixed monthly, included in rent), its rate and its meter number. A metered bill is units used x the **unit's** rate. The property's water settings are only the defaults a new unit starts with (and can be pushed to occupied units from Water rules), plus the billing day and the days allowed for a reading.
- A reading can be recorded when the unit is per-unit metered, a tenant lives in it, and the month is not in the future.
- **Each tenant is read once a month** (it used to be once per unit). A unit that changed tenant during the month can be read again for the new tenant; the reading starts from the unit's latest reading, whoever lived there.
- **Final reading at move-out**: a tick box in Add reading (`final_reading: true`) records one extra reading for a tenant already read that month. It is billed as a separate water charge, "Water, final reading", for the units used since, and must be recorded before the tenant is moved out. One per tenant per month. The reading carries `is_final`.
- **The previous reading** is filled in from the unit's last recorded reading (`GET .../water-readings/previous`) and shown in the Add reading form. The owner may raise it, for water used while the unit stood empty, but never set it below the last recorded reading (refused with 422; the user's rule, 2026-10-13: "it can go beyond but not below"). When it is raised, the audit entry carries `previous_reading_raised_from`. A unit's first reading must have it typed.
- **Editing a reading** (`PATCH /api/water-readings/:id`, owner only, "Edit" on the row). Any submitted reading can be edited, from any month, paid or unpaid (the user, 2026-10-13: "we can have all of them editable"); `can_edit` is false only for one whose bill was settled from a deposit at move-out, where the reconciliation must be reopened first. To keep later bills right without changing them, the current reading cannot go above where the unit's next reading starts (422, "Edit that reading first"). The bill is recalculated at the rate it was billed at. What the tenant paid above the new bill returns to them as credit; a higher bill leaves the difference owed; zero units voids the bill. Audited with the figures before and after. A flagged reading still uses "Correct reading".
- The old unique rule on (unit, month) was dropped; the checks are in `submit_meter_reading`. "Missing reading" counts on the dashboard and reminders are still per unit, on purpose, so a tenant who moved in after the month's reading is not flagged as missing.

- **Cancelling a reading** (`POST /api/water-readings/:id/cancel`, owner only, a reason is required, "Cancel" on the row). The bill is voided, what the tenant paid towards it returns as credit, and the reading stays on the list as `rejected` with notes "Cancelled: reason" (shown as "Cancelled"). A new reading can then be recorded for the same tenant and month; the voided bill is opened again with the new amount (`create_water_charge` reopens a void, unpaid bill instead of refusing). Refused when the bill was settled from a deposit.

### Undoing a move-out (built 2026-10-13)

- `POST /api/tenants/:id/undo-move-out` (owner only, a reason is required, audited as `TENANT_MOVE_OUT_UNDONE`); "Undo move-out" on a moved-out tenant's page.
- At move-out the tenant's bills (id, amount, status) are saved in `tenants.move_out_snapshot` before anything is changed. Undo restores each bill from it: a reduced last month is charged in full again, voided later bills are open again, repairs waiting for move-out are `held` again, then credit is applied. The tenant is `active`, the unit `occupied`.
- Refused when the deposits are reconciled (reopen first), when the unit has another tenant or is "Not in use", and for a tenant moved out before snapshots existed whose move-out changed a bill.
- Months that passed while the tenant was moved out are not billed afterwards. Not decided by the user; raise it if it comes up.
- Tested only where the move-out changed a waiting repair; the property's rule did not reduce the last month in the test data.

### Units (changed 2026-10-13)

- **Unit type** is free text. The form lists the usual types, the types the owner has typed for that property's units, and "Add a new type...". The usual ones are stored by short name, a typed one as written (2 to 50 characters); show it with `unitTypeLabel`. The database rule `units_unit_type_check` is dropped at startup.
- **"Reserved" and "Under maintenance" are removed from the screens** on the user's instruction ("i think we don't need those"). A unit in use is Vacant or Occupied; the form no longer has a status choice. The backend still accepts the two values; a unit carrying one is shown and treated as vacant, and saving it makes it vacant.

### Caretakers

- One caretaker can look after several properties, with a level per property. Each property has one caretaker; assigning replaces the current one.
- **Suspend** stops sign-in but keeps their properties. **Remove** takes them off one property; off their last one makes the account inactive. Name and phone can be edited; changing the phone signs them out.
- Level 1 may view tenants of an assigned property; Level 2 may also add and edit them. A caretaker manages maintenance in assigned properties exactly like the owner, including costs and charging a tenant, and may enter electricity bills.
- **Caretaker app (decided 2026-10-13).** A separate Flutter app, Android first, created by the user in its own folder (do not create the project for them; give the commands). Caretakers never use the web app. It works without a connection too: what is entered is kept on the phone and sent later; something the server refuses stays listed as refused with the reason and never overwrites anything.
- **What a caretaker may do, backend built 2026-10-13:**
  - `GET /api/caretaker/properties`: the properties they look after, with `permission_level`, `can_manage_tenants` (level 2) and `can_record_payments`. The app starts here.
  - `GET /api/properties/:id/units`: the units, with current tenant and balance (the user: caretakers may see balances). Adding and changing units stays with the owner.
  - Files: list, upload and open for all three kinds; tenant documents need level 2; deleting stays with the owner. `uploaded_by` is the caretaker.
  - Readings: record, correct, cancel and resolve a flagged one, under the same rules as the owner (the user: "let them be able to edit or cancel").
  - Payments: `POST /api/tenants/:id/payments/manual` only when the owner has turned on `can_record_payments` for that property (`PUT /api/properties/:id/caretaker/payment-permission`, body `{ allowed }`, audited; the tick box is in Caretakers, Manage). It is off for every new assignment, also when a caretaker is put back on a property. `recorded_by` is the caretaker.
  - Already there: tenants (level 1 view, level 2 add and edit), expenses, repairs, electricity bills, tenant statement.
  - Still owner-only: move-out, deposits, units, properties and their settings, SMS, reports export, the full payments list, deleting files.
- **How an owner action is opened to a caretaker:** `as_owner({ property, level, permission })` in `src/caretakers/caretaker_acting.js`, placed after `require_role("owner", "caretaker")`. It checks the assignment for the record's property, then runs the request as the owner, so the owner's rules apply unchanged; the audit log records the caretaker with `by_caretaker: true` (`run_as_caretaker`). Use it for any further owner action given to caretakers; never loosen a service's owner check instead.
- **Bug fixed 2026-10-13:** the properties router (`/api/properties`) refused every caretaker, so the caretaker routes under `/api/properties/:id/...` (tenants, readings, expenses, repairs, electricity) never worked for a real caretaker. A caretaker is now passed on to the next router.
- **Sending twice does not save twice:** a request carrying `Idempotency-Key` (16 to 100 letters, digits, hyphens or underscores; the app makes one per saved item) is carried out once; a repeat with the same key gets the first answer back with the header `Idempotent-Replay: true`. Kept per signed-in user for 30 days (`idempotency_keys`, `src/middleware/idempotency.js`, run from `authenticate`). A refused request frees its key. The same key on a different address is refused with 422.
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

### Admin: access to everything

Decided by the user on 2026-10-13: "an admin should be able to access everything", including owners' money, and to act inside an owner's account.

- **Overview** (`/admin/overview`, the admin's home): platform totals and one row per owner account (properties, units, tenants, caretakers, collected this month, SMS this month, last sign-in), with a search box. `GET /api/admin/overview`.
- **Open account.** The admin clicks "Open account" on an owner and lands in that owner's dashboard with every owner screen and action. `POST /api/admin/owners/:id/open` records `ADMIN_OPENED_ACCOUNT`. From then on the frontend sends `X-Acting-Owner-Id` (`api/client.js`, kept in sessionStorage for that tab) and `authenticate` runs the request as that owner (`req.user` is the owner, `req.admin` the admin). The header is ignored on `/api/auth`, `/api/users` and `/api/admin`, and for anyone who is not an admin.
- **Audit.** `audit/acting_context.js` (AsyncLocalStorage) carries the admin through the request; `log_audit` then records the admin as the actor, the owner as the account, and `by_admin: true` in the metadata. No owner service was changed.
- In the app: `useAuth()` gives `actingOwner`, `openOwnerAccount`, `closeOwnerAccount`; `App.jsx` shows `DashboardPage` to an admin with an account open; the top strip shows whose account it is and an "Exit account" button.
- Leaving: the browser's back button to an `/admin` page closes the account (a `popstate` listener in `AuthProvider`), and `/admin` pages always show the admin area. Inside an account the greeting and the side menu show the owner's name ("Owner - opened by <admin>").
- **One administrator, set on the server** (the user's decision: "one for now, seeded on deployment, very secure"). It is the `ADMIN_PHONE` in the backend environment. No endpoint or screen can create an admin, `PATCH /api/users/:id` refuses to edit the admin, and at every startup any other account holding the admin role loses it and is signed out (`seed_admin_user`, audited as `ADMIN_ROLE_REMOVED`). Do not add a "make admin" action without asking.
- **The admin is signed out after 15 minutes without activity** (pointer, key, scroll or touch), checked in `AuthProvider`; the sign-in page then says why. Owners are not affected.
- **The admin has no lasting session** (the user's decision, 2026-10-13). The admin's tokens are kept in sessionStorage, so closing the tab or the browser signs them out and a new tab asks for sign-in again; everyone else stays in localStorage (`sessionStore` and `setTokens(..., { tabOnly })` in `api/client.js`). On the backend an admin's refresh token lasts 12 hours instead of 30 days (`ADMIN_REFRESH_TOKEN_EXPIRES_IN`, default `12h`), renewed while they are active.
- **Users page**: search by name, phone or role; "Add owner" (`POST /api/users`, name and phone, nothing is sent to the person); "Edit" name and phone (a new phone signs the person out); "Remove owner role" (`/demote-owner`, refused while the owner has properties: deactivate instead); "Open account" on owner rows. Names are saved as first and last word.
- **Owner page** (`/admin/owners/:id`, `GET /api/admin/owners/:id`): read-only totals including money collected this month and what tenants owe, properties, caretakers, recent activity.
- **Sender ID approval.** An owner's own sender ID is used only after the admin approves it on the admin SMS page; until then, and if rejected, that property's messages go from the default sender. One decision per owner and sender ID (`sms_sender_approvals`), mirrored on `properties.sms_sender_status`; every sending query uses `effective_sender_sql` from `sms/sender_approval_service.js`. The owner sees the status in Edit property and on the property details.
- **Admin SMS usage** counts only messages sent through the platform's sender (`sender_id IS NULL`), which the platform pays for. Messages sent with an owner's approved sender ID are deliberately left out.
- **Admin bell** (`GET /api/admin/notifications`): sender IDs waiting, people with no role, and security alarms from the last 24 hours of the audit log: 5+ wrong codes for one number, 8+ codes requested for one number, any wrong code for the admin's number. In-app only; nothing is sent by SMS.
- **System page** (`GET /api/admin/system`): SMS mode, whether the provider account is set, default sender, sign-in code rules, masked admin phone, the M-Pesa callback host and whether it is HTTPS, whether the API is limited to the web app's address. Never a key, secret, password or database address; keep it that way.
- **Audit log**: "Export CSV" (up to 5,000 rows with the current filters, itself audited as `AUDIT_LOG_EXPORTED`), and an "In owner's account" badge on entries the admin made inside an account. Each entry opens its own page (`/admin/audit-log/:id`, `GET /api/admin/audit-logs/:id`): who, when, account, record, IP, every recorded detail, and up to 30 other entries about the same record.

### File uploads (built 2026-10-13)

- Storage is Cloudflare R2, private, bucket named by `R2_BUCKET` (currently `rental-files`; keep the name neutral, the system will be renamed). Settings in the backend `.env` only: `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`. They must never be in the frontend `.env`, which is tracked by git.
- `src/utils/object_storage.js` signs the three requests itself (AWS Signature V4), so there is no AWS SDK dependency. `src/files/` holds the `files` table, service and routes.
- Three kinds, each attached to one record of the owner: `tenant_document` (tenant profile, "Documents" card), `expense_receipt` (Expenses, "Receipt" button on a row), `meter_photo` (Water billing, the camera on a reading). The shared screen piece is `components/common/Attachments.jsx`.
- Rules: JPG, PNG, WEBP or PDF, the first bytes must match the type, 5 MB at most, 20 files per record. The stored name is random; the original name is kept in the database. A file is opened through `GET /api/files/:id/link`, a link valid for 5 minutes. Uploading, opening and deleting are audited. Deleting removes the object from storage and marks the row deleted.
- Owner only for now (and the admin inside an owner's account). A caretaker app will need upload rights for meter photos and receipts; not added yet.
- Testing uploads: the database part can be rolled back but the bucket cannot, so a test must delete every object it creates (run the app in-process on a spare port with the database calls inside one transaction).
- The old `water_meter_readings.meter_photo_url` column is no longer shown.
- Fixed the same day: `water_notification_service.js` used `effective_sender_sql` without importing it, so the caretaker reading reminder failed at startup with "effective_sender_sql is not defined".

- **A receipt can be attached while adding an expense** (asked 2026-10-13): "Attach file" in the Add expense form, one or more files, checked for type and size before saving. The expense is saved first, then each file is uploaded to it with the existing `POST /api/files`; no backend change. If an upload fails the expense stays saved, the form says so and offers only Close, so it cannot be added twice. Editing an expense still uses the Receipt button on its row.

- **Files open under the row, not in a window** (asked 2026-10-13: "we don't have to open a new modal when uploading a file"). Receipt on an expense row and the camera on a reading row toggle `AttachmentsRow`, a panel under that row with the files (Open, Delete) and one "Attach file" button, no description box (`compact`). `AttachmentsModal` was removed. The tenant's Documents card is unchanged and keeps the description box.

- **Take photo** (asked 2026-10-13, for the web and the caretaker app): `components/common/TakePhoto.jsx`, beside every upload button (tenant documents, the receipt and meter-photo panels, the Add expense form). On a phone or tablet it opens the device's camera app (`capture="environment"`); on a computer it shows the webcam under the button with Capture. The picture is redrawn to at most 1600 px on its longest side as a JPG before upload, because phone photos often pass the 5 MB limit. A webcam needs HTTPS or localhost.

### Installable app, PWA (built 2026-10-13)

- Asked by the user for owner and admin, before the caretaker app. The caretaker app will be a separate Flutter app; caretakers do not use the web version.
- `public/manifest.webmanifest` (name, colours, icons), `public/sw.js` (service worker), icons `public/icon-192.png`, `icon-512.png`, `icon-maskable-512.png`, `apple-touch-icon.png`, and `public/favicon.svg`. The PNG icons are drawn by `scripts/make-icons.ps1 -Out public -Letter K`.
- **The service worker keeps only the app's own files** (the page, `/assets/*`, icons). It never keeps a server response: no tenant, payment or other record is stored on the device, and nothing works offline except opening the app's frame. Do not add caching of API responses without the user deciding it; it is a privacy and money-accuracy question. Requests to another origin and to `/api/` are not touched.
- It is registered only in the built app (`registerServiceWorker` in `src/utils/installApp.js`, `import.meta.env.PROD`), never under `npm run dev`. Test with `npx vite build` then `npx vite preview`. A new version is picked up on the next load (the page is fetched from the network first); raise `SHELL` in `sw.js` when its behaviour changes.
- "Install app" (`components/common/InstallApp.jsx`) is in Settings, Appearance for the owner and on the admin System page. It uses the browser's offer (Chrome, Edge); elsewhere it explains the browser menu.
- The admin session rules are unchanged in the installed app (tab-only session, 12 hours, 15 minutes idle).
- The host must serve `index.html` for unknown paths (already needed for the routes) and must not cache `/sw.js` for long.
- **On renaming the system**: also change the name in `manifest.webmanifest`, the `<title>` and `apple-mobile-web-app-title` in `index.html`, the letter in `favicon.svg`, and redraw the icons with the script.

### Notification sound

- Both bells (the owner's in the top bar, the admin's in the admin header) have a "Play a sound for new notifications" tick box at the bottom of their list. It is off by default and saved per device and per account (`kodi-sound-<role>-<id>` in localStorage).
- The owner and the admin hear different sounds (`utils/sound.js`, made with the Web Audio API, no sound file): two soft rising notes for the owner, three lower quick notes for the admin.
- `hooks/useNotificationSound.js` re-checks each bell every 60 seconds, also in a background tab, and plays the sound only when the count goes up, never on first load. Browsers allow sound only after the person has interacted with the page, and only while Kodi is open in a tab; there are no push notifications.

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
- **Automatic payment confirmations** are deliberately not built: the user said not to send them automatically (2026-10-13).
- Document uploads are built (section 5, "File uploads"). The production server on Render needs the same four `R2_` settings.
- **Manager and Accountant roles, invitations, bank payment accounts, email summaries** from the original design.
- **Checking an owner's own sender ID.** The user wants an entered sender ID confirmed with Africa's Talking before it is accepted, and postponed it on 2026-10-12. Africa's Talking has no lookup for this; the only check is to send a real SMS with that sender ID (about KES 0.80) and read the answer. The option offered was a test SMS to the owner's own phone on save. Ask again before building.
- **String IDs instead of numbers.** Raised by the user on 2026-10-13 and parked ("keep that in mind, we will come back to that"). The advice given: numeric IDs are not the security boundary, the owner check on every query is, and it is in place. Options offered: leave as is; add random public IDs only on records that appear in links (tenants, properties, payments, agreements); or convert every table, which touches nearly every file and is only sensible before real customer data exists. Do not start it without asking. **Update 2026-10-13:** the user asked for it, then moved it to just before going live. Still to choose: A, replace every ID, or B, keep the numeric keys and add a random public ID per record that the API uses (recommended: B). Take a database backup and get an explicit go-ahead first. The caretaker app must treat every ID as text so it is not affected.

Known gaps in what is built:

- Done 2026-10-13: an expense typed in by hand can be edited (`PATCH /api/expenses/:id`, owner only, audited) and is for one unit or the whole property (`unit_id`); an expense from a maintenance request stays fixed. A scheduled SMS broadcast can be edited until it is sent (`PATCH /api/sms/broadcasts/:id`). Each payment has its own page (`/payments/:id`), opened from the list and from the top-bar search.
- An archived unit ("Not in use" on the Units page, status `inactive`) is how the user marks a house that is not rented, such as the caretaker's. It stays listed on the Units page with a Restore button (`?include_archived=true`, `POST /api/units/:id/restore`), and is not counted or billed. Its house number still cannot be reused, which the user accepts.
- `OTP_EXPIRES_MINUTES` was 120 in the backend `.env`; changed to 5 on 2026-10-13 at the user's request. The `.env` is not in git, so a deployed server needs the same change.
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

**Admin tools** (as admin)
- Users: search; Add owner; Edit a name and phone; Remove owner role on an owner with and without properties; Open account from a row.
- Click an owner's name: the read-only owner page.
- As an owner, enter your own sender ID on a property: it shows "waiting for approval". As admin, the bell shows it; approve it on the SMS page; the owner then sees "approved".
- SMS page: usage through the platform's sender this month.
- System page: nothing secret is shown.
- Audit log: Export CSV, and the "In owner's account" badge.
- Inside an opened account, the greeting and side menu show the owner's name.

**Admin access** (as admin)
- Overview: the four cards and the owner accounts table; search by name or phone.
- Open account on an owner: the owner's dashboard opens with a strip saying whose account it is.
- Do something inside (for example add an expense), click Exit account, and check the audit log shows the admin as the person, in that owner's account.
- Refresh while inside an account: it stays open. Sign out and in again: it is closed.

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
