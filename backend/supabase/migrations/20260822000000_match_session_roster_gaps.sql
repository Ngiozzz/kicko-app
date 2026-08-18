-- ============================================================
-- MATCH SESSION ROSTER GAPS
-- Closes the schema gaps needed for the real invite/roster flow
-- on top of 20260821000000_match_sessions.sql: pending invites
-- (status), anonymous join-then-claim (nullable user_id +
-- display_name + claim_token), invite provenance, and per-side
-- "complete my roster" early-close timestamps.
-- ============================================================

alter table public.session_participants
  drop constraint session_participants_status_check;
alter table public.session_participants
  add constraint session_participants_status_check
  check (status in ('invited', 'accepted', 'declined', 'removed'));

-- Anonymous join-then-claim: an unclaimed placeholder has no user_id yet,
-- only a typed display_name and a claim_token the browser hangs onto until
-- the person logs in and calls POST /api/sessions/:id/claim. Postgres
-- treats every NULL as distinct for the existing unique(session_id, user_id)
-- constraint, so multiple placeholders per session/side are already fine
-- without touching that constraint.
alter table public.session_participants
  alter column user_id drop not null;
alter table public.session_participants
  add column display_name text;
alter table public.session_participants
  add column claim_token text unique;

alter table public.session_participants
  add column invited_by uuid references public.users(id);
alter table public.session_participants
  add column responded_at timestamptz;

-- Lets a captain close their own side's invite window early — see
-- sessions.controller.ts#completeRoster. Both set -> joining ends
-- immediately regardless of the 15-minute phase_deadline.
alter table public.match_sessions
  add column home_roster_completed_at timestamptz;
alter table public.match_sessions
  add column away_roster_completed_at timestamptz;
