# Kicko — progress / handoff notes

Updated 2026-08-21 so a fresh chat can pick this up without re-deriving
context. This is a working-notes doc, not permanent documentation — safe
to delete or rewrite once it's stale. Read `README.md` first for repo
layout, then this for "where things actually stand."

## What exists and works today

Full booking platform, live in production as of this session:

- **Live URLs**: frontend `https://kicko-app.co.ke` (and
  `https://www.kicko-app.co.ke`), backend API
  `https://api.kicko-app.co.ke` (Render free tier — spins down after
  inactivity, first request after idle can take ~50s). Frontend on
  Vercel (project `kicko-app`), backend on Render (service
  `kicko-backend`). Custom domains wired through Cloudflare DNS.
- **Email**: `kicko-app.co.ke` has live mailboxes via **Zoho Mail**
  (free plan) — `ngiozzz@`, `info@`, `finance@`. MX/SPF/DKIM/DMARC all
  verified in Cloudflare DNS. Transactional email (Resend) is coded but
  **not yet wired up live** — `RESEND_API_KEY` isn't set anywhere yet,
  so booking/payout emails still fall back to console-log. See "Next
  steps" below — this needs Resend's SPF include merged into the
  existing Zoho SPF TXT record, not added as a second record.
- **Auth & roles**: player / owner / manager / admin, Supabase Auth +
  `public.users`. Managers log in by phone (no real email) via a
  synthetic-email trick (`${digits}@manager.kicko.internal`) — both
  `backend/src/controllers/managers.controller.ts` and
  `frontend/web/app/sign-in.tsx` compute this identically; keep them in
  sync if either changes.
- **Google sign-in** (this session): "Continue with Google" on sign-up
  and sign-in, for player + owner only (excluded from manager sign-in —
  managers never have a real Gmail). New Google signups get the role
  matching whichever tab they clicked from (player vs owner), via a
  sessionStorage intent (`frontend/web/src/lib/oauthIntent.ts`) plus a
  narrow, defensively-gated `POST /api/account/me/role` claim endpoint
  (`claimOwnerRole` in `backend/src/controllers/account.controller.ts`)
  — full flow: `GoogleSignInButton.tsx` → `app/auth/callback.tsx` →
  claim endpoint if needed → routed to the right dashboard. Verified
  live end-to-end (new player signup, new owner signup, existing-email
  auto-link). **Apple sign-in intentionally not started** — needs a
  paid $99/yr Apple Developer account, parked until asked for.
  Known cosmetic-only quirk: Google's account-chooser screen shows the
  Supabase project domain (`angyrszlptntfkqmcwwn.supabase.co`) instead
  of "Kicko" — this is Google's own anti-phishing display of the real
  OAuth redirect target and can't be changed by any Google Cloud
  Console or Supabase setting, since the redirect genuinely does hit
  Supabase before Kicko. Harmless, already explained to the user.
