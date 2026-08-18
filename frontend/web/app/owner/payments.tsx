import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { colors, fonts, radius } from '@kicko/shared';
import { bookingsApi, Booking } from '../../src/lib/bookingsApi';

type Filter = 'all' | 'attention' | 'payout' | 'refund';
const TABS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'attention', label: 'Needs attention' },
  { key: 'payout', label: 'Payouts' },
  { key: 'refund', label: 'Refunds' },
];

const COLUMNS = ['Venue', 'Date', 'Player', 'Amount', 'Service fee', 'Payout', 'Refund'];

function matchesFilter(b: Booking, filter: Filter) {
  const payout = b.payouts?.[0];
  const refund = b.refunds?.[0];
  if (filter === 'all') return true;
  if (filter === 'attention') return payout?.status === 'failed' || refund?.status === 'pending';
  if (filter === 'payout') return Boolean(payout);
  if (filter === 'refund') return Boolean(refund);
  return true;
}

export default function OwnerPayments() {
  const [filter, setFilter] = useState<Filter>('all');
  const [bookings, setBookings] = useState<Booking[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const { bookings } = await bookingsApi.venue();
      setBookings(bookings.filter((b) => b.payment_status !== 'unpaid'));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load payments.');
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const filtered = bookings?.filter((b) => matchesFilter(b, filter)) ?? [];

  return (
    <View>
      <View style={styles.headRow}>
        <View>
          <Text style={styles.title}>Payments</Text>
          <Text style={styles.subtitle}>Every booking payment, payout, and refund across the venues you own.</Text>
        </View>
        <View style={styles.tabs}>
          {TABS.map((tab) => (
            <Pressable key={tab.key} onPress={() => setFilter(tab.key)} style={[styles.tab, filter === tab.key && styles.tabActive]}>
              <Text style={[styles.tabText, filter === tab.key && styles.tabTextActive]}>{tab.label}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.tablePanel}>
        <View style={styles.tableHeadRow}>
          {COLUMNS.map((c) => (
            <Text key={c} style={styles.tableHeadCell}>
              {c}
            </Text>
          ))}
        </View>

        {bookings === null && !error && (
          <View style={styles.loadingRow}>
            <ActivityIndicator color={colors.accent} />
          </View>
        )}
        {error && <Text style={styles.error}>{error}</Text>}
        {bookings && filtered.length === 0 && (
          <View style={styles.emptyRow}>
            <Text style={styles.emptyText}>No transactions match this filter.</Text>
          </View>
        )}

        {filtered.map((b) => {
          const payout = b.payouts?.[0];
          const refund = b.refunds?.[0];
          return (
            <View key={b.id} style={styles.tableRow}>
              <Text style={styles.cell}>{b.venue.name}</Text>
              <Text style={styles.cell}>{new Date(b.start_at).toLocaleDateString('en-KE', { day: 'numeric', month: 'short' })}</Text>
              <Text style={styles.cell}>{b.player?.name ?? '—'}</Text>
              <Text style={styles.cell}>KES {b.total_amount.toLocaleString()}</Text>
              <Text style={styles.cell}>KES {b.service_fee.toLocaleString()}</Text>
              <Text style={[styles.cell, payout?.status === 'failed' && styles.cellBad, payout?.status === 'paid' && styles.cellGood]}>
                {payout ? `KES ${payout.amount.toLocaleString()} · ${payout.status}` : '—'}
              </Text>
              <Text style={[styles.cell, refund && styles.cellBad]}>{refund ? `KES ${refund.amount.toLocaleString()} · ${refund.pct}%` : '—'}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16, marginBottom: 8 },
  title: { fontFamily: fonts.serif, fontSize: 26, color: colors.text, marginBottom: 4 },
  subtitle: { fontFamily: fonts.sans, fontSize: 13.5, color: colors.textSoft, maxWidth: 480 },

  tabs: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tab: { paddingVertical: 9, paddingHorizontal: 16, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  tabActive: { backgroundColor: colors.accent, borderColor: 'transparent' },
  tabText: { fontFamily: fonts.sansSemiBold, fontSize: 13, color: colors.textSoft },
  tabTextActive: { color: colors.accentText },

  tablePanel: { marginTop: 22, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, padding: 22 },
  tableHeadRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: colors.border, paddingBottom: 12, gap: 16 },
  tableHeadCell: { flex: 1, fontFamily: fonts.sansSemiBold, fontSize: 11.5, textTransform: 'uppercase', letterSpacing: 0.5, color: colors.textSoft },

  tableRow: { flexDirection: 'row', gap: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.border },
  cell: { flex: 1, fontFamily: fonts.sans, fontSize: 13, color: colors.text },
  cellGood: { color: colors.accent },
  cellBad: { color: colors.danger },

  loadingRow: { paddingVertical: 30, alignItems: 'center' },
  error: { fontFamily: fonts.sans, fontSize: 13, color: colors.danger, paddingVertical: 20 },
  emptyRow: { paddingVertical: 30 },
  emptyText: { fontFamily: fonts.sans, fontSize: 13, color: colors.textSoft, textAlign: 'center' },
});
