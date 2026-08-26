import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Link, useFocusEffect, useRouter } from 'expo-router';
import { colors, fonts, radius } from '@kicko/shared';
import { tournamentsApi, Tournament, TournamentStatus } from '../../../src/lib/tournamentsApi';
import { SportIcon, Sport } from '../../../src/components/SportIcon';

const STATUS_LABEL: Record<TournamentStatus, string> = {
  draft: 'Draft',
  open: 'Open for registration',
  in_progress: 'In progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
};
const STATUS_TONE: Record<TournamentStatus, 'good' | 'warn' | 'bad'> = {
  draft: 'warn',
  open: 'good',
  in_progress: 'good',
  completed: 'warn',
  cancelled: 'bad',
};

export default function OwnerTournaments() {
  const router = useRouter();
  const [tournaments, setTournaments] = useState<Tournament[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const { tournaments } = await tournamentsApi.mine();
      setTournaments(tournaments);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load your tournaments.');
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
        <View>
          <Text style={styles.title}>Tournaments</Text>
          <Text style={styles.subtitle}>Run a team-based competition at one of your venues — registration, entry fees, and fixtures.</Text>
        </View>
        <Pressable style={styles.newBtn} onPress={() => router.push('/owner/tournaments/new')}>
          <Text style={styles.newBtnText}>+ New tournament</Text>
        </Pressable>
      </View>

      {tournaments === null && !error && (
        <View style={styles.loading}>
          <ActivityIndicator color={colors.accent} />
        </View>
      )}
      {error && <Text style={styles.error}>{error}</Text>}
      {tournaments && tournaments.length === 0 && (
        <View style={styles.emptyState}>
          <View style={styles.emptyIconRing}>
            <Text style={styles.emptyIcon}>🏆</Text>
          </View>
          <Text style={styles.emptyTitle}>No tournaments yet</Text>
          <Text style={styles.emptyBody}>Create one at a verified venue — teams register and pay their entry fee, you add fixtures as the day runs.</Text>
        </View>
      )}

      {tournaments?.map((t) => (
        <Link key={t.id} href={`/owner/tournaments/${t.id}`} asChild>
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
            <Text style={[styles.badge, styles[`badge_${STATUS_TONE[t.status]}`]]}>{STATUS_LABEL[t.status]}</Text>
          </Pressable>
        </Link>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  headRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap', marginBottom: 24 },
  title: { fontFamily: fonts.serif, fontSize: 26, color: colors.text, marginBottom: 6 },
  subtitle: { fontFamily: fonts.sans, fontSize: 14, color: colors.textSoft, maxWidth: 520, lineHeight: 20 },
  newBtn: { backgroundColor: colors.accent, borderRadius: radius.pill, paddingVertical: 11, paddingHorizontal: 18 },
  newBtnText: { fontFamily: fonts.sansBold, fontSize: 13.5, color: colors.accentText },

  loading: { paddingVertical: 60, alignItems: 'center' },
  error: { fontFamily: fonts.sans, fontSize: 13, color: colors.danger, marginBottom: 12 },

  emptyState: { alignItems: 'center', paddingVertical: 60, paddingHorizontal: 20 },
  emptyIconRing: { width: 56, height: 56, borderRadius: 28, backgroundColor: colors.surface2, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  emptyIcon: { fontSize: 24 },
  emptyTitle: { fontFamily: fonts.serifMedium, fontSize: 17, color: colors.text, marginBottom: 8 },
  emptyBody: { fontFamily: fonts.sans, fontSize: 13.5, color: colors.textSoft, textAlign: 'center', maxWidth: 420, lineHeight: 19 },

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

  badge: { fontFamily: fonts.sansSemiBold, fontSize: 11.5, paddingVertical: 6, paddingHorizontal: 12, borderRadius: radius.pill, overflow: 'hidden' },
  badge_good: { backgroundColor: colors.accentSoft, color: colors.accent },
  badge_warn: { backgroundColor: colors.surface2, color: colors.textSoft },
  badge_bad: { backgroundColor: colors.surface2, color: colors.danger },
});
