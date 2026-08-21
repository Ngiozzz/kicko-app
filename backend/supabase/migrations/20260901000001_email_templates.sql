-- Admin-editable transactional email copy — subject/body used to be
-- hardcoded functions in email.service.ts. {{placeholder}} tokens get
-- substituted at send time (see sendTemplatedEmail). Deliberately starts
-- empty, not seeded with the current copy: a row existing here means an
-- admin has customized that template, which the settings UI shows as
-- "Edited" vs "Default" — seeding it would make every template look
-- customized on day one. Every key's un-customized copy lives in
-- FALLBACK_TEMPLATES in code and is used whenever a row is missing (never
-- edited, or deleted via "reset to default"), so a bad edit can never
-- break sending outright.
create table public.email_templates (
  key text primary key,
  subject text not null,
  html text not null,
  updated_at timestamptz not null default now()
);

create trigger email_templates_set_updated_at
  before update on public.email_templates
  for each row execute function public.set_updated_at();

-- Same posture as every other table: RLS enabled with no policies yet,
-- access goes through the backend's service-role client.
alter table public.email_templates enable row level security;
