# Kicko — Privacy Policy (DRAFT)

> **STATUS: DRAFT FOR LEGAL REVIEW. NOT FINAL. NOT LEGAL ADVICE.**
> Drafted from the actual data Kicko's codebase collects, stores, and
> sends to third parties as of 2026-08-26 — not generic boilerplate. It
> is **not** ready to publish. See "Open items for legal review" at the
> end before circulating this draft further, in particular the note on
> Kenya's Data Protection Act, 2019.

**Last updated:** [DATE] · **Effective date:** [DATE]

---

## 1. Who we are

**[LEGAL ENTITY NAME]** ("Kicko", "we", "us") operates the Kicko booking
platform (kicko-app.co.ke and related apps). For the purposes of Kenya's
Data Protection Act, 2019, Kicko is the **data controller** for the
personal data described below. Our registered address is
**[REGISTERED ADDRESS]**, and you can reach our data protection contact
at **[CONTACT EMAIL]**.

## 2. What we collect

### 2.1 Information you give us directly
- **Account details**: full name, email address, password (we never see
  or store this in plain text — it's handled by our authentication
  provider, Supabase Auth), and phone number (optional for players,
  required to receive certain SMS notices).
- **Player profile (optional)**: your preferred sport and playing
  position.
- **Venue Owner details**: venue name, location, pricing, amenities,
  photos, and payout details (e.g. the M-Pesa number or account you want
  paid out to).
- **Booking and session data**: what you book, when, with whom (for
  shared sessions), and any display name you use to join a session
  without an account.
- **Payment details**: the M-Pesa phone number used for a given payment
  and the transaction reference Safaricom returns to us. We do **not**
  receive or store your M-Pesa PIN, or full financial account details —
  those stay between you and Safaricom.
- **Reviews**: any review text and rating you submit for a venue.
- **Communications**: anything you send us directly (e.g. a support
  request).

