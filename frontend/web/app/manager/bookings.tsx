import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import { colors, fonts, radius } from '@kicko/shared';
import { bookingsApi, Booking } from '../../src/lib/bookingsApi';
import { SportIcon, Sport } from '../../src/components/SportIcon';

// Mirrors owner/bookings.tsx — same bookingsApi.venue() call, which the
// backend already scopes to just this manager's one assigned venue (see
// listVenueBookings in bookings.controller.ts), so no client-side
// filtering by venue is needed here.
type Filter = 'all' | 'pending_payment' | 'confirmed' | 'completed' | 'cancelled';
const TABS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'pending_payment', label: 'Awaiting payment' },
  { key: 'confirmed', label: 'Confirmed' },
  { key: 'completed', label: 'Completed' },
  { key: 'cancelled', label: 'Cancelled' },
];

function StatCard({ label, value, priority }: { label: string; value: string; priority?: boolean }) {
  return (
    <View style={[styles.statCard, priority && styles.statCardPriority]}>
      <Text style={[styles.statLabel, priority && styles.statLabelAccent]}>{label}</Text>
      <Text style={[styles.statValue, priority && styles.statLabelAccent]}>{value}</Text>
    </View>
  );
}

export default function ManagerBookings() {
  const { filter: filterParam } = useLocalSearchParams<{ filter?: string }>();
  const [filter, setFilter] = useState<Filter>('all');
  const [bookings, setBookings] = useState<Booking[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (TABS.some((t) => t.key === filterParam)) setFilter(filterParam as Filter);
  }, [filterParam]);

  const load = useCallback(async () => {
    try {
      const { bookings } = await bookingsApi.venue();
      setBookings(bookings);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load bookings.');
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const filtered = bookings?.filter((b) => filter === 'all' || b.status === filter) ?? [];
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const completedThisMonth = bookings?.filter((b) => b.status === 'completed' && new Date(b.start_at) >= startOfMonth).length ?? 0;

  return (
    <View>
      <View style={styles.headRow}>
        <View>
          <Text style={styles.title}>Bookings</Text>
          <Text style={styles.subtitle}>Every booking for the venue you manage.</Text>
        </View>
        <View style={styles.tabs}>
          {TABS.map((tab) => (
            <Pressable key={tab.key} onPress={() => setFilter(tab.key)} style={[styles.tab, filter === tab.key && styles.tabActive]}>
              <Text style={[styles.tabText, filter === tab.key && styles.tabTextActive]}>{tab.label}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.statsRow}>
        <StatCard label="Awaiting payment" value={String(bookings?.filter((b) => b.status === 'pending_payment').length ?? 0)} priority />
        <StatCard label="Confirmed" value={String(bookings?.filter((b) => b.status === 'confirmed').length ?? 0)} />
        <StatCard label="Completed this month" value={String(completedThisMonth)} />
        <StatCard label="Cancelled" value={String(bookings?.filter((b) => b.status === 'cancelled').length ?? 0)} />
      </View>

      {bookings === null && !error && (
        <View style={styles.loading}>
          <ActivityIndicator color={colors.accent} />
        </View>
      )}
      {error && <Text style={styles.error}>{error}</Text>}
      {bookings && filtered.length === 0 && <Text style={styles.emptyNote}>No bookings match this filter.</Text>}

      {filtered.map((b) => (
        <View key={b.id} style={styles.row}>
          <View style={styles.rowInfo}>
            <SportIcon sport={b.venue.sport as Sport} size={24} />
            <View>
              <Text style={styles.rowTitle}>{b.player?.name ?? 'Player'}</Text>
              <Text style={styles.rowMeta}>
                {new Date(b.start_at).toLocaleString('en-KE', { weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })}
              </Text>
            </View>
          </View>
          <View style={styles.rowRight}>
            <Text style={styles.rowAmount}>KES {b.subtotal.toLocaleString()}</Text>
            <Text style={styles.rowStatus}>{b.status.replace('_', ' ')}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  headRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16, marginBottom: 8 },
  title: { fontFamily: fonts.serif, fontSize: 26, color: colors.text, marginBottom: 4 },
  subtitle: { fontFamily: fonts.sans, fontSize: 13.5, color: colors.textSoft },

  tabs: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tab: { paddingVertical: 9, paddingHorizontal: 16, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  tabActive: { backgroundColor: colors.accent, borderColor: 'transparent' },
  tabText: { fontFamily: fonts.sansSemiBold, fontSize: 13, color: colors.textSoft },
  tabTextActive: { color: colors.accentText },

  statsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 18, marginTop: 22, marginBottom: 8 },
  statCard: { flexGrow: 1, flexBasis: 200, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, padding: 18 },
  statCardPriority: { borderColor: colors.accent },
  statLabel: { fontFamily: fonts.sansSemiBold, fontSize: 12.5, color: colors.textSoft, marginBottom: 10 },
  statLabelAccent: { color: colors.accent },
  statValue: { fontFamily: fonts.serif, fontSize: 24, color: colors.text },

  loading: { paddingVertical: 40, alignItems: 'center' },
  error: { fontFamily: fonts.sans, fontSize: 13, color: colors.danger, marginBottom: 16 },
  emptyNote: { fontFamily: fonts.sans, fontSize: 13, color: colors.textSoft, textAlign: 'center', paddingVertical: 30 },

  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 16,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: 16,
    marginTop: 22,
  },
  rowInfo: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  rowTitle: { fontFamily: fonts.sansSemiBold, fontSize: 14, color: colors.text },
  rowMeta: { fontFamily: fonts.sans, fontSize: 12.5, color: colors.textSoft, marginTop: 2, textTransform: 'capitalize' },
  rowRight: { alignItems: 'flex-end' },
  rowAmount: { fontFamily: fonts.sansBold, fontSize: 13, color: colors.accent },
  rowStatus: { fontFamily: fonts.sans, fontSize: 11.5, color: colors.textSoft, marginTop: 2, textTransform: 'capitalize' },
});
