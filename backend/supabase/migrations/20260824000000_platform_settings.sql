-- Singleton, admin-editable table for payment/policy business rules that
-- used to be hardcoded constants (service fee tiers, refund tiers, match
-- session timing windows). Defaults below match those old hardcoded values
-- exactly, so applying this migration changes nothing until an admin edits
-- a setting via PATCH /api/settings.
create table public.platform_settings (
  id boolean primary key default true check (id), -- singleton-row trick: exactly one row, ever
  service_fee_tiers jsonb not null default '[
    {"max":99.99,"fee":10},{"max":999.99,"fee":20},{"max":1999.99,"fee":50},{"max":null,"fee":100}
  ]'::jsonb,
  refund_tiers jsonb not null default '[
    {"min_hours":24,"pct":100},{"min_hours":12,"pct":90},{"min_hours":6,"pct":80},{"min_hours":2,"pct":75},{"min_hours":0,"pct":70}
  ]'::jsonb,
  walk_in_refund_pct numeric(5,2) not null default 100,
  session_join_window_minutes int not null default 15,
  session_pay_window_minutes int not null default 5,
  session_decision_grace_minutes int not null default 10,
  session_max_per_side int not null default 40,
  updated_at timestamptz not null default now(),
  updated_by uuid references public.users(id)
);

insert into public.platform_settings (id) values (true);

create trigger platform_settings_set_updated_at
  before update on public.platform_settings
  for each row execute function public.set_updated_at();

-- Same posture as every other table: RLS enabled with no policies yet,
-- access goes through the backend's service-role client.
alter table public.platform_settings enable row level security;
