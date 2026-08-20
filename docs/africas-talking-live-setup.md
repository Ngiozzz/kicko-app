# Opening a live Africa's Talking account (for SMS + phone verification)

Reference for getting real SMS delivery working — sandbox
(`username: "sandbox"`) never reaches a real phone, it only simulates the
API response. This is what actually unblocks `AFRICASTALKING_USERNAME`/
`AFRICASTALKING_API_KEY` in `backend/.env`. AT's exact flow/UI shifts
over time, so treat this as a starting checklist and confirm specifics on
their dashboard, same caveat as [daraja-b2c-setup.md](./daraja-b2c-setup.md).

**Update 2026-08-19**: walked through this live end-to-end and AT's
dashboard has changed significantly since this doc was first written —
steps 1–4 below are corrected from what actually happened, not the old
assumptions. No ID/business-document KYC step exists anymore.

## 1. Create the account

- Sign up at africastalking.com with a real email — this becomes your
  organization's owner login. Every account gets a free **Sandbox** app
  automatically (`username: "sandbox"`).

## 2. Create a Team, then a live App inside it

- Live (production-ready) apps no longer sit directly on the account —
  they live inside a **Team**. From the AT dashboard Home page, click
  "New Team" (name only, e.g. "Kicko").
- Inside the team, click "Create App" — give it a name, a **username**
  (this becomes `AFRICASTALKING_USERNAME`, e.g. "kicko"), and a country
  (Kenya → auto-selects KES). No KYC/ID upload gate here — the app is
  created instantly.
- **No manual KYC/business verification step exists in the current
  dashboard.** Instead, per AT's own help center: "an app you own must
  interact with the Africa's Talking API in some capacity" (sending an
  SMS, topping up, sending airtime) — that first successful call is what
  flips the account from "not fully active" to fully active, lifting the
  1-team/1-app limit to 5/5. A banner on every page reminds you of this
  until it happens.

## 3. Get the API key

- Inside the app → Settings → API Key. The page **never displays the key
  directly** — it asks for your account password, then emails a
  generate/regenerate link. Click that link once and copy the key shown
  on the resulting page immediately (Gmail and some email clients
  prefetch/scan links, which can occasionally burn a single-use link
  before you manually click it — if the copied key 401s, request a fresh
  one and click through fast).
- **Give a freshly generated key at least 5 minutes before testing** —
  AT's own docs call this out explicitly; testing immediately after
  generation is a common cause of a spurious `401 "The supplied
  authentication is invalid"` even with the correct key.
- Put the result in `backend/.env`:
  ```
  AFRICASTALKING_USERNAME=kicko
  AFRICASTALKING_API_KEY=atsk_...
  ```
  `sms.service.ts` needs no code change, it already reads these at
  runtime. Swap the same two vars into Render's env when deploying.

## 4. Fund the wallet

- AT is prepaid — SMS sending draws down a wallet balance, no invoice-
  after-the-fact. New live apps start with a small free credit (KES 10
  seen on this account). Top up via card or (once your paybill exists)
  M-Pesa once that runs out.
- Check current per-SMS pricing for Kenya on AT's pricing page before
  budgeting — rates change and are volume-tiered, not worth hardcoding a
  number here.

## 5. Sanity-check before relying on it — and the DND gotcha

- The dashboard's newer UI has no "Simulate"/"Test send" tool on the SMS
  page anymore (just an Outbox log). Easiest real test: run the app's
  own `sendSms()` from `sms.service.ts` against a real number.
- **Expect `UserInBlacklist` (status code 406) on the first real test if
  the recipient is on Safaricom.** This is *not* an auth or code problem
  — it means that phone number has Safaricom's Do Not Disturb (DND)
  opt-out active against **promotional/marketing** SMS from any
  unregistered/shared sender ID, which is what a brand-new AT app sends
  under by default. Confirmed hitting this on the first live test
  2026-08-19.
  - Quick per-number fix (not scalable, not free of side effects): the
    recipient dials `*456*9#` → option 5 (Marketing) → option 5 again to
    re-enable promo SMS. This is a **network-wide** opt-in, not scoped to
    Kicko — it reopens that line to promotional SMS from any shared-ID
    sender, not just this app. Fine for a one-off test on a throwaway
    number, a real tradeoff on your own daily-use number.
  - Real fix: a **custom/registered sender ID** (see below) — messages
    from a registered ID aren't classified as marketing, so they bypass
    the DND block entirely, for every recipient, not just the tester.
    This is the fix actually needed before relying on this for booking/
    payout notifications in production.
- Once a test send succeeds, re-run the same in-app flow this project
  already uses for SMS (booking confirmation, payout paid/failed — see
  `backend/src/services/sms.service.ts` callers) and confirm those land
  too.

## 6. Custom sender ID (deferred as of 2026-08-19 — do this before relying on SMS in production)

- **Cost**: KES 8,700 one-off (KES 7,500 + 16% VAT) for Safaricom +
  Airtel, paid via M-Pesa Paybill `525900`, account `ADMIN`. Other
  networks may have separate/additional costs — confirm on AT's site,
  pricing drifts.
- **Requirements**: the ID must reflect the actual product/company name
  ("KICKO" is fine — generic names get rejected), max 11 characters, no
  spaces (hyphens/underscores OK), trademark proof if the name is
  trademarked.
- **Process**: fill out AT's draft letter template, email it to
  `info@africastalking.com` (not a self-serve dashboard button, despite
  "Product Requests" existing in the sidebar — that section appears to
  track status, not submit the request itself). Submissions go to
  Safaricom Mondays/Thursdays before noon, live the following
  Tuesday/Friday. Other networks: 7–14 working days.
- Confirm these specifics on AT's help center before paying — pricing
  and process are exactly the kind of thing that drifts over time.

## 7. Using this for phone/mobile verification

This is the part relevant to your actual goal — verifying a real phone
number belongs to the person signing up (or replacing the manager
synthetic-email login hack with real OTP). AT doesn't have a
dedicated "verification" product with built-in code storage — you build
the OTP flow on top of the same SMS API above:

1. Backend generates a random 6-digit code, stores it (with an
   expiry, e.g. 5–10 min) against the phone number — a new small table,
   not Supabase Auth itself.
2. Sends it via `sendSms()` (already built).
3. User submits the code back; backend checks it matches and hasn't
   expired, marks that phone as verified.
4. For actual login/signup, this either gates account creation (verify
   once) or — if you want to fully replace the synthetic-email manager
   login — becomes the sign-in mechanism itself instead of a password.

I haven't built this yet — flagging the shape of it now since it's the
reason you're opening the live account, but it's a real implementation
task (new migration, new endpoints, rate-limiting so someone can't spam
OTPs to a number they don't own) worth doing as its own piece of work
once the live credentials exist. Say the word when you want it built.
