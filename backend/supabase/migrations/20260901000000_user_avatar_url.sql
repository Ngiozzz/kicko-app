-- Google (and other OAuth providers) supply a profile photo URL in
-- raw_user_meta_data — store it so the app can show a real picture
-- instead of just an initial-letter circle. Nullable: email/password
-- signups and existing rows simply have none.

alter table public.users add column avatar_url text;

-- Google populates both `avatar_url` and `picture` with the same value
-- (confirmed empirically); other providers may only set one or the
-- other, so read both defensively.
create or replace function public.handle_new_auth_user()
returns trigger as $$
declare
  requested_role text := coalesce(new.raw_user_meta_data->>'role', 'player');
  safe_role text := case when requested_role in ('player', 'owner') then requested_role else 'player' end;
begin
  insert into public.users (id, role, name, email, phone, avatar_url)
  values (
    new.id,
    safe_role,
    coalesce(new.raw_user_meta_data->>'name', ''),
    new.email,
    new.raw_user_meta_data->>'phone',
    coalesce(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture')
  );
  return new;
end;
$$ language plpgsql security definer set search_path = public;