- **Profile pictures** (this session): Google accounts' avatar now
  flows through the whole stack — `avatar_url` column on `public.users`
  (migration `20260901000000_user_avatar_url.sql`, backfilled from
  Google's `picture`/`avatar_url` claim via the signup trigger), through
  `requireAuth`/`useRoleGate`, into a shared `<Avatar>` component
  (`frontend/web/src/components/Avatar.tsx`) used by all 4 dashboard
  shells (Player/Owner/Manager/Admin) and `MobileAccountMenu` — falls
  back to the initial-letter circle for email/password accounts. Verified
  live (topbar chip shows the real Google photo).
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
  code done, `backend/src/services/email.service.ts` / `sms.service.ts`.
  Both fall back to `console.log` when their API key env var is unset,
  so local dev never needs real credentials. Wired into: booking
  confirmed (player email+SMS, owner/manager email), booking cancelled
  (player email), payout paid/failed (owner email+SMS), venue
  verified/suspended (owner email), new review (owner email).

Test accounts (all real, in the live Supabase project):
- `admin@kicko.test` / `admin123`
- `owner@kicko.test` / `owner123` — owns "manager Demo test" venue,
  manager "Mark Mwangi" (credentials unknown, user created this one
  directly, not me)
- `player@kicko.test` / `player123`
- Separately: `kicko.testowner@example.com` owns "Test Turf" — a
  pre-existing real account, not one I created, password unknown.
- `ngiog06@gmail.com` — the user's own Google account, used to test
  Google sign-in/avatar this session (real player signup on the live
  Supabase project).

## What's stubbed / fake on purpose (not bugs)

- `stk.service.ts` (STK push / collections) and `b2c.service.ts`
  (payouts) — both permanent stubs until Safaricom credentials exist.
  Every caller only depends on the function shape, so swapping the stub
  body for a real Daraja call is the only change needed later.
- Everything else in the app was audited to remove fabricated stats —
  dashboards show real computed numbers only.

## Blocked on external paperwork (not code)

**M-Pesa / Daraja** — two sequential steps:
1. eCitizen — register the actual business. In progress, not done.
2. Then: KRA PIN → Safaricom paybill/till → Daraja C2B access → separate
   Daraja B2C approval + G2 Portal InitiatorName/SecurityCredential setup.

Full checklist: `docs/daraja-b2c-setup.md`. Nothing to build here until
credentials exist — this is 100% external waiting, not a task queue.

**Africa's Talking (SMS)** — live Team + app (`kicko`) created, live API
key confirmed authenticating, in `backend/.env` (not yet in Render's
env). Real delivery to Safaricom numbers is unverified — a test send hit
`UserInBlacklist` (Safaricom DND blocking promo SMS from AT's shared
sender ID, not a code/credentials issue). Fix is a custom alphanumeric
sender ID (KES 8,700 one-off + a few days' approval,
`docs/africas-talking-live-setup.md` §6) — user explicitly said **hold
off** on this for now.

## Next steps (in rough order, nothing urgent — pick up whenever)

1. **Resend**: create account, add `kicko-app.co.ke` as a sending
   domain, merge its SPF include into the existing Zoho SPF TXT record
   (can't have two SPF records on one domain), set `RESEND_API_KEY` +
   `EMAIL_FROM` in Render's env, redeploy. Until then, transactional
   emails just log to console instead of sending.
2. Set `AFRICASTALKING_USERNAME`/`AFRICASTALKING_API_KEY` in Render's
   env too (currently only local) — SMS still has the DND/sender-ID
   caveat above regardless.
3. OTP/phone-verification flow — not built yet. Shape sketched in
   `docs/africas-talking-live-setup.md` §7. Needs deciding whether it's
   a signup verification gate or a full replacement for the manager
   synthetic-email login hack.
4. Apple sign-in — parked, needs a paid Apple Developer account first.
5. M-Pesa/Daraja and the AT custom sender ID — both blocked on external
   approvals, not on Claude/code work; revisit when the user has news.

## Known accepted risk

`africastalking` npm SDK bundles a few vulnerable transitive deps (old
axios/joi/lodash — `npm audit` flags 4). The only fix is downgrading the
SDK to 0.7.4. Left as-is deliberately: it's server-only, only ever sends
fixed messages to trusted recipients, never passes attacker-controlled
data into axios config. Revisit if that usage pattern ever changes, or
if a maintained fix lands upstream.

## Environment / running locally

Dev servers were running locally this session (backend on
`http://localhost:4001`, frontend/Expo web on `http://localhost:8081`)
to verify the avatar feature — may or may not still be up depending on
whether the terminal/session that started them is still alive. To bring
them up fresh:
```
cd backend && npm run dev       # http://localhost:4001
cd frontend/web && npm run web  # picks a free port, usually 8081
```
`backend/.env` and `frontend/web/.env` already exist locally with real
Supabase credentials (gitignored, not in the repo) — `.env.example` in
each has the full list of vars including the email/SMS ones, all
currently optional (fall back to console-log stubs).

Google OAuth also needs `http://localhost:<port>/auth/callback` in
Supabase's redirect allow-list to work from local dev — already added
for port 8951 per the original plan; if Expo picks a different port
(e.g. 8081, as it did this session) and Google sign-in throws a redirect
error locally, add that port's callback URL in Supabase → Authentication
→ URL Configuration.

## Git state

As of this commit, everything described above is committed. Check
`git log` for the exact recent commit messages rather than trusting a
hardcoded list here (this file will go stale fast otherwise).
