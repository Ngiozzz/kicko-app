-- ============================================================
-- SESSION FORMAT — purely descriptive game-type an organizer picks at
-- creation for sports played in more than one shape (rugby: sevens vs
-- union 15s vs touch). Doesn't affect capacity, payment, or roster
-- logic — session_max_per_side already comfortably covers every shape
-- (up to 40 per side). Nullable/unconstrained, same convention as
-- venues.sport and users.position: UI-driven, not a fixed universal
-- enum, so a future sport can introduce its own format values without
-- another migration.
-- ============================================================

alter table public.match_sessions
  add column format text;
