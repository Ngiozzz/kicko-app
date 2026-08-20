# Kicko — progress / handoff notes

Written 2026-08-19 so a fresh chat can pick this up without re-deriving
context. This is a working-notes doc, not permanent documentation — safe
to delete or rewrite once it's stale. Read `README.md` first for repo
layout, then this for "where things actually stand."

## What exists and works today

Full booking platform, verified live in-browser this session:

- **Auth & roles**: player / owner / manager / admin, Supabase Auth +
  `public.users`. Managers log in by phone (no real email) via a
  synthetic-email trick (`${digits}@manager.kicko.internal`) — both
  `backend/src/controllers/managers.controller.ts` and
  `frontend/web/app/sign-in.tsx` compute this identically; keep them in
  sync if either changes.
- **Session inactivity timeout**: 30 min, `frontend/web/src/lib/sessionActivity.ts`
  + `useRoleGate.ts`.
- **Venues**: CRUD, photo uploads, admin verify/suspend moderation,
  payout details (phone/paybill/till) on the venue form.
- **Bookings + payments**: individual + split-with-friends match
  sessions, tiered service fee / refund pricing
  (`backend/src/services/pricing.service.ts`). Payment collection is a
  **stub** (`stk.service.ts`) — the UI has a "Simulate M-Pesa
  confirmation" button standing in for Safaricom's real callback.
- **Payouts**: `backend/src/jobs/resolvePayouts.ts`, runs every 60s,
  pays out owners once a booking's `end_at` has passed. Also a
  **stub** (`b2c.service.ts`) — always "succeeds" instantly.
- **Reviews**, **admin log viewer** (`/admin-dashboard/settings/logs`),
  **platform settings** admin panel, **in-app notifications** (bell icon,
  all four shells) — real triggers, not fake data. See
  `backend/src/services/notifications.service.ts` and its callers.
- **Transactional email** (Resend) and **SMS** (Africa's Talking) —
  built this session, `backend/src/services/email.service.ts` /
  `sms.service.ts`. Both fall back to `console.log` when their API key
  env var is unset, so local dev never needs real credentials. Wired
  into: booking confirmed (player email+SMS, owner/manager email),
  booking cancelled (player email), payout paid/failed (owner
  email+SMS), venue verified/suspended (owner email), new review (owner
  email).

Test accounts (all real, in the live Supabase project):
- `admin@kicko.test` / `admin123`
- `owner@kicko.test` / `owner123` — owns "manager Demo test" venue,
  manager "Mark Mwangi" (credentials unknown, user created this one
  directly, not me)
- `player@kicko.test` / `player123`
- Separately: `kicko.testowner@example.com` owns "Test Turf" — a
  pre-existing real account, not one I created, password unknown.

## What's stubbed / fake on purpose (not bugs)

- `stk.service.ts` (STK push / collections) and `b2c.service.ts`
  (payouts) — both permanent stubs until Safaricom credentials exist.
  Every caller only depends on the function shape, so swapping the stub
  body for a real Daraja call is the only change needed later.
- Everything else in the app was audited this session to remove
  fabricated stats — dashboards show real computed numbers only
  (`git log` has a "go fix the fake stats" commit's worth of changes if
  you want the diff).

## Blocked on external paperwork (not code)

**M-Pesa / Daraja** — two sequential steps, user is on **step 1** as of
2026-08-19:
1. eCitizen — register the actual business. In progress, not done.
2. Then: KRA PIN → Safaricom paybill/till → Daraja C2B access → separate
   Daraja B2C approval + G2 Portal InitiatorName/SecurityCredential setup.

Full checklist: `docs/daraja-b2c-setup.md`. Nothing to build here until
credentials exist — this is 100% external waiting, not a task queue.

## Go-live plan (domain + email + SMS), independent of the above

User wants to go live on a real domain soon. Decided stack:
- Domain: **kicko.co.ke** — picked, **not yet purchased**.
- DNS + inbox forwarding: Cloudflare (Email Routing for `hello@`).
- Transactional email: **Resend** (code done, needs `RESEND_API_KEY` +
  domain verification).
- SMS: **Africa's Talking**, not Twilio (deliberate — better Kenya
  deliverability/cost). Code done, needs a **live** AT account.
