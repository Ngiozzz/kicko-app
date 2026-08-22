-- Tracks whether the "how was your game, rate the venue" email has
-- already gone out for a booking (or the player reviewed on their own
-- before the job got to it) — same idempotency pattern as
-- reminder_sent_at.
alter table public.bookings
  add column review_requested_at timestamptz;
