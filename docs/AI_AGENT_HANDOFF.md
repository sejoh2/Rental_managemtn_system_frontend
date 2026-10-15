# Kodi AI agent: handoff

Written 2026-10-15 at the end of a long session, so the next chat can start the AI agent without the earlier conversation. Read this file first, then `docs/INTEGRATION_HANDOFF.md` (sections 3 and 4 for how the user works, and the Kodi system itself).

## 1. What the user asked for

In the user's words (2026-10-15): "build an AI agent around this. The Agent to do everything concerning customers, like booking meetings, calling customers, creating content for the app for marketing and all that. Then when some things need my attention the AI calls me and tells me what is wrong, what needs attention, how to handle that. Serious things require my approval or involvement, then every morning the agent can call me to brief me on what has happened, how much we have made and all that."

## 2. Decisions already made (2026-10-15)

| Question | User's answer |
|---|---|
| Who are the customers? | **Landlords buying Kodi.** Tenants stay with their landlord; the agent does not talk to tenants. |
| "How much we have made" in the brief | **The user's own income from Kodi.** Kodi has no billing yet (no plans, subscriptions or invoices), so this has to be built. |
| Channels | **WhatsApp and SMS first; phone calls later.** |
| Where the agent lives | **A new service in its own repository**, separate from the Kodi backend, talking to Kodi through a limited API. A fault in the agent must not affect rent collection. |
| Repository name and folder (2026-10-15, new chat) | **`Rental_management_system_agent`**, folder `C:\Users\Other\Documents\My_Apps\Rental_management_system_agent`. The user creates it on GitHub. |
| Does billing (M8) move earlier? (2026-10-15) | **Yes, before the brief.** Order: M1 to M5, then M8, then M6, M7, M9, M10. The brief launches with real income. |
| Calendar (2026-10-15) | **Google Calendar.** The agent reads free/busy and creates events; reminders go by WhatsApp and SMS. |

Not decided yet: the product name (Kodi is a placeholder; the user will choose), the voice provider, Kodi's prices and plans.

## 3. Plan proposed to the user (agreed in outline, not started)

Three levels of autonomy, as the user asked:

1. **Does it alone (logged):** answers questions, qualifies leads, books meetings in the user's free slots, reminders, writes drafts.
2. **Asks first (approvals list):** publishing content, messages to many people, prices or discounts, anything with money, promises or contracts. The user approves in an admin page or by WhatsApp with a PIN, **not by voice alone** (a call can be faked or misheard; the call informs, a tap plus PIN approves).
3. **Calls the user now:** angry or threatening customer, legal or data-protection question, security problem, payments failing, system down.

