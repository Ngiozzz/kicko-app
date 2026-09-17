-- A plain admin can still provision another admin (see createAdmin), but
-- that new account now sits pending until a ceo explicitly approves it
-- (see admin.controller.ts#approveAdmin) — only a ceo's own creations
-- self-approve. Written idempotently (if not exists / re-runnable update)
-- per the lesson from 20260918000000_ceo_role.sql's CI trouble.
alter table public.users
  add column if not exists admin_approved_at timestamptz,
  add column if not exists admin_approved_by uuid references public.users(id);

-- Every admin/ceo account that already exists predates this feature and
-- is already trusted/live — backfill so this never retroactively locks
-- anyone out.
update public.users
  set admin_approved_at = created_at
  where role in ('admin', 'ceo') and admin_approved_at is null;
