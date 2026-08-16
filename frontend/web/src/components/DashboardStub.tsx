import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { apiFetch, colors, fonts, radius, supabase } from '@kicko/shared';
import { resolveHomeRoute } from '../lib/roleRoute';

type Role = 'player' | 'owner' | 'manager' | 'admin';

// Placeholder landing spot for each role until the real dashboards exist.
// Still does the real thing a dashboard route should do: bounce
// unauthenticated visitors to sign-in, and bounce authenticated ones
// whose actual role doesn't match this route to the one that does.
export function DashboardStub({ expectedRole, label }: { expectedRole: Role; label: string }) {
  const [status, setStatus] = useState<'checking' | 'ready'>('checking');
  const [name, setName] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        router.replace('/sign-in');
        return;
      }
      try {
        const { user } = await apiFetch<{ user: { role: string; name: string } }>('/api/account/me');
        if (cancelled) return;
        if (user.role !== expectedRole) {
          router.replace(resolveHomeRoute(user.role));
          return;
        }
        setName(user.name);
        setStatus('ready');
      } catch {
        if (!cancelled) router.replace('/sign-in');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [expectedRole]);

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.replace('/sign-in');
  }

  if (status === 'checking') {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  return (
    <View style={styles.center}>
      <Text style={styles.eyebrow}>{label}</Text>
      <Text style={styles.title}>Welcome back{name ? `, ${name}` : ''}.</Text>
      <Text style={styles.subtitle}>This is a placeholder — the real {label.toLowerCase()} is the next build.</Text>
      <Pressable style={styles.signOutBtn} onPress={handleSignOut}>
        <Text style={styles.signOutText}>Sign out</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg, padding: 24 },
  eyebrow: {
    fontFamily: fonts.sansBold,
    fontSize: 12,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: colors.accent,
    marginBottom: 10,
  },
  title: { fontFamily: fonts.serif, fontSize: 30, color: colors.text, marginBottom: 10, textAlign: 'center' },
  subtitle: {
    fontFamily: fonts.sans,
    fontSize: 14,
    color: colors.textSoft,
    marginBottom: 28,
    textAlign: 'center',
    maxWidth: 380,
  },
  signOutBtn: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  signOutText: { fontFamily: fonts.sansBold, fontSize: 14, color: colors.text },
});
