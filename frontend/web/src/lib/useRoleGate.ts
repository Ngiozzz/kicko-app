import { useEffect, useState } from 'react';
import { router } from 'expo-router';
import { apiFetch, supabase } from '@kicko/shared';
import { resolveHomeRoute } from './roleRoute';
import { isSessionStale, markActivity } from './sessionActivity';

type Role = 'player' | 'owner' | 'manager' | 'admin';

// Admin has its own dedicated sign-in page (never self-registers, see
// app/admin.tsx) — everyone else shares /sign-in with a ?role= param.
const SIGN_IN_HREF: Record<Role, string> = {
  player: '/sign-in?role=player',
  owner: '/sign-in?role=owner',
  manager: '/sign-in?role=manager',
  admin: '/admin',
};

/**
 * Auth/role gate shared by every /player, /owner, /manager, and
 * /admin-dashboard layout — was four copies of the identical check before
 * this. Bounces an unauthenticated visitor to the right sign-in page, a
 * signed-in-but-wrong-role visitor to their own home, and now also a
 * signed-in-but-stale-session visitor (app reopened after sitting closed
 * past INACTIVITY_TIMEOUT_MS) — that last case forces a real sign-out
 * instead of silently trusting Supabase's own indefinitely-lived session.
 */
export function useRoleGate(expectedRole: Role) {
  const [status, setStatus] = useState<'checking' | 'ready'>('checking');
  const [name, setName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (isSessionStale()) {
        await supabase.auth.signOut();
        if (!cancelled) router.replace(SIGN_IN_HREF[expectedRole]);
        return;
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        router.replace(SIGN_IN_HREF[expectedRole]);
        return;
      }
      try {
        const { user } = await apiFetch<{ user: { role: string; name: string; avatar_url: string | null } }>(
          '/api/account/me'
        );
        if (cancelled) return;
        if (user.role !== expectedRole) {
          router.replace(resolveHomeRoute(user.role));
          return;
        }
        markActivity();
        setName(user.name);
        setAvatarUrl(user.avatar_url);
        setStatus('ready');
      } catch {
        if (!cancelled) router.replace(SIGN_IN_HREF[expectedRole]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [expectedRole]);

  return { status, name, avatarUrl };
}
