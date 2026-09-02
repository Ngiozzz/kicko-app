-- Lets a solo (individual) booking record a game type too, same free-text
-- convention as match_sessions.format (e.g. rugby's "Sevens" / "Union 15s" /
-- "Touch") — purely descriptive, doesn't affect capacity or payment.
alter table public.bookings add column format text;
