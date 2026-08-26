-- ============================================================
-- TEAMS — a persistent roster players build once and reuse, unlike a
-- session/split-booking's per-occasion participant list. First real use
-- is registering a squad for a tournament, but the roster itself is
-- generic (name, sport, captain, members) so it isn't tournament-only.
--
-- Deliberately NO shared wallet here — the "Coming soon" placeholder
-- copy mentioned pooling money into a team balance, but that's a
-- materially different, heavier feature (money sitting on account
-- between bookings, not tied to one immediate transaction) with real
-- regulatory weight of its own. Left out until that's discussed on its
-- own, not smuggled in as a side effect of building the roster.
-- ============================================================

create table public.teams (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  sport       text,
  captain_id  uuid not null references public.users(id) on delete cascade,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index idx_teams_captain on public.teams(captain_id);

create trigger teams_set_updated_at
  before update on public.teams
  for each row execute function public.set_updated_at();

-- Same invite/accept/decline shape session_participants and
-- booking_participants already use — captain invites by phone, invitee
-- must already have a Kicko account, no anonymous placeholders.
create table public.team_members (
  id           uuid primary key default gen_random_uuid(),
  team_id      uuid not null references public.teams(id) on delete cascade,
  user_id      uuid not null references public.users(id) on delete cascade,
  role         text not null default 'member' check (role in ('captain', 'member')),
  status       text not null default 'invited' check (status in ('invited', 'accepted', 'declined', 'removed')),
  invited_by   uuid references public.users(id),
  responded_at timestamptz,
  joined_at    timestamptz not null default now(),

  unique (team_id, user_id)
);

create index idx_team_members_team on public.team_members(team_id);
create index idx_team_members_user on public.team_members(user_id);

alter table public.teams enable row level security;
alter table public.team_members enable row level security;
