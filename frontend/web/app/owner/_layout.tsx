import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Slot, router } from 'expo-router';
import { apiFetch, colors, supabase } from '@kicko/shared';
import { resolveHomeRoute } from '../../src/lib/roleRoute';
import { OwnerShell } from '../../src/components/owner/OwnerShell';

// Auth/role gate for every /owner/* screen, done once here instead of
// per-page — same checks DashboardStub does for the single-page roles
// (player/manager/admin), just centralized since owner now has several
// screens sharing one sidebar shell.
export default function OwnerLayout() {
  const [status, setStatus] = useState<'checking' | 'ready'>('checking');
  const [name, setName] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        router.replace('/sign-in?role=owner');
        return;
      }
      try {
        const { user } = await apiFetch<{ user: { role: string; name: string } }>('/api/account/me');
        if (cancelled) return;
        if (user.role !== 'owner') {
          router.replace(resolveHomeRoute(user.role));
          return;
        }
        setName(user.name);
        setStatus('ready');
      } catch {
        if (!cancelled) router.replace('/sign-in?role=owner');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (status === 'checking') {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  return (
    <OwnerShell userName={name}>
      <Slot />
    </OwnerShell>
  );
}

const styles = {
  center: { flex: 1, alignItems: 'center' as const, justifyContent: 'center' as const, backgroundColor: colors.bg },
};
