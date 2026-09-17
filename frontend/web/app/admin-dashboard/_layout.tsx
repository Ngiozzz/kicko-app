import { ActivityIndicator, View } from 'react-native';
import { Slot } from 'expo-router';
import { colors } from '@kicko/shared';
import { useRoleGate } from '../../src/lib/useRoleGate';
import { AdminShell } from '../../src/components/admin/AdminShell';

// Auth/role gate for every /admin-dashboard/* screen — see useRoleGate for
// the shared checks (auth, role, session-inactivity timeout). Unauthenticated
// visitors bounce to the dedicated admin sign-in page (not the public
// /sign-in — admins never self-register, see app/admin.tsx). 'ceo' is a
// full admin-equivalent account under a different label, so it shares this
// entire layout.
export default function AdminLayout() {
  const { status, name, avatarUrl, role } = useRoleGate(['admin', 'ceo']);

  if (status === 'checking') {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  return (
    <AdminShell userName={name} avatarUrl={avatarUrl} roleLabel={role === 'ceo' ? 'CEO' : 'Admin'}>
      <Slot />
    </AdminShell>
  );
}

const styles = {
  center: { flex: 1, alignItems: 'center' as const, justifyContent: 'center' as const, backgroundColor: colors.bg },
};
