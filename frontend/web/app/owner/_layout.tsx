import { ActivityIndicator, View } from 'react-native';
import { Slot } from 'expo-router';
import { colors } from '@kicko/shared';
import { useRoleGate } from '../../src/lib/useRoleGate';
import { OwnerShell } from '../../src/components/owner/OwnerShell';

// Auth/role gate for every /owner/* screen, done once here instead of
// per-page — see useRoleGate for the shared checks (auth, role, and
// session-inactivity timeout) every role layout applies.
export default function OwnerLayout() {
  const { status, name, avatarUrl } = useRoleGate('owner');

  if (status === 'checking') {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  return (
    <OwnerShell userName={name} avatarUrl={avatarUrl}>
      <Slot />
    </OwnerShell>
  );
}

const styles = {
  center: { flex: 1, alignItems: 'center' as const, justifyContent: 'center' as const, backgroundColor: colors.bg },
};
