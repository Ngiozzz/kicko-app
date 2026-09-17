import { useEffect, useState } from 'react';
import { router } from 'expo-router';
import { apiFetch, supabase } from '@kicko/shared';
import { resolveHomeRoute } from './roleRoute';
import { isSessionStale, markActivity } from './sessionActivity';

type Role = 'player' | 'owner' | 'manager' | 'admin' | 'ceo';

// Admin and ceo share the same dedicated sign-in page (neither self-
// registers, see app/admin.tsx) — everyone else shares /sign-in with a
// ?role= param.
const SIGN_IN_HREF: Record<Role, string> = {
  player: '/sign-in?role=player',
  owner: '/sign-in?role=owner',
  manager: '/sign-in?role=manager',
  admin: '/admin',
  ceo: '/admin',
};

/**
 * Auth/role gate shared by every /player, /owner, /manager, and
 * /admin-dashboard layout — was four copies of the identical check before
 * this. Bounces an unauthenticated visitor to the right sign-in page, a
 * signed-in-but-wrong-role visitor to their own home, and now also a
 * signed-in-but-stale-session visitor (app reopened after sitting closed
 * past INACTIVITY_TIMEOUT_MS) — that last case forces a real sign-out
 * instead of silently trusting Supabase's own indefinitely-lived session.
 *
 * `expectedRole` takes an array when more than one role shares a layout —
 * e.g. admin-dashboard, where 'ceo' is a full admin-equivalent account
 * under a different label (see admin.controller.ts#requireAdmin).
 */
export function useRoleGate(expectedRole: Role | Role[]) {
  const [status, setStatus] = useState<'checking' | 'ready'>('checking');
  const [name, setName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [role, setRole] = useState<Role | null>(null);

  const allowedRoles = Array.isArray(expectedRole) ? expectedRole : [expectedRole];
  const signInHref = SIGN_IN_HREF[allowedRoles[0]];

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (isSessionStale()) {
        await supabase.auth.signOut();
        if (!cancelled) router.replace(signInHref);
        return;
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        router.replace(signInHref);
        return;
      }
      try {
        const { user } = await apiFetch<{ user: { role: string; name: string; avatar_url: string | null } }>(
          '/api/account/me'
        );
        if (cancelled) return;
        if (!allowedRoles.includes(user.role as Role)) {
          router.replace(resolveHomeRoute(user.role));
          return;
        }
        markActivity();
        setName(user.name);
        setAvatarUrl(user.avatar_url);
        setRole(user.role as Role);
        setStatus('ready');
      } catch {
        if (!cancelled) router.replace(signInHref);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allowedRoles.join(','), signInHref]);

  return { status, name, avatarUrl, role };
}
