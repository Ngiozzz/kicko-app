import { ActivityIndicator, View } from 'react-native';
import { Slot } from 'expo-router';
import { colors } from '@kicko/shared';
import { useRoleGate } from '../../src/lib/useRoleGate';
import { ManagerShell } from '../../src/components/manager/ManagerShell';

// Auth/role gate for every /manager/* screen — see useRoleGate for the
// shared checks (auth, role, session-inactivity timeout). Managers never
// self-register (see owner/managers.tsx), so an unauthenticated visitor
// bounces to the manager sign-in page specifically, not the generic one.
export default function ManagerLayout() {
  const { status, name, avatarUrl } = useRoleGate('manager');

  if (status === 'checking') {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  return (
    <ManagerShell userName={name} avatarUrl={avatarUrl}>
      <Slot />
    </ManagerShell>
  );
}

const styles = {
  center: { flex: 1, alignItems: 'center' as const, justifyContent: 'center' as const, backgroundColor: colors.bg },
};
