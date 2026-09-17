-- Backstops the app-level "CEO accounts are undeletable" rule (see
-- admin.controller.ts#deleteAdmin, commit e9ccb97) at the database level
-- too, so it holds even against a delete issued outside the app entirely
-- — e.g. from the Supabase dashboard's Authentication tab or Table
-- Editor, both of which use the service role and bypass application
-- code/RLS.
--
-- Two triggers, not one: deleting a row from auth.users cascades to
-- public.users (see 20260816000000_init.sql's `on delete cascade` on
-- public.users.id), but not the other way around — deleting the
-- public.users row alone leaves auth.users untouched. Each table needs
-- its own guard to be covered either way.
--
-- Written idempotent (create or replace / drop ... if exists) — see
-- 20260918000000_ceo_role.sql's note on why every migration here is.

create or replace function public.prevent_ceo_deletion_auth()
returns trigger as $$
begin
  if exists (select 1 from public.users where id = old.id and role = 'ceo') then
    raise exception 'CEO accounts cannot be deleted.';
  end if;
  return old;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists prevent_ceo_deletion_auth on auth.users;
create trigger prevent_ceo_deletion_auth
before delete on auth.users
for each row execute function public.prevent_ceo_deletion_auth();

create or replace function public.prevent_ceo_deletion_public()
returns trigger as $$
begin
  if old.role = 'ceo' then
    raise exception 'CEO accounts cannot be deleted.';
  end if;
  return old;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists prevent_ceo_deletion_public on public.users;
create trigger prevent_ceo_deletion_public
before delete on public.users
for each row execute function public.prevent_ceo_deletion_public();
