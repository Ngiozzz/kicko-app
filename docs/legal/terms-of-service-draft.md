# Kicko — Terms of Service (DRAFT)

> **STATUS: DRAFT FOR LEGAL REVIEW. NOT FINAL. NOT LEGAL ADVICE.**
> This document was drafted from the actual behavior of the Kicko codebase
> (booking flows, payment handling, refund logic) as of 2026-08-26, so a
> lawyer can review real mechanics rather than generic boilerplate. It is
> **not** ready to publish. Every `[BRACKETED]` item is a fact only Kicko's
> owner can supply. See "Open items for legal review" at the end — please
> read that section before circulating this draft further.

**Last updated:** [DATE] · **Effective date:** [DATE]

---

## 1. Who this agreement is with

These Terms of Service ("**Terms**") are an agreement between you and
**[LEGAL ENTITY NAME]**, [a company/sole proprietorship] registered in
Kenya at [REGISTERED ADDRESS] ("**Kicko**", "**we**", "**us**"), governing
your use of the Kicko website, mobile application, and related services
(together, the "**Platform**"). By creating an account, ticking the
agreement checkbox at sign-up, or continuing past sign-up with a
third-party sign-in (e.g. Google), you accept these Terms and our
[Privacy Policy](./privacy-policy-draft.md).

If you do not agree, do not create an account or use the Platform.

## 2. Who can use Kicko

- You must be at least **18 years old**, or the age of majority in your
  jurisdiction, to create an account. Kicko is not directed at children.
- You must provide accurate account information (name, email, and — where
  provided — phone number) and keep it up to date.
- One person may not maintain more than one Player account.
- You are responsible for keeping your login credentials confidential and
  for all activity that happens under your account.

## 3. Account types

Kicko has four account roles, each with different permissions:

- **Player** — books venues, joins or organizes shared sessions, leaves
  reviews.
- **Venue Owner** — lists and manages venues, sets pricing and amenities,
  receives payouts for bookings at their venues, and may add Managers.
- **Manager** — added by an Owner and scoped to a single venue; handles
  that venue's bookings on the Owner's behalf. Manager accounts are
  created by an Owner, not self-registered.
- **Admin** — operates the Platform: verifies or suspends venues,
  resolves payouts and refunds, and moderates content. Admin accounts are
  provisioned directly by Kicko, not self-registered.

Kicko may change, suspend, or terminate any account role's permissions or
access to the Platform at its discretion, including for the reasons in
Section 10 (Suspension and termination).

## 4. Signing up

You can create an account with an email address and password, or by
continuing with a Google account. If you sign up with Google, we receive
your name, email address, and profile photo from Google; continuing past
that sign-in screen is your acceptance of these Terms and the Privacy
Policy, in the same way ticking the checkbox is for email sign-up.

## 5. How bookings work

Kicko offers two ways to book a venue:

### 5.1 Individual bookings
You reserve a venue for a chosen date, time, and duration, and pay the
full cost yourself via M-Pesa (see Section 7). Once payment is confirmed,
the booking is automatically confirmed — there is no separate approval
step from the venue owner.

### 5.2 Session (shared/split-cost) bookings
A session lets a group of players split the cost of booking a venue,
without everyone needing to know each other in advance:

- The person who starts a session becomes its **organizer** and the
  first member of the "Home" side; a second player can become the
  captain of the "Away" side (labeling of sides may vary by sport).
- Other players join a side directly, via a phone invite, or via a
  shareable invite link — including, in some cases, **without creating
  an account first** (an anonymous "unclaimed" spot tied to a display
  name and a private claim link, which can later be claimed by creating
  or logging into an account).
- As players join, each accepted player's share of the total cost is
  recalculated automatically and shown to everyone in the session.
- A session moves through phases — **joining**, **paying**, and (if
  funding stalls) **awaiting a decision** — each with its own time
  window shown in the app. If the full cost isn't collected before the
  applicable deadline, the organizer is offered the choice to
  **re-split** the remaining cost among those who already paid, or to
  **cancel** the session, in which case paid participants are refunded
  per Section 8.
- A session only becomes a confirmed booking once its **full cost has
  been collected** from its participants.
- A side's captain may remove a participant from their own side; the
  organizer may remove a participant from either side. Removing a
  participant who has already paid triggers a refund to them under
  Section 8.

You are responsible for the accuracy of any invite you send and for who
you invite into a session you organize or captain.

## 6. Venue listings

Venue Owners are solely responsible for the accuracy of their venue
listings — location, pricing, amenities, and availability. Kicko reviews
venues before they go live ("verified" status) and may suspend a venue
that violates these Terms, receives credible complaints, or is
misrepresented. Kicko is a booking platform, not the operator of any
venue, and is not responsible for the physical condition, safety, or
staffing of any listed venue. Any injury, loss, or dispute arising at a
venue is between you and the venue/its owner, without prejudice to
Section 12 (Limitation of liability).

## 7. Payments

- Kicko processes payments through **M-Pesa**, via Safaricom's Daraja
  API (STK Push). By initiating a payment, you authorize the charge to
  the M-Pesa number you provide, which may not necessarily be your own
  registered number, but you confirm you are authorized to use it.
- Prices are shown in Kenyan Shillings (KES) and include a **service
  fee** on top of the venue's own rate. The service fee amount depends on
  the size of the transaction, per the fee schedule shown at checkout,
  and is **never refundable**, including on a cancelled or re-split
  session (Section 8).
- Kicko does not hold your payment in a customer wallet or escrow
  account that you can withdraw from directly. Amounts collected are
  held by Kicko pending payout to the venue owner (Section 7.1); this is
  an internal accounting step, not a deposit or financial product.

