-- Managers can be invited by phone alone — many don't have an email. The
-- owner sets a temporary password directly (no SMS/OTP infra required for
-- this first pass — see conversation), and the manager signs in with
-- phone + password via Supabase's native phone-identity auth. That needs
-- no SMS provider configured either: phone_confirm is set true at
-- creation time, so no OTP is ever sent, it's used purely as an identity
-- + password login, same mechanics as email + password.

alter table public.users alter column email drop not null;

alter table public.users
  add constraint email_or_phone_required check (email is not null or phone is not null);

-- One venue per manager, matching the owner dashboard's "invite a manager
-- for this venue" flow (managers.tsx) — a plain nullable FK, not a
-- many-to-many join table, since nothing in the product needs a manager
-- split across venues yet.
alter table public.users add column venue_id uuid references public.venues(id) on delete set null;

alter table public.users
  add constraint venue_id_only_for_managers check (venue_id is null or role = 'manager');

create index idx_users_venue_id on public.users(venue_id);
