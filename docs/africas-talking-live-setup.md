# Opening a live Africa's Talking account (for SMS + phone verification)

Reference for getting real SMS delivery working — sandbox
(`username: "sandbox"`) never reaches a real phone, it only simulates the
API response. This is what actually unblocks `AFRICASTALKING_USERNAME`/
`AFRICASTALKING_API_KEY` in `backend/.env`. AT's exact flow/UI shifts
over time, so treat this as a starting checklist and confirm specifics on
their dashboard, same caveat as [daraja-b2c-setup.md](./daraja-b2c-setup.md).

## 1. Create the account

- Sign up at africastalking.com with a real email — this becomes your
  organization's owner login.
- Verify the email, then create your **organization** (this is separate
  from an "app" — the org is the billing/KYC entity, apps live under it).
  You can register as an individual/sole proprietor here — AT doesn't
  require a registered company the way Safaricom's Daraja B2C does, but
  going through as a registered business (if you have one) tends to move
  KYC review faster and unlocks a wider range of sender ID options.

## 2. KYC / business verification

- In the dashboard, look for "Complete your profile" or "Business
  verification" (naming shifts between AT dashboard versions).
- Typically asked for: a valid ID (National ID/passport) for the account
  owner, a business registration certificate or eCitizen printout if
  operating as a company, and a contact phone/email that matches what's
  on file.
- This step is what flips the account from "sandbox-only" to able to
  create a **live app** and send real messages. Turnaround varies — often
  same-day to a few days, unlike Safaricom's multi-week B2C approval.

## 3. Fund the wallet

- AT is prepaid — SMS sending draws down a wallet balance, no invoice-
  after-the-fact. Top up via card or (once your paybill exists) M-Pesa.
- Check current per-SMS pricing for Kenya on AT's pricing page before
  budgeting — rates change and are volume-tiered, not worth hardcoding a
  number here.

## 4. Create the live app + sender ID

- Once verified, create a new **app** (not sandbox) — this generates the
  real `username` (your app name, not literally "sandbox") and API key
  that go into `AFRICASTALKING_USERNAME`/`AFRICASTALKING_API_KEY`.
- By default you send under a shared/generic alphanumeric ID. Requesting
  your own custom sender ID (e.g. "KICKO") for branded messages is a
  separate approval step under the app's SMS settings — can take a few
  extra days, not required to start sending.
- Swap the env vars in Render (or your local `.env`) — `sms.service.ts`
  needs no code change, it already reads these at runtime.

## 5. Sanity-check before relying on it

- Send yourself a real test SMS via the AT dashboard's "Simulate"/"Test"
  tool once the live app exists, confirm it actually lands on a phone —
  don't assume it works until you've seen a real message arrive.
- Then re-run the same in-app flow this project already uses for SMS
  (booking confirmation, payout paid/failed — see
  `backend/src/services/sms.service.ts` callers) and confirm those land
  too.

## 6. Using this for phone/mobile verification

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
