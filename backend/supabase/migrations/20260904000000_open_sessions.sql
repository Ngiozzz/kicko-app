-- ============================================================
-- OPEN SESSIONS — publicly joinable games, opt-in per session/booking.
-- Everything defaults to today's private/invite-only behavior; an
-- organizer has to explicitly mark a session or split booking "open"
-- for it to be discoverable and joinable without an invite.
-- ============================================================

-- Squad sports (football/basketball, via match_sessions): an open session
-- can be joined directly — pick a side, no invite link or captain
-- approval needed. See sessions.controller.ts#joinOpenSession.
alter table public.match_sessions
  add column is_open boolean not null default false;

-- Pair sports (tennis/padel, via split bookings): an open booking can
-- have one or more of its N-1 "other player" slots left unnamed instead
-- of naming a specific phone number — any logged-in player can claim one
-- directly. See bookings.controller.ts#claimOpenBookingSlot.
alter table public.bookings
  add column is_open boolean not null default false;

-- An unclaimed open slot has no user yet — same nullable-user_id shape
-- session_participants already uses for anonymous join-then-claim
-- (NULLs are distinct for the existing unique(booking_id, user_id), so
-- multiple open slots per booking are already fine untouched).
alter table public.booking_participants
  alter column user_id drop not null;

alter table public.booking_participants
  drop constraint booking_participants_status_check;
alter table public.booking_participants
  add constraint booking_participants_status_check
  check (status in ('invited', 'accepted', 'declined', 'removed', 'open'));
