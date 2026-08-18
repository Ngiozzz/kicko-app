// Supabase's own session persists (and silently auto-refreshes) forever by
// default — reopening the app after it's been closed for hours still drops
// you straight into whatever page you last had open, no re-auth at all.
// This layers an inactivity timeout on top: every role gate (useRoleGate)
// checks isSessionStale() before trusting the session, and the root layout
// calls markActivity() on real user interaction so the clock only advances
// during genuine use — not merely because a tab sat open in the background.
//
// localStorage (not sessionStorage) is deliberate: activity in any tab of
// the same browser should count as "the person is here," so multiple tabs
// share one clock instead of each tracking its own.

const LAST_ACTIVITY_KEY = 'kicko:lastActivityAt';
export const INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes — adjust here if that's too strict/loose.

// In-memory, not persisted — just avoids hammering localStorage on every
// keystroke/scroll tick. Resets on reload, so the first call after a fresh
// page load always writes immediately, which is what we want.
const MIN_WRITE_INTERVAL_MS = 5_000;
let lastWriteAt = 0;

export function markActivity(): void {
  if (typeof window === 'undefined') return;
  const now = Date.now();
  if (now - lastWriteAt < MIN_WRITE_INTERVAL_MS) return;
  lastWriteAt = now;
  try {
    window.localStorage.setItem(LAST_ACTIVITY_KEY, String(now));
  } catch {
    // Storage unavailable (private browsing, quota, etc.) — fail open rather
    // than break sign-in over a non-essential feature.
  }
}

/** True once the recorded last activity is older than the timeout. Never true on a device's first-ever visit (nothing recorded yet). */
export function isSessionStale(): boolean {
  if (typeof window === 'undefined') return false;
  let raw: string | null;
  try {
    raw = window.localStorage.getItem(LAST_ACTIVITY_KEY);
  } catch {
    return false;
  }
  if (!raw) return false;
  const last = Number(raw);
  if (!Number.isFinite(last)) return false;
  return Date.now() - last > INACTIVITY_TIMEOUT_MS;
}
