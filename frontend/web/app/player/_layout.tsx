import { ActivityIndicator, View } from 'react-native';
import { Slot } from 'expo-router';
import { colors } from '@kicko/shared';
import { useRoleGate } from '../../src/lib/useRoleGate';
import { PlayerShell } from '../../src/components/player/PlayerShell';

// Auth/role gate for every /player/* screen — see useRoleGate for the
// shared checks (auth, role, session-inactivity timeout).
export default function PlayerLayout() {
  const { status, name, avatarUrl } = useRoleGate('player');

  if (status === 'checking') {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  return (
    <PlayerShell userName={name} avatarUrl={avatarUrl}>
      <Slot />
    </PlayerShell>
  );
}

const styles = {
  center: { flex: 1, alignItems: 'center' as const, justifyContent: 'center' as const, backgroundColor: colors.bg },
};
