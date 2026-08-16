-- ============================================================
-- AUTH SIGNUP -> PROFILE TRIGGER
-- Auto-creates the matching public.users profile row the instant someone
-- signs up via Supabase Auth (supabase.auth.signUp on the client — auth
-- itself stays client-side, everything else goes through the backend's
-- service-role client). Reads `name` / `phone` / `role` from the signup
-- call's options.data (raw_user_meta_data); defaults role to 'player' if
-- omitted. Mirrors Thurfa's backend/supabase/002_auth_signup_trigger.sql
-- exactly — same proven pattern, adapted to Kicko's users columns.
--
-- security definer means this runs with elevated privileges regardless of
-- RLS, so no client-side insert policy on public.users is needed — that's
-- what this migration replaces (see git history: it started out as a
-- self-service RLS policy set, before the backend/frontend split made the
-- trigger the better fit).
-- ============================================================

create or replace function public.handle_new_auth_user()
returns trigger as $$
begin
  insert into public.users (id, role, name, email, phone)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'role', 'player'),
    coalesce(new.raw_user_meta_data->>'name', ''),
    new.email,
    new.raw_user_meta_data->>'phone'
  );
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_auth_user();
