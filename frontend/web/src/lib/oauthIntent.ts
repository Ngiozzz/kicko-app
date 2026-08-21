// Google's OAuth redirect leaves the browser entirely (to Google, then to
// Supabase, then back) so React state can't survive the round trip — but
// sessionStorage does, since it's scoped to origin+tab, not cleared by
// cross-origin navigation. Used to carry which page (?role=player vs
// ?role=owner) a "Continue with Google" click started from, and the
// booking-flow `next` target, through to /auth/callback.

const ROLE_KEY = 'kicko_oauth_role';
const NEXT_KEY = 'kicko_oauth_next';

export type OAuthRole = 'player' | 'owner';

export function stashOAuthIntent({ role, next }: { role: OAuthRole; next?: string }) {
  try {
    sessionStorage.setItem(ROLE_KEY, role);
    if (next) sessionStorage.setItem(NEXT_KEY, next);
    else sessionStorage.removeItem(NEXT_KEY);
  } catch {
    // Storage unavailable (private browsing, disabled, etc.) — the
    // callback route just falls back to the account's real role, which is
    // always correct for a returning user and merely misses the
    // tab-role match for a brand-new signup's edge case.
  }
}

export function readAndClearOAuthIntent(): { role: OAuthRole | null; next: string | undefined } {
  try {
    const role = sessionStorage.getItem(ROLE_KEY) as OAuthRole | null;
    const next = sessionStorage.getItem(NEXT_KEY) ?? undefined;
    sessionStorage.removeItem(ROLE_KEY);
    sessionStorage.removeItem(NEXT_KEY);
    return { role, next };
  } catch {
    return { role: null, next: undefined };
  }
}