Building order, one step at a time (the user's way of working):

1. **Customer list and agent core:** new repo; leads, conversations, approvals list, audit log; Claude with tool use; a chat box on the Kodi home page.
2. **WhatsApp and SMS, and booking meetings.**
3. **Alerts to the user and the morning brief:** WhatsApp message first, then a phone call.
4. **Voice:** incoming calls first, then calling leads who asked to be called.
5. **Marketing drafts**, approved by the user, then published.
6. **Kodi billing** (plans, subscriptions, invoices, M-Pesa), so the brief can report the user's income. Billing touches money: ask the user every money rule.

Since money is the user's chosen brief figure, ask whether billing (step 6) should move earlier.

## 4. Technical direction (suggested, confirm with the user)

- **Brain:** the Claude API with tool use. Default to the latest models: `claude-opus-5-5` for decisions and drafting, `claude-haiku-5-5` or `claude-sonnet-5-5` for cheap routine replies. Keys only in the server's environment, never in a frontend or chat.
- **Stack:** match Kodi's backend so one person can maintain both: Node, Express 5, CommonJS, Postgres, zod validation, services that write an audit row for every change. Host on Render next to Kodi (Frankfurt), its own Postgres database.
- **Talking to Kodi:** the agent never touches Kodi's database. Kodi gets a small, separate API for the agent (service token, read-mostly, figures and sign-ups only, no tenant personal data), audited like everything else.
- **Channels:** WhatsApp Business Cloud API (needs a Meta business account, a verified number and approved message templates for messages outside 24 hours); SMS via Africa's Talking, already used by Kodi (`src/utils/sms_provider.js` in the backend calls it with `fetch`).
- **Meetings:** Google Calendar or Cal.com, only the user's free slots.
- **Voice (later):** Africa's Talking Voice for a Kenyan number plus a real-time voice AI (Vapi, Retell or ElevenLabs). Rough cost KES 10 to 30 a minute all in.
- **Prompt injection:** customer messages are untrusted. The agent's tools enforce the approval levels in code, not in the prompt; a message cannot raise its own permissions.

## 5. Gaps and risks already told to the user

- Kodi has no billing, so "how much we made" has nothing to read yet.
- Kenya Data Protection Act 2019: consent for marketing contact, the agent says it is an AI, call recording needs consent, no cold-calling of bought or scraped numbers. The user should check with someone qualified.
- Cost of voice; start with text.
- WhatsApp template approval takes time; start the Meta business verification early.

## 3a. Milestones (agreed layout, 2026-10-15)

Each milestone is one or more branches from `test`, ending with test steps for the user. A milestone is done only when the user has tested it.

| # | Milestone | What it does | Done when |
|---|---|---|---|
| M1 | Foundation | New repo and Render service; its database (leads, conversations, approvals, alerts, audit); sign-in for the user only; an admin page listing leads, conversations and approvals; Claude with tool use and the three autonomy levels enforced in code; the agent's knowledge of Kodi | The user can chat with the agent in the admin page, it answers about Kodi correctly, creates a lead, and anything level 2 lands in Approvals instead of happening |
| M2 | Website chat | Chat box on Kodi's public home page; collects name, phone and consent; hands over to the user when asked for a human | A visitor's chat creates a lead with consent recorded, and the user sees the whole conversation |
| M3 | WhatsApp and SMS | Receives and answers WhatsApp messages (webhook), SMS through Africa's Talking, follow-ups with approved templates, opt-out ("STOP") honoured | A WhatsApp message to the business number gets a correct answer, is stored, and STOP stops all messages to that number |
| M4 | Meetings | Offers the user's free slots, books demos in Google Calendar or Cal.com, sends reminders, reschedules and cancels | A lead books a demo by WhatsApp; it appears in the user's calendar and both get reminders |
| M5 | Alerts and approvals for the user | Level 3 events send the user a WhatsApp alert at once, with what is wrong and suggested handling; approvals by tap plus PIN; Kodi's limited API for health and figures | A simulated angry customer and a simulated Kodi error each reach the user within a minute; an approval needs the PIN |
| M6 | Morning brief (WhatsApp) | Daily at the user's chosen time: new leads, meetings today, conversations needing them, approvals waiting, Kodi activity, and income once M8 exists | The brief arrives every morning for a week with correct figures |
| M7 | Marketing content | Drafts posts, home-page text and campaign messages from the user's direction; nothing published or sent without approval; a content calendar | The user approves a draft and it is published or sent; a rejected draft never goes out |
| M8 | Kodi billing | Plans, trials, subscriptions, invoices, M-Pesa payments for owners in the Kodi backend; income figures for the brief. Every money rule asked of the user | An owner pays a subscription by M-Pesa, it is recorded and audited, and the brief shows the income |
| M9 | Voice: the user | The morning brief and urgent alerts as phone calls; the user can ask follow-up questions; approvals still by tap plus PIN | The brief call works for a week; an urgent alert rings the user |
| M10 | Voice: customers | Answers incoming calls; calls leads who asked to be called; says it is an AI; asks consent before recording; hands over to the user | A test lead's call is answered, logged, and a requested callback happens |

Building order decided 2026-10-15: M1, M2, M3, M4, M5, **M8**, M6, M7, M9, M10.

## 5a. What it needs: accounts, effort, data, money (given to the user 2026-10-15)

All amounts are estimates from Claude's training data, not quotes; the user was told to check each price when signing up. Recheck before relying on them.

### What the user must set up or provide

| Item | When | Notes |
|---|---|---|
| Anthropic Console account, billing, API key | Step 1 | Key goes only in Render's environment |
| New GitHub repository (user creates it) and a Render web service and Postgres for it | Step 1 | Same region as Kodi (Frankfurt) |
| Facts for the agent: what Kodi does, prices, common questions, how a demo goes, what the agent may and may not promise | Step 1 | The agent's knowledge; Claude drafts, the user corrects |
| The list of what counts as "serious", the approval PIN, the brief's time | Steps 1 and 3 | |
| Meta Business account, verified, and a phone number used only for WhatsApp Business API (not on the WhatsApp app) | Step 2; start early | Verification needs business documents and can take days to weeks |
| Business registration and KRA PIN | Before step 2 | Needed for Meta verification and for charging customers |
| Google account for the calendar (or Cal.com) | Step 2 | |
| Kodi's plans and prices, and an M-Pesa paybill or till for subscriptions | Step 6 | Money rules: ask the user |
| Voice provider account and a Kenyan voice number | Step 4 | |
| ODPC registration (Data Protection Act) and consent wording | Before contacting customers | Check with someone qualified |

### Effort (working sessions like the ones so far, plus the user's testing)

| Step | Estimate |
|---|---|
| 1 Customer list and agent core, home-page chat | 3 to 4 sessions |
| 2 WhatsApp, SMS, meetings | 2 to 3 sessions, plus Meta verification waiting time |
| 3 Alerts and morning brief (WhatsApp) | 1 to 2 sessions |
| 4 Voice | 3 to 5 sessions |
| 5 Marketing drafts and publishing | 1 to 2 sessions |
| 6 Kodi billing | 3 to 5 sessions |

Roughly 4 to 8 weeks part-time for everything; text-only (steps 1 to 3) in about 2 to 3 weeks.

### Data the agent keeps (its own database)

- Leads and customers: name, phone, email, business name, number of properties and units, town, where they came from, consent (what, when, how), stage (new, talking, demo booked, trial, paying, lost).
- Conversations: every message in and out, channel, and whether the agent or the user sent it.
- Meetings, approvals (what, why, who decided, when), alerts, content drafts, the audit log of every action.
- From Kodi, through the limited API: totals only (sign-ups, active owners, units, payment health, errors) and, after step 6, invoices and subscription payments. **No tenant personal data.**
- To decide with the user: how long to keep leads who never sign up (suggested 12 months), and the right to be forgotten (a delete that the agent cannot undo).

### Money (estimates)

| Item | Cost |
|---|---|
| Render: agent web service and its Postgres | About USD 15 to 25 a month (both always on) |
| Claude API | Cents per conversation; about USD 10 to 50 a month at small scale; more with heavy content writing or voice. Check anthropic.com pricing for the chosen models |
| WhatsApp Cloud API | Replies within 24 hours of a customer's message free; messages the business starts are charged per template (roughly KES 0.5 to 6 each depending on type) |
| SMS (Africa's Talking) | About KES 0.80 a message |
| Google Calendar or Cal.com free plan | Free |
| Voice (step 4) | About KES 10 to 30 a minute all in, plus a monthly number fee; a 3-minute daily brief is about KES 900 to 2,700 a month |
| One-off: business name registration, ODPC registration (small business band), domain | Roughly KES 5,000 to 10,000 together; a lawyer's review is extra |

Text-only months (steps 1 to 3): about KES 4,000 to 10,000. With daily brief calls and some customer calls: add KES 3,000 to 15,000 depending on minutes.

## 6. How the user works (still in force)

- Step by step. Before each step, list the gaps and questions; after each step, say what changed, give click-by-click test steps and the git commands.
- **Never commit or push.** Give the commands; the user runs them. Nothing on GitHub that would add Claude as a contributor (read-only `gh` only, no Co-Authored-By lines).
- The user runs installs themselves for the mobile app; for Node repos check with them first.
- Never change the user's real data in tests; use rolled-back transactions.
- Ask the user about every rule involving money.
- Security in mind; secrets never in a frontend `.env` or in chat.
- New branches start from `test`; pull requests go into `test`, then `test` into `main`. Render deploys `main`. The user publishes branches.
- Keep this file and `docs/INTEGRATION_HANDOFF.md` updated.

## 7. Where the rest stands (2026-10-15)

- **Web app:** everything asked for is built. Last change: one property choice in the top bar that every page follows (branch `feature/global-property`, committed by the user, not yet tested in a browser or merged). One uncommitted handoff edit on that branch.
- **Caretaker mobile app** (`Rental_management_system_mobile`, branch `feature/app-foundation`): all five steps built, analyze clean, 23 tests pass; the user has just added `url_launcher` and is running it on their phone (Samsung SM A165F) against the Render backend. Not tested on a device by Claude.
- **Go-live list** is in memory (`kodi-go-live-reminders`): new JWT secrets, the ID change (A or B), paid Render plans, production settings, PWA install test, data protection, the rename.

## 8. First thing to do in the new chat

1. Read this file and `docs/INTEGRATION_HANDOFF.md`.
2. ~~Confirm with the user: the new repository's name and folder, whether billing moves earlier, Google Calendar or Cal.com.~~ Answered 2026-10-15, see section 2.
3. List the gaps for M1 (Foundation, section 3a), then build it once the user agrees. The steps in section 3 are the short version; the milestones in section 3a replace them.
