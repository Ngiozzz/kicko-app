-- ============================================================
-- SPLIT BOOKINGS — fixed, known-group split-cost bookings
-- (tennis singles/doubles today). Unlike match_sessions (recruit
-- strangers into open home/away sides over time), a split booking's
-- headcount is fixed the moment it's created — the organizer names
-- exactly who else is playing. So there's no sides, no captain, no
-- roster-recruiting phase machine: just one booking row plus N equal
-- payment shares, each participant paying their own via STK push,
-- confirmed the moment everyone has paid.
-- ============================================================

alter table public.bookings
  drop constraint bookings_booking_type_check;
alter table public.bookings
  add constraint bookings_booking_type_check
  check (booking_type in ('individual', 'session', 'split'));

-- Only set for booking_type = 'split' — mirrors match_sessions.phase_deadline,
-- but a split booking has just one deadline (pay by X or it's auto-cancelled),
-- not a phase machine, since headcount uncertainty isn't a thing here.
alter table public.bookings
  add column payment_deadline timestamptz;

create table public.booking_participants (
  id            uuid primary key default gen_random_uuid(),
  booking_id    uuid not null references public.bookings(id) on delete cascade,
  user_id       uuid not null references public.users(id) on delete cascade,
  is_organizer  boolean not null default false,
  status        text not null default 'accepted' check (status in ('invited', 'accepted', 'declined', 'removed')),
  share_amount  numeric(10,2) not null,
  paid          boolean not null default false,
  paid_amount   numeric(10,2) not null default 0,
  invited_by    uuid references public.users(id),
  responded_at  timestamptz,
  created_at    timestamptz not null default now(),

  unique (booking_id, user_id)
);

create index idx_booking_participants_booking on public.booking_participants(booking_id);
create index idx_booking_participants_user on public.booking_participants(user_id);

alter table public.payments
  drop constraint payments_purpose_check;
alter table public.payments
  add constraint payments_purpose_check
  check (purpose in ('booking', 'session_share', 'session_topup', 'session_remainder', 'split_share'));

alter table public.booking_participants enable row level security;
