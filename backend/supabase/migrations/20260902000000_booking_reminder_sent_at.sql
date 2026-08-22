-- Tracks whether the "your game is in an hour" reminder has already gone
-- out for a booking, so the reminder job (checks every few minutes) never
-- double-sends one. Nullable, set once when the reminder fires.
alter table public.bookings
  add column reminder_sent_at timestamptz;
