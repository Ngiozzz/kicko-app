# Setting up Daraja B2C for automated payouts

Reference for the day Safaricom approves B2C — the steps that actually
produce the credentials `backend/src/services/b2c.service.ts` needs.
Requirements/timelines shift on Safaricom's side, so treat this as a
starting checklist, not gospel — confirm specifics with your Safaricom
account rep or the live Daraja docs at developer.safaricom.co.ke.

## 1. Business paperwork (before applying for anything)

- Registered business — Certificate of Incorporation, or eCitizen
  registration if a sole proprietorship. Safaricom doesn't issue
  production Daraja credentials to individuals.
- KRA PIN certificate for the business.
- National ID / passport of the authorized signatory.
- A letter of authorization if the applicant isn't the owner/director.
- An **already-active** Paybill or Till through Safaricom Business —
  this has to exist and work before applying for API access, not in
  parallel with it.

## 2. Apply on the Daraja developer portal

Portal: developer.safaricom.co.ke

- Sandbox access is instant, no approval needed — good for testing
  `b2c.service.ts` against the real API shape ahead of time.
- Go to **Go Live**, upload the business docs above, and **explicitly
  select B2C as one of the requested APIs** — it is not bundled with
  C2B/STK push by default, it has to be named in the request.
- Typical review: 2–5 business days, up to 10 if busy or docs are
  incomplete.
- Common rejection reasons: business name mismatch across documents,
  requesting APIs not actually needed (padding slows review), or
  callback URLs not reachable over HTTPS at review time.

## 3. Technical setup once B2C is approved — the InitiatorName + SecurityCredential steps

This is a separate step from the paperwork approval above, done on a
**different portal**: the M-Pesa G2 Portal, not the Daraja developer
portal.

1. Log into the **M-Pesa G2 Portal** (org.ke.m-pesa.com) using your
   **Organization Admin** credentials — the account Safaricom issued
   when the paybill was first set up.
2. Go to **User Management → Create Operator**. This operator *is*
   your `InitiatorName` (pick a distinct username you'll reference in
   config, not something guessable).
3. Assign the operator the **Business Manager** role specifically —
   not Contributor. Manager grants both *initiating* payouts and
   *checking transaction status*; Contributor alone isn't enough.
4. Log in as that new operator once to set its permanent password.
5. **Encrypt that password using Safaricom's public key certificate**
   to produce the `SecurityCredential` — this is the actual value
   B2C requests get signed with. Do not put the plain password in code
   or config; only the encrypted SecurityCredential.
6. Register your `ResultURL` and `QueueTimeOutURL` callback endpoints
   with Safaricom — real, reachable HTTPS, since B2C is asynchronous
   (you fire the request, the outcome arrives via webhook).

## 4. Float

B2C pays out of the paybill's own M-Pesa business balance — Safaricom
isn't fronting the money. Keep that account topped up, or payouts will
fail for lack of funds regardless of how correct the integration is.

## What this hands to the code

Once all of the above is done, you'll have everything
`initiateB2CPayout` in `backend/src/services/b2c.service.ts` needs to
stop being a stub:

- Consumer Key / Consumer Secret (from the Daraja app)
- B2C shortcode (the paybill itself)
- `InitiatorName` (step 3.2)
- `SecurityCredential` (step 3.5)
- `ResultURL` / `QueueTimeOutURL` (step 3.6)

Swapping the stub body for a real Daraja B2C request using these is the
only code change needed — see the comment at the top of
`b2c.service.ts` for why nothing that *calls* it has to change.

## Sources

- [Daraja Production Checklist - M-Pesa Go-Live Guide 2026](https://www.mctaba.com/learn/mpesa/daraja-production-checklist)
- [Mastering Safaricom B2C: How to Configure G2 Portal Operators for Automated Payouts](https://dev.to/denis_254_965ff29c643d5f4/title-mastering-safaricom-b2c-how-to-configure-g2-portal-operators-for-automated-payouts-tags-9i9)
- [M-Pesa B2C vs C2B Explained: When to Use Each (2026)](https://www.kenzobe.com/blog/mpesa-b2c-vs-c2b)