### 7.1 Payouts to Venue Owners
Venue Owners receive the venue-fee portion of a completed booking to the
M-Pesa number or payout method on file with Kicko, on a schedule and
process Kicko determines. Kicko is not a bank or licensed payment
service provider and does not guarantee a specific payout timeline
beyond what is stated in the Owner-facing dashboard.

## 8. Cancellations and refunds

- Whether — and how much of — a payment is refundable depends on **how
  far in advance of the session's start time** you cancel, and whether
  the booking was made on the **same calendar day** as the session
  itself (a "walk-in" booking, which follows its own refund rate). The
  applicable refund percentage is shown to you in the app at the time of
  cancellation.
- The **service fee** portion of any payment is never refunded, at any
  cancellation tier.
- For a session (Section 5.2), a participant who is removed, or who
  leaves after paying their share, is refunded the venue-fee portion of
  their own payment under the same tiers, individually.
- Kicko or a venue owner may cancel a confirmed booking in exceptional
  circumstances (e.g. the venue becomes unavailable); in that case you
  will be refunded in full.
- Kicko reserves the right to change these refund tiers going forward;
  the tiers that applied to a given booking are the ones in effect and
  disclosed to you at the time you made that booking.

## 9. Reviews and content

Players who book a venue may leave a review. You agree that any review or
other content you submit is honest, based on genuine experience, and does
not contain defamatory, abusive, or unlawful content. Kicko may remove a
review, or act on a flag raised against one, at its discretion. You
retain ownership of content you post but grant Kicko a license to
display it on the Platform in connection with the relevant venue.

## 10. Prohibited conduct

You agree not to:

- Create fraudulent bookings or reviews, or manipulate a session's
  roster or splitting mechanism to avoid paying your fair share;
- Use automated tools, scripts, or bots against the Platform, including
  to scrape listings, brute-force invite links, or bypass rate limits;
- Impersonate another person, or invite someone into a session without
  a good-faith basis for doing so;
- Use the Platform for any unlawful purpose, or in a way that harasses,
  threatens, or abuses another user or a venue's staff;
- Attempt to circumvent Kicko's payment flow to transact with another
  user or venue outside the Platform for a booking initiated on it;
- Interfere with or disrupt the Platform's infrastructure, including
  the rate limits and abuse-prevention measures described in our
  [Privacy Policy](./privacy-policy-draft.md).

## 11. Suspension and termination

Kicko may suspend or terminate your account, with or without notice, if
you violate these Terms, if we reasonably suspect fraud or abuse, or if
required by law. You may stop using the Platform and request account
deletion at any time by contacting us (Section 15); this does not entitle
you to a refund of amounts already non-refundable under Section 8.

## 12. Disclaimers and limitation of liability

The Platform is provided "as is." To the maximum extent permitted by
Kenyan law:

- Kicko does not guarantee the Platform will be uninterrupted,
  error-free, or free of the effects of third-party outages (Safaricom
  M-Pesa, Google, SMS delivery, or our hosting providers);
- Kicko is not liable for the acts or omissions of venue owners, other
  players, or any third-party service used to operate the Platform;
- Kicko's total liability to you for any claim arising from your use of
  the Platform is limited to the amount you paid to Kicko (i.e. service
  fees) in the [3/6/12] months preceding the claim.

**[This section needs jurisdiction-specific legal drafting — see "Open
items for legal review" below. The bracketed liability cap and its
enforceability under Kenyan consumer-protection law in particular need
counsel's input.]**

## 13. Indemnification

You agree to indemnify Kicko against claims, losses, or damages arising
from your violation of these Terms, your use of the Platform, or content
you submit, to the extent permitted by law.

## 14. Changes to these Terms

We may update these Terms from time to time. If we make a material
change, we will give notice (e.g. in-app notice or email) before it
takes effect. Continued use of the Platform after a change takes effect
is your acceptance of the updated Terms.

## 15. Governing law and disputes

These Terms are governed by the laws of Kenya. **[Dispute-resolution
mechanism — courts of Kenya vs. arbitration, and venue/jurisdiction —
to be decided with counsel.]**

## 16. Contact

Questions about these Terms can be sent to **[CONTACT EMAIL]**.

---

## Open items for legal review

These are the specific things I (drafting this from the codebase, not as
counsel) could not responsibly decide myself and flagged instead of
guessing:

1. **Legal entity.** Section 1 needs the actual registered entity name,
   type, registration number (if any), and address. If Kicko is not yet
   incorporated, that changes who this contract is actually with.
2. **"Notionally held" payout funds (Section 7.1).** Money collected via
   M-Pesa STK push is described in the codebase as sitting with the
   platform until an admin manually resolves payout to the venue owner —
   there is no escrow/wallet product. Depending on volume and how this is
   structured, this may brush up against Kenyan payment-service-provider
   or agency-banking regulation. Worth specific counsel review rather
   than assuming "we're just a booking site" is a sufficient
   characterization.
3. **Liability cap (Section 12).** The bracketed cap and disclaimer
   language is a placeholder shape, not a vetted clause — Kenyan
   consumer-protection law may limit how far a liability disclaimer can
   go, especially towards a "Player" who is likely a consumer.
4. **Dispute resolution (Section 15).** Courts vs. arbitration, and
   which forum, is a business decision as much as a legal one — needs
   your input before counsel finalizes wording.
5. **Minimum age (Section 2).** I used 18 as a default since the
   Platform handles real payments; confirm this is the right floor for
   your market and whether any regional exception applies.
6. **Manager accounts.** Managers are added by an Owner via a
   phone-derived synthetic account, not self-registered with their own
   consent flow — confirm whether a Manager needs to separately accept
   these Terms, and how that would be captured.
