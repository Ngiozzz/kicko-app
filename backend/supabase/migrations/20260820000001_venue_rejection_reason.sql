-- Lets an admin record why a venue was suspended/rejected during moderation.
alter table public.venues add column rejection_reason text;
