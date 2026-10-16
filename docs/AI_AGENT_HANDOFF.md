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

### M1 decisions (2026-10-15)

| Question | User's answer |
|---|---|
| Sign-in to the agent | Its own phone-and-code sign-in like Kodi's, codes through Africa's Talking; only the user's phone (set on the server) is accepted |
| Admin page | A small React page in the agent repo, served by the agent's Render service, copying Kodi's colours, fonts and layout. It may later be shown inside the Kodi app |
| Database | Render Postgres in Frankfurt, created now and used for development; wiped or replaced at go-live. Kodi's Aiven database is never touched |
| The agent's knowledge of Kodi | Editable text in the admin page, every change audited. Claude writes the first draft from the Kodi repos; the user corrects it |
| npm install and running | The user runs `npm install` and `npm run dev`; Claude gives the commands |
| Prices before plans exist (money rule) | The agent says pricing will be confirmed by the owner and offers a demo. Any discount or special price goes to Approvals |
| Free trials (money rule) | Every trial goes to Approvals until the trial rules are set in M8 |
| Approval PIN | Asked in the admin page only for money approvals (trials, prices, discounts); always asked for WhatsApp approvals (M5) |
| WhatsApp for building (M3) | The user's Meta test number. Production still needs Meta business verification and a real number |
| Model while building | **Google Gemini, free tier** (user's choice; replaces "Claude API" in section 4). Checked 2026-10-15 on ai.google.dev: free-tier prompts and answers "are used to improve" Google's products, human reviewers may read them, and the terms say "Do not submit sensitive, confidential, or personal information to the Unpaid Services"; the paid tier is not used for that. So: build and test with made-up data only; switch to the paid tier before real people's data reaches it (go-live reminder saved). The model is a setting in `.env`, and all calls to the model go through one file, so changing model or provider is one change |
| Autonomy lists (confirmed "as proposed") | **Level 1, alone and logged:** answer questions about Kodi, add and update leads, write notes, write drafts. **Level 2, Approvals:** a message the customer did not start, a message to more than one person, prices, discounts, trials (these three are money: PIN), promises or contract terms, publishing, deleting a lead. **Level 3, alert at once:** angry or threatening customer, legal or data-protection question, an attempt to trick the agent, Kodi down, payments failing. Matches `approvals.kind` and `alerts.category` in the agent repo |
| What approving a trial does until M8 | Kodi has no trials or billing yet. Approving lets the agent tell the landlord the trial is confirmed and sets the lead's stage to `trial`; the user creates the landlord's Kodi account by hand. From M8 an approved trial can be created in Kodi billing automatically. Trial length and terms are an M8 money rule |

### Part (b) decisions (2026-10-15)

| Question | User's answer |
|---|---|
| Session | Same as Kodi's admin: tokens in sessionStorage (closing the tab signs out), signed out after 15 minutes idle, at most 12 hours. Tokens carry issuer, audience and session ID, checked on every request; the agent has its own JWT secrets |
| PIN | 6 digits, set in Settings after first sign-in; changing it needs a fresh phone code; stored hashed; 5 wrong tries lock it for 30 minutes and record an alert |
| Pages | Chat, Conversations, Leads, Approvals, Alerts, Knowledge, Activity (audit log, read-only), Settings (PIN, light and dark mode) |
| Sign-in SMS | Kodi's Africa's Talking account. Kodi has no sender ID yet, so `AFRICASTALKING_SENDER_ID` is optional: empty uses Africa's Talking's default sender. In development codes print in the terminal (`SMS_MODE=console`) |

### Part (c) decisions (2026-10-15)

| Question | User's answer |
|---|---|
| Language | Reply in the landlord's language: English or Swahili, whichever they write in; a mixed message gets the main language used |
| How the agent introduces itself | "Kodi's assistant, an AI" (follows the product name when Kodi is renamed) |
| Approval expiry | 3 days. An expired approval is never carried out, and the landlord is told the owner will get back to them |
| Daily limit | 300 agent replies a day (setting in `.env`). At the limit the agent stops replying for the day and raises an alert |
| Approved actions in M1 | No channels exist yet (WhatsApp is M3), so an approved message appears in that conversation in the admin page; from M3 it is sent on the conversation's channel |

### Decisions after part (c) (2026-10-15)

| Question | User's answer |
|---|---|
| Finding leads on its own | The user expected this. Explained it was not in the agreed plan and the limits (Data Protection Act consent; WhatsApp bans messages to people who did not opt in). Proposed a "Finding leads" milestone: research businesses (property managers, landlord associations, agents) through public business contacts, draft first messages, every first contact through Approvals; and referral requests to paying landlords. **Agreed: added as M11, after WhatsApp.** |
| What to connect first | Finish M1 (part D, deploy to Render), then WhatsApp (M3) with the Meta test number, and the website chat (M2) |
| Voice | A spoken-message call first (Africa's Talking rings the user and reads an alert or a brief; Kenyan voice number about KES 5,000 setup + KES 2,000 a month + VAT, to confirm with them), a two-way voice AI later. Timing not fixed; proposed with the alerts (M5) |
| Gemini billing | Stay on the free tier for now (about 10 replies a day on 3.8 Flash, then 3.6 Flash at 5 requests a minute). Made-up data only; paid tier before real landlords |

### M3 WhatsApp: decisions and build (2026-10-15)

| Question | User's answer |
|---|---|
| SMS in M3 | WhatsApp now, two-way SMS later (needs an Africa's Talking number that can receive SMS) |
| Opt-out words | STOP, UNSUBSCRIBE, ACHA, SITISHA as the whole message, any capitals; both contact and marketing consent withdrawn; confirmation in their language; nothing more is sent until they write again |
| Voice notes, photos, files | Kept in the conversation as "[Voice note received]" and so on; the agent (if it is answering) replies in English and Swahili asking for text; Gemini is not called |
| Render plan | Stay free while building (slow first reply after a quiet spell, Meta may repeat a message, which is ignored); paid before real landlords |

- **Branch note:** PR #1 was merged straight into `main`, so `test` stayed at the first commit. `feature/m3-whatsapp` was made from `main`. The user must bring `test` up to `main` (a pull request from `main` into `test`) before the M3 pull request into `test`.
- Built on `feature/m3-whatsapp`, not committed: `src/whatsapp/whatsapp_client.js` (Graph API with fetch; `WHATSAPP_MODE` console or live; `send_text`, `mark_read`, `signature_is_valid` with the HMAC of the raw body, timing-safe), `whatsapp_service.js` (one conversation per number until closed; a new number becomes a lead at once with its verified phone and WhatsApp profile name, an existing lead with that phone is joined; done under an advisory lock per number; each message stored once by its WhatsApp ID; opt-out; media; receipts that never move a status backwards; messages to another phone number ID ignored), `whatsapp_routes.js` (`GET /api/whatsapp/webhook` verification, `POST` answered 200 at once then handled, `GET /status` for Settings), `src/channels/delivery.js` (every agent or owner message on a WhatsApp conversation is sent from `add_message`; refused when the landlord opted out and has not written since, or more than 24 hours after their last message, with a system note saying why; a send failure marks the message failed with WhatsApp's code). `app.js` keeps the raw body for the signature. The agent's instructions say it is on WhatsApp (plain text, do not ask for the number).
- **Reply flow changed for all channels:** `agent_service.reply_to_conversation` replaces the 409 "still answering": a message arriving while the agent answers is stored, and the agent answers again with it included (up to 3 rounds).
- Pages: delivery status under sent WhatsApp messages (Sending, Sent, Delivered, Read, Not sent); Settings, WhatsApp tab (live or printed, keys set, the webhook address, last received and sent).
- Tested by Claude with the test playing Meta (signed webhooks and the sending API): 38 checks, plus the 60 part (c) checks again, lint and build. Not yet tested against Meta itself.

### M4 Meetings: decisions (2026-10-16)

The user tested WhatsApp live: it worked; asked for a demo, the agent handed over (no calendar tool yet). The user asked for M4: book in the calendar, send the landlord the details, tell the user who, when and what they want.

| Question | User's answer |
|---|---|
| Booking hours | Mon to Fri, 9:00 to 17:00 Nairobi time, 30-minute demos, 15 minutes between meetings, at least 2 hours' notice, up to 14 days ahead |
| Format | Online, Google Meet link on every booking |
| Confirming with the landlord | **The agent proposes a time and books only after the landlord clearly agrees**; if not, it offers others (the user's words: "ask the client if the meeting which the agent chooses is okay") |
| Booking needs approval? | No: level 1 as in the plan (books in the user's free slots on its own); told the user, who did not object |
| Telling the user | The calendar event (details in its description) and an SMS to the user's phone (Africa's Talking, needs `SMS_MODE=live` on Render; until then it is printed in the logs) |
| Reminder to the landlord, 1 hour before | WhatsApp when inside the 24-hour window, otherwise SMS (only with contact consent) |
| Calendar connection | "Connect Google Calendar" in Settings (OAuth, the user's own Google account; refresh token kept encrypted). The user sets up a Google Cloud project and OAuth client; consent screen "In production" so the connection does not end every 7 days |

### M4 Meetings: build (2026-10-16, branch `feature/m4-meetings` from `test`, not committed)

- `src/google/google_client.js`: Google sign-in and Calendar with fetch. Scopes `openid email calendar.freebusy calendar.events.owned` (checked against Google's scope list). `start_connect` stores a one-time state (hash, 10 minutes, tied to the session) in `oauth_states`; `finish_connect` requires a refresh token and both calendar scopes, reads the email from the ID token, stores the refresh token sealed with AES-256-GCM (`src/utils/secret_box.js`, `GOOGLE_TOKEN_ENCRYPTION_KEY`, 64 hex). `invalid_grant` on refresh marks the connection broken (`broken_at`), raises one alert, and the agent hands demo requests over. `freeBusy` on `primary`, events created with a Meet link (`conferenceDataVersion=1`), invitation sent (`sendUpdates=all`) when the lead has an email.
- `src/meetings/availability.js`: the rules (Mon to Fri 9:00 to 17:00 Nairobi, 30 minutes, 15-minute gap, 2 hours' notice, 14 days, on the hour or half hour); Nairobi treated as fixed UTC+3; free slots spread two a day (morning, afternoon). `meeting_service.js`: find slots (calendar busy plus booked meetings), book (rules re-checked, one upcoming demo per lead, advisory lock so a slot is taken once, event with details and a link to the conversation, lead to `demo_booked`, confirmation to the landlord in English or Swahili with the Meet link, SMS to the owner), reschedule (its own old time is cut out of the busy periods), cancel (by the agent: owner gets an SMS; by the owner from Meetings: no SMS), reminders every 5 minutes for demos within the next hour (WhatsApp inside 24 hours, otherwise SMS with contact consent, otherwise a note). Tables `google_connection`, `oauth_states`, `meetings`.
- Agent tools `find_demo_slots`, `book_demo` (only after the landlord's clear yes, by instruction; the rules and calendar by code), `change_demo` (move or cancel). The instructions now carry the current Nairobi date and time and the lead's booked demo.
- Routes `/api/google/status|connect|callback|disconnect`, `/api/meetings` and `/api/meetings/:id/cancel`. Pages: Meetings (upcoming, past and cancelled, Meet link, reminder status, cancel), Settings Calendar tab.
- Because the PC and Render share one database, `GOOGLE_TOKEN_ENCRYPTION_KEY` must be the same in both, and the calendar is connected once (from the live site).
- Tested by Claude with the test playing Google and the model: 56 checks, plus the agent (60) and WhatsApp (38) checks again; lint and build clean. Test lesson: 16 October 2026 is a Friday. Older test scripts must create the meetings table, since every reply now looks up the lead's demo. Not yet tried against Google itself.
- M4 was committed by the user (`c844f60`) on `feature/m4-meetings`.

### "Why was I not told?" (2026-10-16)

The user asked where to ask the agent why it booked a meeting without telling them. Answer: nowhere yet; the Chat page is a test chat (the owner plays a landlord). Gap found: the SMS to the owner left no record (sent: nothing logged; failed: Render log only; no `OWNER_PHONE`: silent; `SMS_MODE=console`: printed and treated as sent). Agreed, in two parts. The user said not to worry about the Gemini free tier.

- **Part 1, built 2026-10-16 on `feature/m4-meetings`, not committed, not yet tested by the user.** `meetings` gets `owner_notice_kind` (booked, moved, cancelled), `owner_notice_result` (sent, printed, failed, no_phone, not_needed), `owner_notice_detail`, `owner_notice_at` (added with `ADD COLUMN IF NOT EXISTS`; older meetings stay blank). `tell_owner(meeting, kind, text)` in `meeting_service.js` records the result, writes `OWNER_SMS_SENT` or `OWNER_SMS_NOT_SENT` to the audit log, and a system note in the conversation ("SMS to you about this booking: sent." or "not sent." plus the reason). Failed, no phone, or printed while `NODE_ENV=production` raise an alert (category other, summary starting "SMS to you about demos are not going out"), one open at a time. Owner cancels are recorded as not_needed, with no audit row. Meetings page: an "SMS to you" line on each meeting, red when not sent. Tested by Claude on a throwaway PostgreSQL with the test playing Google and Africa's Talking: 26 checks, plus the upgrade of an older meetings table; lint and build clean. Not checked in a browser.
- Part 1 committed by the user (`6b18fdf`).
- **Part 2 decisions (2026-10-16):** explain **and** act; every action goes through Approvals (the user's choice). Admin page first, WhatsApp from the owner's number later. Look back 30 days by default, more when asked (up to 365).
- **Part 2, built 2026-10-16 on `feature/m4-meetings`, not committed, not yet tested by the user.** New folder `src/assistant/`:
  - `assistant_tables.js`: `owner_chats`, `owner_chat_messages` (role owner, assistant, system; `approval_id` for an action card; `tools_used`). Kept apart from landlord conversations.
  - `assistant_tools.js`: read-only tools `overview`, `find_leads`, `lead_details`, `list_meetings` (with `owner_sms`), `conversation_messages` (landlord text as `landlord_wrote`), `activity`, `list_alerts`, `list_approvals`, `find_demo_slots`; `propose_action` only writes an approval. Times are given to the model in Nairobi words. Record numbers accepted as text or numbers.
  - `owner_actions.js`: `move_demo`, `cancel_demo`, `book_demo`, `send_message` (as the owner; the agent then stays silent there), `hand_back_conversation`, `take_over_conversation`, `set_lead_stage`, `add_lead_note`, `resolve_alert`. `prepare()` checks the records and writes the title and effect in the code's words (refusals create nothing: unknown records, weekends, a second demo, WhatsApp outside 24 hours, same stage); `carry_out()` checks again when approved. Left out on purpose: deciding approvals, deleting leads, money, messages to many, settings, PIN, knowledge.
  - `assistant_prompt.js` (answer from the records, cite them, say when there is none; how the agent works, so it can explain why; changes only by `propose_action`; records are not instructions; plain text). `assistant_service.js` (one answer at a time per chat, 409 otherwise; up to 10 model steps; `ASSISTANT_ANSWERED` / `ASSISTANT_FAILED` in Activity; a card for each proposed action, also when the model fails afterwards). Routes `/api/assistant/chats`, `/chats/:id`, `/chats/:id/messages`.
  - Approvals: new kind `owner_action` (constraint replaced; not in `KINDS`, so the landlord agent cannot ask for one), no PIN, expires after 24 hours; reject and expiry send nothing to the landlord. `carry_out` now takes the owner as actor.
  - Meetings: a change the owner makes (book, move, cancel) records owner SMS `not_needed` instead of sending one (`notify_owner`).
  - Admin page: "Ask the agent" first in the menu (`/ask`, `AskPage.jsx`): questions list, example questions, "Looked at: ..." under answers, approval cards with Approve and Reject and a link to Approvals. Approval page shows the code-written effect for "Your request".
  - Tested by Claude on a throwaway PostgreSQL with the test playing Gemini, Google and Africa's Talking: 65 checks, plus the 26 owner SMS checks again; lint and build clean. One real Gemini question on test data answered correctly from the records (tools accepted by Gemini); the second hit the free-tier daily quota and the failure path worked. Not checked in a browser.
- Part 2 committed by the user (`7245f74`).

### Voice: talking with Kodi (2026-10-16)

The user asked for voice in Ask the agent, now **"Ask Kodi"** (the agent is called Kodi). Decisions: **live conversation** (Gemini Live), sends automatically, **English and Swahili**, answers spoken. Then: a wake phrase **"Kodi, wake up"** (the user's words), **offline wake-word detection on the computer**, stay signed in while listening up to the 12-hour session limit, ends on **10 seconds of silence or "thanks, Kodi"**. A **JARVIS-style full-screen display** ("look like hack things"). Later: recognise the user's own voice. Approvals stay a tap, never by voice.

- **Step 1, built 2026-10-16 on `feature/m4-meetings`, not committed, not yet tested by the user:** the live conversation, started with "Talk to Kodi".
  - Gemini Live facts checked against the live API on 2026-10-16: model `gemini-3.8-live` (`GEMINI_LIVE_MODEL`), voice `Kore` (`GEMINI_LIVE_VOICE`); short-lived token `POST v1beta/auth_tokens` with `bidiGenerateContentSetup` (not `liveConnectConstraints`, which the REST API refuses), token in `name`; WebSocket `...BidiGenerateContentConstrained?access_token=`; the locked setup wins over what the browser sends (tested); `behavior: "BLOCKING"` makes Kodi wait for tool results; audio in PCM 16 kHz, out PCM 24 kHz; `voiceActivity` events; transcripts in `serverContent.inputTranscription/outputTranscription`; the name is often heard as "Cody".
  - `src/assistant/voice_service.js`: `start_session` (new or existing chat; setup = the typed instructions + voice rules + the chat's last 12 lines; all tools BLOCKING plus `end_conversation`; token for one conversation, start within 60 s, 30 min), `run_tool` (the page passes Kodi's tool calls; same tools as typed; approval cards added at once), `save_message` (via `voice`), `end_session`. Activity: `VOICE_SESSION_STARTED`, `VOICE_SESSION_ENDED` (seconds, reason). Routes `/api/assistant/voice/session|tool|messages|end`. `owner_chat_messages.via` (typed or voice). helmet allows `connect-src wss://generativelanguage.googleapis.com` only.
  - `find_leads` now matches each word separately, best first, with "matched N of M words" and a note when nothing matches every word (misheard names); the voice rules tell Kodi to use a single clear match and say its name, since the card shows exactly which landlord.
  - Page: `web/public/kodi-mic-worklet.js` (mic to 16 kHz PCM, 40 ms pieces, level); `web/src/voice/kodiVoice.js` (connects, streams, keeps up to 4 s of speech from before the link is ready, plays Kodi's audio, stops it when interrupted, saves turns in order, 10 s silence, goodbye via `end_conversation`, Gemini's 15-minute limit, a `kodi-voice-activity` event every 30 s keeps the 15-minute sign-out from firing); `web/src/components/agent/KodiHud.jsx` (full-screen dark display: rings and core following the voice, waveform, system log of lookups, actions to tap, transcript, Nairobi clock, timer, Esc or END); Ask page renamed "Ask Kodi", spoken lines marked "spoken".
  - Tested by Claude: voice backend on a throwaway PostgreSQL, 22 checks including a real Gemini Live conversation using the agent's own token and setup; the real page in headless Edge with a fake microphone playing recorded questions (answers spoken and saved; a misheard name still found Peter Otieno; card approved from the display and the note added); typed (65) and SMS (26) checks again; lint and build clean. Not tested: Swahili speech, a real microphone and speakers (echo), phone width of the display. For the browser test the page was built with `VITE_API_URL` pointing at the test server, then rebuilt normally.
- Step 1 committed by the user (`6a5af7d`) and tested by the user: working.
- **Changes 2026-10-16 (not committed):** no introductions with the owner (typed and voice instructions: never say who it is or that it is an AI; a greeting gets "I'm here."); the landlord-facing agent still says it is an AI. Voice changed to **Charon** (male; `GEMINI_LIVE_VOICE` overrides). Checked live: "Hello Kodi" -> "I'm here."; a Swahili question answered in Swahili; 22 voice checks pass.
- **Step 2, later:** the offline wake phrase "Kodi, wake up".

### Kodi data, morning brief, insights, social media (asked 2026-10-16)

The user asked: reports and analytics from the Kodi system (sign-ins, users...), a morning brief at 8:00 (a phone call later; in the system for now) with suggested actions for earnings and customer satisfaction, growth insights (features to add or promote), and social media (create content, post, read and reply to comments, comment leads logged with a notification). Also: no explanations of what Kodi is (the owner knows); answers lead with the answer.

| Question | User's answer |
|---|---|
| What the agent may read from Kodi | **Totals plus landlord accounts** (name, contact, size, sign-ins, features used); never tenants' personal data |
| Brief | **Every day at 8:00** Nairobi, including weekends; in the system first, a call later |
| Platforms | **Facebook + Instagram, TikTok, X** (developer accounts: Meta and TikTok free, review or audit wait; X pay-per-use since 6 Feb 2026, roughly USD 0.015 a post, 0.20 with a link, 0.005 per post read; check docs.x.com) |
| Comments | **Simple replies alone (logged), everything else to approvals**; someone wanting Kodi becomes a lead with an alert |

Order agreed: 1 Kodi data link, 2 morning brief in the system, 3 social media. The user stressed security (breaches).

- **Step 1, built 2026-10-16, not committed, not yet tested by the user.**
  - Rental backend, new branch **`feature/agent-data-api`** from `origin/test` (the user publishes it): `src/agent_data/` — `agent_data_auth.js` (Bearer `AGENT_API_TOKEN`, at least 32 characters, compared as SHA-256 with timingSafeEqual; switched off when unset), `agent_data_service.js` (read-only SQL: `summary` totals, features by landlord count, sign-ins and sign-ups per Nairobi day; `landlords` per account, sorts quiet, active, largest, newest; tenants as counts only; payments are landlords' collections, not Kodi income), `agent_data_routes.js` (`/api/agent-data/summary|landlords|landlords/:id`, zod strict, 60 a minute, every read audited `AGENT_DATA_READ`). Mounted in `app.js` before the `/api` routers. `.env.example`: `AGENT_API_TOKEN`. OpenAPI not updated.
  - Agent: `src/kodi/kodi_client.js` (`KODI_API_URL`, `KODI_API_TOKEN`; **refuses real Kodi data unless `GEMINI_PAID_TIER=true`**, only a localhost test server allowed, because on Gemini's free tier Google may use what is sent); tools `kodi_summary`, `kodi_landlords`, `kodi_landlord` in Ask Kodi (typed and voice); instructions on leads vs Kodi landlords, collections not income, insights as suggestions with figures; "Lead with the answer, no preamble"; Ask Kodi page description removed.
  - Tested by Claude: 30 checks on throwaway databases with made-up data (tokens, switched off, strict input, figures, quiet landlord first, caretaker sign-ins count, no tenant name or phone in any answer, audit, agent tools, Kodi down); the safeguard; one real Gemini question answered from the test Kodi with figures and suggestions.
  - To switch on: the same random token as `AGENT_API_TOKEN` on the Kodi backend (Render) and `KODI_API_TOKEN` on the agent, `KODI_API_URL` the Kodi backend address, and Gemini billing on plus `GEMINI_PAID_TIER=true`.
- Step 1 committed by the user.
- **Step 2 decisions (2026-10-16):** reports on request ("generate a report" and it sends the file) built together with the morning brief. **PDF**; delivered **in Ask Kodi and to the owner's WhatsApp**; contents Kodi figures, landlords, the agent's work, insights and actions; **kept 30 days**. The owner's own number (OWNER_PHONE) writing to the business number is **treated as the owner** (no lead, no landlord reply; opens the 24 hours). Spoken briefs are a conversation: the owner can cut in, Kodi answers and carries on. The user allowed installing `pdfkit` (0.20.2, MIT; production audit clean; the 3 high findings are `braces` under nodemon, development only).
- **Step 2, built 2026-10-16 on `feature/m4-meetings`, not committed, not yet tested by the user.**
  - `src/reports/`: `report_tables.js` (`reports` with figures, sections and the PDF as BYTEA, one brief a day by `brief_date`, `expires_at` 30 days, WhatsApp status; `brief_settings` one row, 08:00, on, WhatsApp on; `owner_whatsapp` one row, last time the owner's number wrote; `owner_chat_messages.report_id`), `report_data.js` (figures by code: Kodi totals, landlords gone quiet 7 days, most active; agent counts, demos today, conversations needing the owner, approvals, alerts, lead notes; no tenant details), `report_writer.js` (Gemini JSON sections: headline, needs_you, kodi_summary, agent_summary, landlords_at_risk, growth, satisfaction, features, focus_answer; figures only when the model is unavailable), `report_pdf.js` (pdfkit, Helvetica, tiles, sign-ins chart, confidential footer), `report_service.js` (generate, send_to_whatsapp inside 24 hours only, list, download audited, settings, `tick` every minute: brief at its time or as soon as awake that day, under an advisory lock; deletes after 30 days), `report_routes.js` (`/api/reports`, `/:id`, `/:id/pdf` attachment no-store, `/:id/whatsapp`, `/settings`).
  - WhatsApp: `send_document` (upload to `/media`, then a document message); the owner's number handled in `whatsapp_service.handle_owner_message` (words not kept, `OWNER_WHATSAPP_RECEIVED`, one reply when the window opens).
  - Ask Kodi: tools `generate_report`, `get_brief` (typed and voice); report cards in chats; voice reads a brief part by part (8 parts, in order); after an interruption Kodi answers, says "Back to the brief" and carries on. Gemini Live ends its turn after each part, so the page sends "(continue the brief)" after a part Kodi finished (not after a cut-off turn, only once the audio has played, 1.2 s without the owner speaking, at most 20); `brief_done` ends that. The page leaves "checking" after 8 s without a reply after a tool. Reports page (menu under Agent): new report (period, focus), brief settings, list with download, Send to WhatsApp, read in place. CORS exposes Content-Disposition.
  - Tested by Claude: 44 report checks on throwaway databases with the test Kodi backend (figures, PDF, Gemini busy, owner number, WhatsApp console, live upload and send, Meta refusal, switched off, the 08:00 job once a day and catch-up, routes and sign-in, 30-day deletion), plus voice 22, Kodi data 30, typed 65, SMS 26 again; the PDF viewed; a real Gemini brief written; a real spoken brief with an interruption and the page's nudging (answered, carried on, `brief_done`); the Reports page in headless Edge at desktop and phone width. Seen: after an interruption Kodi may repeat the part it was on once.
  - Old test scripts must create the report tables now (add_message writes report_id).
- **Step 3, next:** social media. Picovoice Porcupine's free plan reportedly ended 30 June 2026 and `vosk-browser` is unmaintained (last release 2022, repository gone); the plan is a small speech model in the page with `@huggingface/transformers`, run only when someone is speaking, matching "Kodi/Cody, wake up". Needs a package the user installs; check the model and its size first.

### M1 progress

Repo `Rental_management_system_agent` exists with `main` and `test` (first commit: `.gitignore`, `README.md`). M1 is on branch `feature/m1-foundation`, in four parts:

- **(a) Skeleton, tables, audit: built 2026-10-15, not committed, not yet tested by the user.** Express 5 on port 8090 (Kodi uses 8080), `/health` checks the database (503 when it cannot reach it). Tables: `audit_logs` (actor_type owner/agent/customer/system; the database refuses update, delete and truncate), `leads` (unique phone when given), `lead_consents` (history with exact wording), `conversations`, `messages`, `approvals` (the request is frozen once made; only the decision changes; `is_money` marks PIN approvals), `alerts`, `knowledge_versions` (append-only; newest is in use). Deleting a lead removes its conversations, messages and consents, and keeps approvals and alerts unlinked. Tested by Claude on a throwaway local PostgreSQL 18 in the scratchpad (the user has PostgreSQL 18 installed): 18 checks passed, startup run twice, health with the database up and down.
- **(a) committed and pushed by the user** (`8cdf8d2`), tested by the user on the Render database.
- **(b) Sign-in, PIN and admin page shell: built 2026-10-15, not committed, not yet tested by the user.**
  - Backend: `owner_account` (one row, from `OWNER_PHONE`/`OWNER_NAME` in `.env`; changing the phone ends every session and clears the PIN, audited `OWNER_PHONE_CHANGED`), `otp_codes` (purposes `login` and `pin_change`), `sessions` (12 hours max, ended after 15 minutes without a request, revoked reason kept). Tokens: issuer `rental-agent`, audience `rental-agent-admin-<NODE_ENV>`, session ID checked on every request, refresh token single-use and never outliving the session. A phone other than the owner's gets the same answer and nothing is sent (`LOGIN_REFUSED_UNKNOWN_PHONE`). Rate limits per address per 15 minutes, sign-in and PIN counted separately (`CODE_REQUEST_LIMIT` 5, `CODE_TRY_LIMIT` 10). Errors the code meant are one `[REFUSED]` line in the terminal.
  - PIN (`src/settings/pin_service.js`): 6 digits, refuses repeated digits and straight runs, bcrypt hash, setting or changing needs a `pin_change` SMS code. `check_pin` (for part c): 5 wrong tries lock it 30 minutes and raise a `security` alert (new alert category, added with a replaceable constraint). Setting a new PIN unlocks it.
  - Routes: `/api/auth/request-code`, `verify-code`, `refresh-token`, `logout`, `me`, `still-here`; `/api/settings/pin` (GET, PUT) and `/pin/send-code`; `/api/activity` (read-only, filters who/action/dates in Nairobi days) and `/api/activity/actions`. When `web/dist` exists the agent serves the admin page itself (deployment); in development the page runs on Vite.
  - Admin page in `web/` (React, Vite on port 5174, Kodi's CSS, components and admin layout copied): sign-in (Kodi's code screen), side menu Chat, Conversations, Leads, Approvals, Alerts, Knowledge (placeholders saying when each arrives), Activity (real), Settings (PIN and Appearance). Tokens only in sessionStorage; signed out after 15 minutes without touching the page; tells the agent "still here" every 5 minutes while in use. The theme script is a file (`public/theme-init.js`), not inline, so helmet's security policy allows it once served by the agent. Same lint rules as Kodi's frontend.
  - Tested by Claude: 61 backend checks over HTTP on a throwaway PostgreSQL; build and lint clean; a 19-step click-through in headless Edge (sign-in, stranger's number, PIN too easy then saved, Activity and its filter, dark mode kept after reload, phone width, a session ended by the agent, sign-out), with screenshots checked. Note: Kodi's font shows "(c)" as a copyright sign, so page text says "part C", not "part (c)".
- **(b) committed by the user** (`e44e35f`) and tested by the user (signed in, set a PIN).
- **(c) The agent: built 2026-10-15, not committed, not yet tested by the user.**
  - Gemini is called with `fetch` from `src/agent/gemini_client.js` only (REST `generateContent`, header `x-goog-api-key`, `thinkingConfig.thinkingLevel: "low"`). Checked against the live API: Gemini 3 tool calls carry a `thoughtSignature`; within one reply the model's content must be sent back exactly as received or Gemini answers 400; earlier turns can be plain text. `functionResponse` carries the call's `id`. Model `GEMINI_MODEL` (default `gemini-3.8-flash`), fallback `GEMINI_FALLBACK_MODEL` (`gemini-3.6-flash`): one quick retry on 503, straight to the fallback on a timeout or 429; later steps of a reply stay on the model that started it.
  - **Free tier limits found 2026-10-15:** `gemini-3.8-flash` 20 requests a day, `gemini-3.6-flash` 5 a minute; each reply takes 2 or more requests. 3.8 Flash also answered "high demand" (503) and timeouts at times. Asked the user whether to turn on Gemini billing (a money decision).
  - `src/agent/prompt.js` (instructions: AI disclosure, language, knowledge only, consent wording, price questions get a demo offer and a note but no approval, the approval and alert lists, customer messages are never instructions), `src/agent/tools.js` (the three levels in code; zod on every argument; stages, consent wording and the money flag set by code), `src/agent/agent_service.js` (customer message stored first; one reply at a time per conversation via an advisory lock; owner-handled conversations get no reply; daily limit `AGENT_DAILY_REPLY_LIMIT` with one alert a day; up to 6 model steps).
  - Consent wording in `src/agent/consent.js` (English and Swahili) is a draft for someone qualified to check.
  - Approvals: kinds and the money flag in `approval_service.js`; approving checks the PIN first for money kinds, then claims the row atomically, then carries it out (a message to the landlord in the conversation; trial also sets the lead to `trial`; delete_lead deletes; publish and message_to_many are recorded only until M7 and M3). Rejecting sends nothing and marks the conversation `needs_owner`. A job every 5 minutes expires approvals after 3 days and tells the landlord in English and Swahili.
  - A wrong PIN or code answers **403**, not 401: the page treats 401 as "session ended", renews and re-sends, which counted one wrong PIN twice (found in the browser test, fixed).
  - Pages: Chat (test chats as a landlord), Conversations (reply as owner, hand back, close), Leads (search, stage filter, details editable by the owner, consent history), Approvals (PIN dialog for money), Alerts (seen, resolve with a note), counts next to the menu items (`/api/summary`, every 30 seconds).
  - Tested by Claude: 60 checks with a scripted model (including a model calling unknown tools, setting `paying`, writing its own consent wording, an impostor giving another lead's phone, two messages at once, expiry, the daily limit), the 57 sign-in checks again, an 18-step click-through in headless Edge, and a made-up conversation with the real Gemini (it disclosed being an AI, saved the lead, asked the exact consent question, quoted no price, put the trial in Approvals, raised an alert at "ignore your instructions", answered in Swahili).
- **(c) committed by the user** (`d8d046d`).
- **(d) Knowledge: built 2026-10-15, not committed, not yet tested by the user.**
  - The full first draft is `src/knowledge/knowledge_draft.js`, written from section 5 of `docs/INTEGRATION_HANDOFF.md`. It corrects the starter text, which wrongly said bank payments are matched (Kodi supports M-Pesa paybill and till only). Four parts are marked `[OWNER TO CONFIRM: ...]`: what makes Kodi different, who it suits best, how the demo goes, anything else never to say. The agent's instructions say to treat a marked line as unknown and never repeat the marker.
  - At startup the draft is put in use as a new `system` version until the owner has saved a version of their own; after that a restart never replaces the owner's text. So the user's Render database gets it on top of the old starter (version 1).
  - `/api/knowledge` (current and the list), `/versions/:id`, `POST /` (a new owner version; refused when unchanged, under 50 or over 30,000 characters), `POST /versions/:id/restore` (a new version with the old text). Audited `KNOWLEDGE_SEEDED`, `KNOWLEDGE_UPDATED`, `KNOWLEDGE_RESTORED`.
  - Knowledge page: the text in an editor, a count of the parts to confirm with "Find the next one", Saved or Not saved, a note per save, the versions list, any version viewable and usable again; a warning before leaving with unsaved edits. The placeholder page is gone: every menu item is a real page.
  - Tested by Claude: 26 checks (seeding over an existing starter, restarts, limits, the agent using a new version on its next reply, restore, the page in headless Edge) and the 60 part (c) checks again.
- **(d) committed by the user** (`a1cf6a5`).
- **Deploying M1 (2026-10-15), decided:** Render web service on the **free plan now, paid always-on before M3** (WhatsApp needs it awake); sign-in codes **in Render's logs** (`SMS_MODE=console`); **CI added now**. The deployed service shares the development database for now (as agreed for M1), with its own JWT secrets and `NODE_ENV=production` (so tokens from the PC are refused there).
  - `npm run build` (root `package.json`) installs and builds the admin page (`--include=dev`, since Render may leave development packages out); Render: build `npm ci && npm run build`, start `npm start`, health check `/health`, branch `main`, Auto-Deploy "After CI checks pass".
  - `.github/workflows/ci.yml` in the agent repo: code checks (node --check, app loads, admin page lint and build), npm audit (server and admin page, runtime only), start on an empty PostgreSQL 18 twice, a deploy rehearsal with production settings (Render's build and start, 401s, 404, the admin page served for any page address, security headers present), gitleaks. The repo is **private**: on a free GitHub account branch rules cannot be enforced and dependency review and CodeQL are not available, so the checks run and report but do not block a merge. Told the user; making it public would allow both (their choice).
  - Rehearsed by Claude on a clean copy of the committed code with Render's commands and production settings: built, started, every address answered as expected, the page loaded in headless Edge with nothing blocked by the security headers and Kodi's fonts loaded.
  - Build script and `ci.yml` committed; first CI run failed on two things fixed the same day: lint of `web/public/theme-init.js` (CI lints the whole `web` folder, Claude had only linted `web/src`), and gitleaks needing `pull-requests: read` on a pull request.
  - **Live 2026-10-15 at https://rental-management-system-agent.onrender.com** (free plan). The derived internal database address (`dpg-...-a`) did not resolve, so `DATABASE_URL` on Render is the **External** address with `DB_SSL=true`. The web service's region was not yet confirmed; if it is not Frankfurt, recreate it there before M3. The database's real name has a suffix (`rental_agent_xs35`). Still to add: `FRONTEND_URL`. M1 is done once the user has tested it live.

How Claude tests the agent without touching anything of the user's: `initdb` a throwaway database in the scratchpad on port 55432, copy the repo to a staging folder with a junction to the Kodi backend's `node_modules` (until the agent has its own), run the test, then remove the junction and delete everything.

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

- **Brain (changed 2026-10-15): Google Gemini with function calling**, free tier while building, paid tier before real data (see "M1 decisions"). The original suggestion was the Claude API with tool use: Default to the latest models: `claude-opus-5-5` for decisions and drafting, `claude-haiku-5-5` or `claude-sonnet-5-5` for cheap routine replies. Keys only in the server's environment, never in a frontend or chat.
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

| M11 | Finding leads (added 2026-10-15 at the user's request) | The agent researches businesses, not private people (property management firms, landlord associations, estate agents) through their public business contacts, builds a list with a reason for each, and drafts a first message; every first contact goes through Approvals. Paying landlords (from M8) get a referral request, with approval; someone referred is contacted only if they agree. Data protection and WhatsApp opt-in rules apply; check with someone qualified | The user approves a researched business and its first message, it is sent, and a reply lands in Conversations as a lead |

Building order decided 2026-10-15: M1, M2, M3, M4, M5, **M8**, M6, M7, M9, M10. **M11 (Finding leads) comes after WhatsApp (M3)**; its exact place is decided when M3 is done.

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
