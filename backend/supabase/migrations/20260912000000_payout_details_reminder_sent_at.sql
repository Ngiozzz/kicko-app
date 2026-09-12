-- Tracks whether the owner has already been emailed about a payout stuck
-- pending because the venue has no payout_type/payout_number on file yet,
-- so the payout job (checks every 60s) never re-sends the same reminder
-- on every pass. Nullable, set once when the reminder fires.
alter table public.payouts
  add column payout_details_reminder_sent_at timestamptz;
