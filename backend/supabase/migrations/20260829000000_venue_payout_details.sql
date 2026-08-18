-- Payout details a venue owner sets so completed bookings can be paid out
-- automatically via Daraja B2C once Safaricom approval + credentials land
-- (see backend/src/services/b2c.service.ts — same stub-now, swap-later
-- pattern as stk.service.ts). Mobile money only for now (no bank transfer
-- support — Daraja B2C can't reach bank accounts at all, that would need a
-- separate integration entirely).

alter table public.venues add column payout_type text check (payout_type in ('phone', 'paybill', 'till'));
alter table public.venues add column payout_number text;
-- Only meaningful for paybill (identifies the sub-account) — null for phone/till.
alter table public.venues add column payout_account_ref text;

alter table public.venues
  add constraint payout_number_required_with_type
  check ((payout_type is null) = (payout_number is null));

-- Set once a payout actually gets attempted (successful or not) — the
-- provider's own transaction ID, for reconciling against Daraja's own
-- records once this is live.
alter table public.payouts add column provider_reference text;