### 2.2 Information we collect automatically
- **Device/browser type**: a coarse category (mobile, tablet, desktop)
  and browser name, recorded once when you sign up and once each time
  you sign in. This is used in aggregate (e.g. "what % of our users are
  on mobile") — we do not build an individual tracking profile from it.
- **Basic request logs**: our servers log request paths, response
  status, and timing for operational monitoring and abuse prevention
  (e.g. the rate limiting described in Section 5). Our hosting and
  infrastructure providers may incidentally log IP addresses as part of
  normal server operation and security monitoring.

### 2.3 Information from third parties
- **Google**: if you sign up or sign in with Google, we receive your
  name, email address, and profile photo from your Google account.
- **Safaricom (M-Pesa)**: payment status and transaction reference for
  payments you initiate through the app.

### 2.4 Local storage on your device
The web app stores a small amount of data in your browser's local
storage: your light/dark theme preference, and, if you join a shared
session without an account, a private "claim" token that lets you later
attach that session spot to a real account on the same device/browser.
We do not use third-party advertising or analytics cookies.

## 3. How we use your information

We use the data above to:

- Create and manage your account, and let you use the roles it grants
  (player, venue owner, manager);
- Process bookings and payments, including initiating M-Pesa payment
  requests and calculating shared-session splits and refunds;
- Send transactional communications: booking confirmations and
  cancellations, "your game is in an hour" reminders, session
  funding/invite notices, payout confirmations, and post-game
  review-request emails (sent via our email provider, Resend) and SMS
  notices (sent via Africa's Talking);
- We do **not** currently send marketing emails — the app has a
  notification-preferences toggle for this, but as of this draft it is
  not yet wired to any actual sending, so nothing changes based on it
  either way (see "Open items" below);
- Prevent fraud and abuse, including the rate limiting and bot-detection
  measures on our sign-up, payment, and session-join flows;
- Maintain and improve the Platform, including aggregate analytics on
  device/browser usage;
- Comply with legal obligations and resolve disputes.

## 4. Who we share it with

We share personal data only as needed to run the Platform:

| Recipient | What they receive | Why |
|---|---|---|
| **Safaricom (M-Pesa Daraja API)** | Phone number, amount, transaction reference | To process your payment |
| **Google** | Nothing beyond the standard OAuth handshake | To let you sign in with Google |
| **Supabase** | All account, booking, and venue data | Our database and authentication infrastructure host |
| **Africa's Talking** | Phone number, message content | To deliver SMS notices |
| **Resend** | Email address, message content | To deliver transactional (and, if opted in, marketing) emails |

We do **not** sell your personal data, and we do not share it with
advertisers or data brokers.

Between Kicko users: a session's participants can see each other's
names within that session (subject to the "blind roster" rule — you
can't see the opposing side's full roster until you're on it or it's
been claimed); a venue owner can see the names and contact details of
players who book their venue.

## 5. Security

We use several measures to protect your data:

- Passwords are hashed and managed by Supabase Auth — we never see or
  store a plain-text password;
- Database access is governed by row-level security policies, with the
  application backend as the sole service-role client;
- Traffic to the Platform is encrypted in transit (HTTPS);
- Rate limiting and a honeypot check guard sign-up, payment, and
  session-join endpoints against automated abuse.

No system is perfectly secure, and we cannot guarantee absolute
security, but we take reasonable, industry-standard steps to protect
your information.

## 6. Data retention

We retain your account and booking data for as long as your account is
active, and for a reasonable period afterward to meet legal, tax, and
dispute-resolution obligations. **[Specific retention periods —
e.g. for financial/transaction records under Kenyan tax law — to be
confirmed with counsel/your accountant and filled in here.]** You can
request deletion of your account at any time (Section 8); we may retain
certain records where we have a legal obligation to do so.

## 7. International data transfers

**[To complete: confirm the physical hosting region(s) used by our
Supabase project and any other infrastructure, and whether any personal
data leaves Kenya as a result. If so, this section needs to describe the
safeguard used, per Kenya's Data Protection Act, 2019 cross-border
transfer rules.]**

## 8. Your rights

Under Kenya's Data Protection Act, 2019, you have the right to:

- Be informed of how your data is used (this policy);
- Access the personal data we hold about you;
- Request correction of inaccurate data;
- Request deletion of your data, subject to our legal retention
  obligations;
- Object to or restrict certain processing (e.g. marketing emails — you
  can opt out any time in Settings);
- Data portability, where applicable;
- Lodge a complaint with the **Office of the Data Protection
  Commissioner (ODPC)** if you believe we have mishandled your data.

To exercise any of these rights, contact us at **[CONTACT EMAIL]**.

## 9. Children's privacy

The Platform is not directed at, and we do not knowingly collect data
from, anyone under 18. If you believe a child has created an account,
contact us and we will take steps to remove it.

## 10. Changes to this policy

We may update this Privacy Policy from time to time. If we make a
material change, we will give notice (e.g. in-app notice or email)
before it takes effect.

## 11. Contact us

Questions about this policy, or requests relating to your data, can be
sent to **[CONTACT EMAIL]**.

---

## Open items for legal review

1. **ODPC registration.** Kenya's Data Protection Act, 2019 requires
   certain data controllers/processors to register with the ODPC. Please
   confirm Kicko's registration status (or need to register) with
   counsel — this policy assumes compliance but doesn't establish it.
2. **Hosting region / cross-border transfer (Section 7).** I could not
   determine from the codebase which physical region the production
   Supabase project and other infrastructure run in. This needs to be
   confirmed and, if data leaves Kenya, the section filled in properly.
3. **Retention periods (Section 6).** I deliberately left this as a
   placeholder rather than guess at figures — financial/transaction
   record retention in particular should track Kenyan tax/AML-adjacent
   requirements, not an arbitrary number.
4. **M-Pesa data handling characterization (Section 2.1/4).** Same flag
   as in the Terms of Service draft: confirm with counsel that
   describing Kicko as only "processing," not "holding," payment data is
   accurate given the payout-holding mechanic described there.
5. **Marketing consent mechanics.** I checked this while drafting: the
   Settings screen has toggles for booking/price-drop/marketing
   notifications, but they're local UI state only — nothing persists
   them to the backend, and there's no marketing-email template or send
   path in the code at all. The policy above describes current reality
   (no marketing emails sent). If you build real marketing sends later,
   this section needs updating alongside that work, and the toggle
   needs to actually persist and be honored before it means anything.
