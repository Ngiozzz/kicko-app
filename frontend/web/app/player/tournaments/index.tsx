import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Link, useFocusEffect } from 'expo-router';
import { colors, fonts, radius } from '@kicko/shared';
import { tournamentsApi, Tournament } from '../../../src/lib/tournamentsApi';
import { SportIcon, Sport } from '../../../src/components/SportIcon';

export default function PlayerTournaments() {
  const [tournaments, setTournaments] = useState<Tournament[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const { tournaments } = await tournamentsApi.open();
      setTournaments(tournaments);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load tournaments.');
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  return (
    <View>
      <View style={styles.headRow}>
        <Text style={styles.title}>Tournaments</Text>
        <Text style={styles.subtitle}>Team competitions currently open for registration — pick one and enter your squad.</Text>
      </View>

      {tournaments === null && !error && (
        <View style={styles.loading}>
          <ActivityIndicator color={colors.accent} />
        </View>
      )}
      {error && <Text style={styles.error}>{error}</Text>}
      {tournaments && tournaments.length === 0 && <Text style={styles.emptyText}>No tournaments are open for registration right now.</Text>}

      {tournaments?.map((t) => (
        <Link key={t.id} href={`/player/tournaments/${t.id}`} asChild>
          <Pressable style={styles.row}>
            <View style={styles.rowInfo}>
              <View style={styles.thumb}>
                <SportIcon sport={t.venue.sport as Sport} size={22} />
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={styles.rowTitle}>{t.name}</Text>
                <Text style={styles.rowMeta}>
                  {t.venue.name} · {new Date(t.start_at).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' })}
                </Text>
              </View>
            </View>
            <Text style={styles.rowPrice}>KES {t.entry_fee.toLocaleString()} entry</Text>
          </Pressable>
        </Link>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  headRow: { marginBottom: 24 },
  title: { fontFamily: fonts.serif, fontSize: 26, color: colors.text, marginBottom: 6 },
  subtitle: { fontFamily: fonts.sans, fontSize: 14, color: colors.textSoft, maxWidth: 520, lineHeight: 20 },

  loading: { paddingVertical: 60, alignItems: 'center' },
  error: { fontFamily: fonts.sans, fontSize: 13, color: colors.danger, marginBottom: 12 },
  emptyText: { fontFamily: fonts.sans, fontSize: 13.5, color: colors.textSoft },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 14,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: 16,
    marginBottom: 12,
  },
  rowInfo: { flexDirection: 'row', alignItems: 'center', gap: 14, flex: 1, minWidth: 0 },
  thumb: { width: 44, height: 44, borderRadius: 12, backgroundColor: colors.surface2, alignItems: 'center', justifyContent: 'center' },
  rowTitle: { fontFamily: fonts.sansSemiBold, fontSize: 14.5, color: colors.text },
  rowMeta: { fontFamily: fonts.sans, fontSize: 12.5, color: colors.textSoft, marginTop: 2 },
  rowPrice: { fontFamily: fonts.sansBold, fontSize: 13, color: colors.accent },
});
