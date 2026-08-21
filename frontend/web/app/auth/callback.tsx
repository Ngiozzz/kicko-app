import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { Link, router } from 'expo-router';
import { colors, fonts, apiFetch, supabase } from '@kicko/shared';
import { AuthLayout } from '../../src/components/AuthLayout';
import { resolveNext } from '../../src/lib/roleRoute';
import { readAndClearOAuthIntent } from '../../src/lib/oauthIntent';

const BULLETS = [
  'Real-time bookings across every court you manage',
  'Clear payout tracking, no spreadsheets',
  'Add managers and staff without giving up control',
];

const TIMEOUT_MS = 7000;

function parseHashOrQueryParam(name: string): string | null {
  const fromQuery = new URLSearchParams(window.location.search).get(name);
  if (fromQuery) return fromQuery;
  // Supabase puts OAuth errors in the hash under the implicit-flow default.
  const hash = window.location.hash.startsWith('#') ? window.location.hash.slice(1) : window.location.hash;
  return new URLSearchParams(hash).get(name);
}

// Reached only via redirectTo from GoogleSignInButton's signInWithOAuth
// call. supabase-js's client picks up the session from the redirect URL
// automatically (detectSessionInUrl, on by default) — this page just
// waits for that to settle via onAuthStateChange, then claims the tab's
// role for a brand-new signup (POST /api/account/me/role) before routing
// by the account's real role, same as sign-in.tsx does.
export default function AuthCallback() {
  const [error, setError] = useState<string | null>(null);
  const handledRef = useRef(false);

  useEffect(() => {
    const oauthError = parseHashOrQueryParam('error_description') ?? parseHashOrQueryParam('error');
    if (oauthError) {
      setError(oauthError);
      return;
    }

    const timeout = setTimeout(() => {
      if (!handledRef.current) router.replace('/sign-in');
    }, TIMEOUT_MS);

    const { data: listener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (handledRef.current) return;
      if (event !== 'INITIAL_SESSION' && event !== 'SIGNED_IN') return;

      if (!session) {
        // INITIAL_SESSION with no session means there was nothing to pick
        // up from the URL — a direct/stale hit to this page, not an
        // in-progress OAuth flow.
        if (event === 'INITIAL_SESSION') {
          handledRef.current = true;
          clearTimeout(timeout);
          router.replace('/sign-in');
        }
        return;
      }

      handledRef.current = true;
      clearTimeout(timeout);

      const { role, next } = readAndClearOAuthIntent();
      if (role === 'owner') {
        try {
          await apiFetch('/api/account/me/role', { method: 'POST', body: JSON.stringify({ role: 'owner' }) });
        } catch {
          // Best-effort — if the claim fails the account just stays on
          // whatever role the signup trigger already gave it.
        }
      }

      try {
        const { user } = await apiFetch<{ user: { role: string } }>('/api/account/me');
        router.replace(resolveNext(next, user.role));
      } catch {
        router.replace('/');
      }
    });

    return () => {
      clearTimeout(timeout);
      listener.subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthLayout headline="Good to have you back." subhead="Everything you need to run your venues, in one place." bullets={BULLETS}>
      {error ? (
        <>
          <Text style={styles.title}>Sign-in didn't go through</Text>
          <Text style={styles.subtitle}>{error}</Text>
          <Link href="/sign-in" style={styles.link}>
            Back to sign in
          </Link>
        </>
      ) : (
        <>
          <Text style={styles.title}>Signing you in…</Text>
          <Text style={styles.subtitle}>One moment while we finish connecting your Google account.</Text>
        </>
      )}
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  title: { fontFamily: fonts.serif, fontSize: 27, color: colors.text, marginBottom: 6 },
  subtitle: { fontFamily: fonts.sans, fontSize: 14, color: colors.textSoft, lineHeight: 20, marginBottom: 28 },
  link: { fontFamily: fonts.sansBold, fontSize: 14, color: colors.accent },
});
