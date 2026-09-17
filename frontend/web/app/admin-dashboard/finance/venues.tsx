import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Link, useFocusEffect } from 'expo-router';
import { colors, fonts, radius } from '@kicko/shared';
import { adminApi, VenueFinance } from '../../../src/lib/adminApi';
import { useAdminRole } from '../../../src/lib/adminRoleContext';

function kes(amount: number): string {
  return `KES ${amount.toLocaleString('en-KE', { maximumFractionDigits: 0 })}`;
}

function CeoOnlyNotice() {
  return (
    <View style={styles.notice}>
      <Text style={styles.noticeTitle}>CEO access only</Text>
      <Text style={styles.noticeBody}>This page shows Kicko's own revenue and profit — only a CEO account can view it.</Text>
    </View>
  );
}

export default function FinanceByVenue() {
  const role = useAdminRole();
  const [venues, setVenues] = useState<VenueFinance[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const { venues } = await adminApi.financeByVenue();
      setVenues(venues);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load the venue breakdown.');
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (role === 'ceo') load();
    }, [role, load])
  );

  if (role !== 'ceo') return <CeoOnlyNotice />;

  return (
    <View>
      <Text style={styles.title}>Revenue by venue</Text>
      <Text style={styles.subtitle}>Every venue with a paid booking, ranked by the platform profit it's driven — highest first.</Text>

      <View style={styles.tablePanel}>
        <View style={styles.tableHeadRow}>
          <Text style={[styles.tableHeadCell, { flex: 2 }]}>Venue</Text>
          <Text style={styles.tableHeadCell}>Bookings</Text>
          <Text style={styles.tableHeadCell}>Revenue</Text>
          <Text style={styles.tableHeadCell}>Profit</Text>
        </View>

        {venues === null && !error && (
          <View style={styles.loadingRow}>
            <ActivityIndicator color={colors.accent} />
          </View>
        )}
        {error && <Text style={styles.error}>{error}</Text>}
        {venues && venues.length === 0 && (
          <View style={styles.emptyRow}>
            <Text style={styles.emptyText}>No paid bookings yet — nothing to rank.</Text>
          </View>
        )}

        {venues?.map((v) => (
          <Link key={v.venueId} href={`/admin-dashboard/venues/${v.venueId}`} asChild>
            <Pressable style={styles.tableRow}>
              <Text style={[styles.cell, styles.cellVenue, { flex: 2 }]}>{v.venueName}</Text>
              <Text style={styles.cell}>{v.bookings}</Text>
              <Text style={styles.cell}>{kes(v.totalRevenue)}</Text>
              <Text style={[styles.cell, styles.cellProfit]}>{kes(v.platformProfit)}</Text>
            </Pressable>
          </Link>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  title: { fontFamily: fonts.serif, fontSize: 26, color: colors.text, marginBottom: 4 },
  subtitle: { fontFamily: fonts.sans, fontSize: 13.5, color: colors.textSoft, maxWidth: 640 },

  tablePanel: { marginTop: 22, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, padding: 22 },
  tableHeadRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: colors.border, paddingBottom: 12, gap: 16 },
  tableHeadCell: { flex: 1, fontFamily: fonts.sansSemiBold, fontSize: 11.5, textTransform: 'uppercase', letterSpacing: 0.5, color: colors.textSoft },

  tableRow: { flexDirection: 'row', gap: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.border },
  cell: { flex: 1, fontFamily: fonts.sans, fontSize: 13, color: colors.text },
  cellVenue: { fontFamily: fonts.sansSemiBold },
  cellProfit: { color: colors.accent, fontFamily: fonts.sansSemiBold },

  loadingRow: { paddingVertical: 30, alignItems: 'center' },
  error: { fontFamily: fonts.sans, fontSize: 13, color: colors.danger, paddingVertical: 20 },
  emptyRow: { paddingVertical: 30 },
  emptyText: { fontFamily: fonts.sans, fontSize: 13, color: colors.textSoft, textAlign: 'center' },

  notice: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, padding: 28, marginTop: 22, maxWidth: 480 },
  noticeTitle: { fontFamily: fonts.serifMedium, fontSize: 17, color: colors.text, marginBottom: 8 },
  noticeBody: { fontFamily: fonts.sans, fontSize: 13.5, color: colors.textSoft, lineHeight: 20 },
});
