-- The signup trigger previously trusted whatever role a client passed in
-- auth.signUp's options.data — but options.data is fully client-controlled,
-- and the anon key is public. Anyone could call supabase.auth.signUp
-- directly (bypassing the sign-up page's role picker entirely) with
-- { data: { role: 'admin' } } and get an admin account. Player/owner are
-- the only two self-service roles by design (see sign-up.tsx) — managers
-- are added by an owner, admins are provisioned by hand directly against
-- public.users (service-role, never client-triggered). Anything else
-- requested at signup now silently falls back to 'player'.

create or replace function public.handle_new_auth_user()
returns trigger as $$
declare
  requested_role text := coalesce(new.raw_user_meta_data->>'role', 'player');
  safe_role text := case when requested_role in ('player', 'owner') then requested_role else 'player' end;
begin
  insert into public.users (id, role, name, email, phone)
  values (
    new.id,
    safe_role,
    coalesce(new.raw_user_meta_data->>'name', ''),
    new.email,
    new.raw_user_meta_data->>'phone'
  );
  return new;
end;
$$ language plpgsql security definer set search_path = public;
