import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Link, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { colors, fonts, radius } from '@kicko/shared';
import { adminApi, AdminVenue } from '../../../src/lib/adminApi';
import { SportIcon, Sport } from '../../../src/components/SportIcon';

type Filter = 'all' | 'pending' | 'verified' | 'suspended';
const TABS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending review' },
  { key: 'verified', label: 'Verified' },
  { key: 'suspended', label: 'Suspended' },
];

const STATUS_LABEL: Record<AdminVenue['status'], string> = {
  pending: 'Pending review',
  verified: 'Verified',
  suspended: 'Suspended',
};

export default function AdminVenues() {
  const { status: statusParam } = useLocalSearchParams<{ status?: string }>();
  const [venues, setVenues] = useState<AdminVenue[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>('all');

  useEffect(() => {
    if (statusParam === 'pending' || statusParam === 'verified' || statusParam === 'suspended') {
      setFilter(statusParam);
    }
  }, [statusParam]);

  const load = useCallback(async () => {
    try {
      const { venues } = await adminApi.listVenues();
      setVenues(venues);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load venues.');
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const counts = {
    total: venues?.length ?? 0,
    pending: venues?.filter((v) => v.status === 'pending').length ?? 0,
    verified: venues?.filter((v) => v.status === 'verified').length ?? 0,
    suspended: venues?.filter((v) => v.status === 'suspended').length ?? 0,
  };
  const visible = venues?.filter((v) => filter === 'all' || v.status === filter) ?? [];

  return (
    <View>
      <View style={styles.headRow}>
        <View>
          <Text style={styles.title}>Venues</Text>
          <Text style={styles.subtitle}>Verify that a listed venue is real and its details are accurate before it goes live to players.</Text>
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
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Total venues</Text>
          <Text style={styles.statValue}>{counts.total}</Text>
        </View>
        <View style={[styles.statCard, styles.statCardPriority]}>
          <Text style={[styles.statLabel, styles.statLabelAccent]}>Pending review</Text>
          <Text style={[styles.statValue, styles.statLabelAccent]}>{counts.pending}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Verified</Text>
          <Text style={styles.statValue}>{counts.verified}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Suspended</Text>
          <Text style={styles.statValue}>{counts.suspended}</Text>
        </View>
      </View>

      {error && <Text style={styles.error}>{error}</Text>}
      {venues === null && !error && (
        <View style={styles.loading}>
          <ActivityIndicator color={colors.accent} />
        </View>
      )}
      {venues && visible.length === 0 && <Text style={styles.emptyNote}>No venues match this filter.</Text>}

      {visible.length > 0 && (
        <View style={styles.tablePanel}>
          <View style={styles.tableHeadRow}>
            <Text style={[styles.tableHeadText, styles.colVenue]}>Venue</Text>
            <Text style={[styles.tableHeadText, styles.colOwner]}>Owner</Text>
            <Text style={[styles.tableHeadText, styles.colPrice]}>Price</Text>
            <Text style={[styles.tableHeadText, styles.colStatus]}>Status</Text>
            <Text style={[styles.tableHeadText, styles.colAction]}> </Text>
          </View>
          {visible.map((venue) => (
            <Link key={venue.id} href={`/admin-dashboard/venues/${venue.id}`} asChild>
              <Pressable style={styles.tableRow}>
                <View style={[styles.venueCell, styles.colVenue]}>
                  <View style={styles.thumbSm}>{venue.photos[0] && <Image source={{ uri: venue.photos[0] }} style={StyleSheet.absoluteFill} resizeMode="cover" />}</View>
                  <View>
                    <Text style={styles.vName}>{venue.name}</Text>
                    <View style={styles.vMeta}>
                      <SportIcon sport={venue.sport as Sport} size={12} />
                      <Text style={styles.vMetaText}>
                        {venue.sport} · {venue.location}
                      </Text>
                    </View>
                  </View>
                </View>
                <Text style={[styles.ownerText, styles.colOwner]}>{venue.owner?.name ?? 'Unknown'}</Text>
                <Text style={[styles.priceText, styles.colPrice]}>KES {venue.price_peak.toLocaleString()}/hr</Text>
                <View style={styles.colStatus}>
                  <View style={[styles.statusPill, venue.status === 'verified' && styles.statusVerified, venue.status === 'suspended' && styles.statusSuspended]}>
                    <Text
                      style={[
                        styles.statusPillText,
                        venue.status === 'verified' && styles.statusPillTextVerified,
                        venue.status === 'suspended' && styles.statusPillTextSuspended,
                      ]}
                    >
                      {STATUS_LABEL[venue.status]}
                    </Text>
                  </View>
                </View>
                <View style={styles.colAction}>
                  <View style={styles.manageBtn}>
                    <Text style={styles.manageBtnText}>Manage</Text>
                  </View>
                </View>
              </Pressable>
            </Link>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  headRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16, marginBottom: 8 },
  title: { fontFamily: fonts.serif, fontSize: 26, color: colors.text, marginBottom: 4 },
  subtitle: { fontFamily: fonts.sans, fontSize: 13.5, color: colors.textSoft, maxWidth: 420 },

  tabs: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  tab: { paddingVertical: 9, paddingHorizontal: 16, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  tabActive: { backgroundColor: colors.accent, borderColor: 'transparent' },
  tabText: { fontFamily: fonts.sansSemiBold, fontSize: 13, color: colors.textSoft },
  tabTextActive: { color: colors.accentText },

  statsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 18, marginTop: 22, marginBottom: 30 },
  statCard: { flexGrow: 1, flexBasis: 200, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, padding: 18 },
  statCardPriority: { borderColor: colors.accent },
  statLabel: { fontFamily: fonts.sansSemiBold, fontSize: 12.5, color: colors.textSoft, marginBottom: 10 },
  statLabelAccent: { color: colors.accent },
  statValue: { fontFamily: fonts.serif, fontSize: 24, color: colors.text },

  loading: { paddingVertical: 40, alignItems: 'center' },
  error: { fontFamily: fonts.sans, fontSize: 13.5, color: colors.danger },
  emptyNote: { fontFamily: fonts.sans, fontSize: 13, color: colors.textSoft, textAlign: 'center', paddingVertical: 30 },

  tablePanel: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, padding: 8 },
  tableHeadRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 14, borderBottomWidth: 1, borderBottomColor: colors.border },
  tableHeadText: { fontFamily: fonts.sansBold, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5, color: colors.textSoft },
  tableRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 14, borderBottomWidth: 1, borderBottomColor: colors.border },

  colVenue: { flex: 2.4, minWidth: 220 },
  colOwner: { flex: 1.2, minWidth: 130 },
  colPrice: { flex: 1, minWidth: 100 },
  colStatus: { flex: 1, minWidth: 110 },
  colAction: { flex: 0.8, minWidth: 90, alignItems: 'flex-end' },

  venueCell: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  thumbSm: { width: 40, height: 40, borderRadius: 8, backgroundColor: colors.accentSoft, overflow: 'hidden' },
  vName: { fontFamily: fonts.sansSemiBold, fontSize: 13.5, color: colors.text },
  vMeta: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 },
  vMetaText: { fontFamily: fonts.sans, fontSize: 12, color: colors.textSoft, textTransform: 'capitalize' },

  ownerText: { fontFamily: fonts.sans, fontSize: 13, color: colors.text },
  priceText: { fontFamily: fonts.sans, fontSize: 13, color: colors.text },

  statusPill: { alignSelf: 'flex-start', backgroundColor: colors.surface2, borderRadius: radius.pill, paddingVertical: 4, paddingHorizontal: 10 },
  statusVerified: { backgroundColor: 'rgba(60,122,92,0.14)' },
  statusSuspended: { backgroundColor: 'rgba(196,69,63,0.12)' },
  statusPillText: { fontFamily: fonts.sansSemiBold, fontSize: 10.5, color: colors.textSoft },
  statusPillTextVerified: { color: colors.good },
  statusPillTextSuspended: { color: colors.danger },

  manageBtn: { borderWidth: 1.5, borderColor: colors.border, borderRadius: radius.pill, paddingVertical: 7, paddingHorizontal: 14 },
  manageBtnText: { fontFamily: fonts.sansSemiBold, fontSize: 12, color: colors.text },
});
