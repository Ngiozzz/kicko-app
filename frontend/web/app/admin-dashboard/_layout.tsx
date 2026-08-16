import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Slot, router } from 'expo-router';
import { apiFetch, colors, supabase } from '@kicko/shared';
import { resolveHomeRoute } from '../../src/lib/roleRoute';
import { AdminShell } from '../../src/components/admin/AdminShell';

// Auth/role gate for every /admin-dashboard/* screen — same pattern as
// app/owner/_layout.tsx. Unauthenticated visitors bounce to the dedicated
// admin sign-in page (not the public /sign-in — admins never self-register,
// see app/admin.tsx), and a signed-in non-admin bounces to their own home.
export default function AdminLayout() {
  const [status, setStatus] = useState<'checking' | 'ready'>('checking');
  const [name, setName] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        router.replace('/admin');
        return;
      }
      try {
        const { user } = await apiFetch<{ user: { role: string; name: string } }>('/api/account/me');
        if (cancelled) return;
        if (user.role !== 'admin') {
          router.replace(resolveHomeRoute(user.role));
          return;
        }
        setName(user.name);
        setStatus('ready');
      } catch {
        if (!cancelled) router.replace('/admin');
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
    <AdminShell userName={name}>
      <Slot />
    </AdminShell>
  );
}

const styles = {
  center: { flex: 1, alignItems: 'center' as const, justifyContent: 'center' as const, backgroundColor: colors.bg },
};
