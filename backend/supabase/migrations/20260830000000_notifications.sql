-- In-app notifications — no message queue or pub/sub, just a row inserted
-- directly by whichever controller action caused it (see
-- backend/src/services/notifications.service.ts#notify), fetched on load
-- like everything else in this app. This is also the layer SMS eventually
-- hooks into once Daraja/an SMS provider exists — same trigger points, an
-- extra send-SMS call added later, not a rebuild.

create table public.notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.users(id) on delete cascade,
  type       text not null,
  title      text not null,
  body       text,
  link       text,
  read       boolean not null default false,
  created_at timestamptz not null default now()
);

create index idx_notifications_user_created on public.notifications(user_id, created_at desc);
create index idx_notifications_user_unread on public.notifications(user_id) where not read;

alter table public.notifications enable row level security;
