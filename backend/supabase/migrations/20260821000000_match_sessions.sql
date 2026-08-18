-- ============================================================
-- MATCH SESSIONS — shared, split-cost bookings.
-- Two-sided (home/away) roster with blind visibility, phase
-- machine (joining -> paying -> funded | awaiting_decision ->
-- resolved), and per-participant payments. Created ahead of the
-- bookings migration so bookings.session_id can reference it.
-- ============================================================

create table public.match_sessions (
  id                 uuid primary key default gen_random_uuid(),
  venue_id           uuid not null references public.venues(id) on delete cascade,
  organizer_id       uuid not null references public.users(id) on delete cascade,
  start_at           timestamptz not null,
  end_at             timestamptz not null,
  total_cost         numeric(10,2) not null,
  phase              text not null default 'joining'
                       check (phase in ('joining', 'paying', 'awaiting_decision', 'funded', 'cancelled')),
  phase_deadline     timestamptz not null,
  resplit_active     boolean not null default false,
  home_invite_token  text not null unique default substr(md5(gen_random_uuid()::text), 1, 12),
  away_invite_token  text not null unique default substr(md5(gen_random_uuid()::text), 1, 12),
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create index idx_match_sessions_venue on public.match_sessions(venue_id);
create index idx_match_sessions_organizer on public.match_sessions(organizer_id);
create index idx_match_sessions_phase on public.match_sessions(phase);

create trigger match_sessions_set_updated_at
  before update on public.match_sessions
  for each row execute function public.set_updated_at();

create table public.session_participants (
  id             uuid primary key default gen_random_uuid(),
  session_id     uuid not null references public.match_sessions(id) on delete cascade,
  user_id        uuid not null references public.users(id) on delete cascade,
  side           text not null check (side in ('home', 'away')),
  is_captain     boolean not null default false,
  status         text not null default 'accepted' check (status in ('accepted', 'removed')),
  paid           boolean not null default false,
  paid_amount    numeric(10,2) not null default 0,
  joined_at      timestamptz not null default now(),

  unique (session_id, user_id)
);

create index idx_session_participants_session on public.session_participants(session_id);
create index idx_session_participants_user on public.session_participants(user_id);

-- Same posture as every other table so far: RLS on, no policies yet,
-- access goes through the backend's service-role client.
alter table public.match_sessions enable row level security;
alter table public.session_participants enable row level security;
