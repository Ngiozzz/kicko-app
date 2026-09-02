-- Lets an admin-uploaded template skip Kicko's shared banner/footer
-- wrapper (see wrapper() in email.service.ts) and render its own HTML
-- as-is, for a fully custom self-contained design instead of one meant
-- to sit inside Kicko's standard frame. Defaults true so every existing
-- customized template keeps rendering exactly as it does today.
alter table public.email_templates add column use_wrapper boolean not null default true;
