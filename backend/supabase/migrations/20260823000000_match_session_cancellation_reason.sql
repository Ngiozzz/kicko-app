-- ============================================================
-- MATCH SESSION CANCELLATION REASON
-- Session-level cancelled state previously only explained itself
-- through per-participant refunds.reason rows — fine for accounting,
-- useless for "why was my session cancelled?" on the session's own
-- cancelled screen. Stored directly on the session so that screen
-- doesn't have to reverse-engineer it from a refund record (which
-- may not even exist if nobody had paid yet).
-- ============================================================

alter table public.match_sessions
  add column cancellation_reason text;
