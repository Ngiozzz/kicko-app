import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { router } from 'expo-router';
import { colors } from '@kicko/shared';

// Tournaments is hidden from production while it's still an MVP (see
// backend/src/routes/tournaments.routes.ts's TOURNAMENTS_ENABLED gate) —
// this stops direct navigation to /player/tournaments/* even though the
// pages underneath are still fully intact. Delete this file (and flip
// TOURNAMENTS_ENABLED back to true) to bring the section back.
export default function PlayerTournamentsLayout() {
  useEffect(() => {
    router.replace('/player');
  }, []);

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator color={colors.accent} />
    </View>
  );
}