- Backend host: **Render**. Frontend host: **Vercel**.
- All the deploy config is already written: `backend/render.yaml`,
  `frontend/web/vercel.json`, build script added to
  `frontend/web/package.json` (`npm run build` → `expo export -p web`,
  tested locally, works, output is a plain SPA bundle — no static
  per-route rendering, hence the full-catchall rewrite in vercel.json).
- CORS is now a configurable allowlist (`ALLOWED_ORIGINS` env var in
  `backend/src/app.ts`), open by default for local dev.

Full step-by-step: **`docs/go-live-checklist.md`**. It also covers a
side-quest that becomes possible once the domain is real: fixing the
Google OAuth consent-screen branding (currently blocked because the app
only exists on `.vercel.app`, which Google won't let you brand/verify —
this was investigated and confirmed to be a Google Cloud Console fix,
not a Supabase setting, despite what it might look like at first).

## Africa's Talking — live credentials obtained, one thing still blocking real delivery

Done 2026-08-19: created a "Kicko" Team + live app (username `kicko`) in
the AT dashboard (their UI has changed — no KYC/ID-upload step exists
anymore, see updated `docs/africas-talking-live-setup.md`), generated a
live API key, confirmed it authenticates (`sendSms` gets a real API
response, not a 401) and put both in `backend/.env`:
```
AFRICASTALKING_USERNAME=kicko
AFRICASTALKING_API_KEY=atsk_...
```
Not yet in Render's env — only local `.env` so far.

**Blocked on**: a real test send to the user's own Safaricom number
(0703333636) came back `UserInBlacklist` (406) — not a credentials
problem, it's Safaricom's DND opt-out against promotional SMS from
AT's shared/generic sender ID, which is what any brand-new AT app sends
under by default. User explicitly said **hold off** on registering a
custom sender ID (KES 8,700 one-off + a few days' approval — see
`docs/africas-talking-live-setup.md` section 6) for now, so real SMS
delivery to Safaricom numbers without existing promo opt-in is
unverified. Auth/plumbing is confirmed working; only the "does it
actually land on a phone" step is unresolved, and it's a Safaricom
network setting, not something to fix in code.

**Not yet built**: the actual OTP/phone-verification flow — this was
the real reason for getting live SMS working, not the SMS itself. Shape
is sketched in `docs/africas-talking-live-setup.md` § 7 — new table for
pending codes + expiry, new endpoints to send/verify, rate-limiting so
someone can't spam OTPs at a number they don't own. Needs deciding
whether it's just a signup verification gate, or a full replacement for
the manager synthetic-email login hack. Reasonable to build now (auth
works) even though the sender-ID/DND question is still open, since
booking/payout SMS notifications have the same DND exposure regardless
of whether OTP exists.

## Known accepted risk

`africastalking` npm SDK bundles a few vulnerable transitive deps (old
axios/joi/lodash — `npm audit` flags 4). The only fix is downgrading the
SDK to 0.7.4. Left as-is deliberately: it's server-only, only ever sends
fixed messages to trusted recipients, never passes attacker-controlled
data into axios config. Revisit if that usage pattern ever changes, or
if a maintained fix lands upstream.

## Environment / running locally

Dev servers are **not currently running** (both were stopped at the end
of the last session — not an error, just not restarted since). To bring
them up:
```
cd backend && npm run dev       # http://localhost:4001
cd frontend/web && npm run web  # http://localhost:8951 (or whatever port Expo picks)
```
`backend/.env` and `frontend/web/.env` already exist locally with real
Supabase credentials (gitignored, not in the repo) — `.env.example` in
each has the full list of vars including the new email/SMS ones, all
currently optional (fall back to console-log stubs).

## Git state

Everything as of this doc is committed and pushed to `origin/main`:
- `3cec374` — the full bookings/payments/sessions/reviews/managers/
  notifications/go-live-infra build.
- `88de4bb` — Africa's Talking live-setup guide + the sandbox correction.

Working tree is clean.
