import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Link, useFocusEffect } from 'expo-router';
import { colors, fonts, radius } from '@kicko/shared';
import { venuesApi, Venue } from '../../../src/lib/venuesApi';
import { SportIcon, Sport } from '../../../src/components/SportIcon';

const STATUS_LABEL: Record<Venue['status'], string> = {
  pending: 'Pending review',
  verified: 'Verified',
  suspended: 'Suspended',
};

type Filter = 'all' | 'self' | 'managed';
const TABS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'self', label: 'Self-run' },
  { key: 'managed', label: 'Manager-run' },
];

export default function OwnerVenues() {
  const [venues, setVenues] = useState<Venue[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>('all');

  const load = useCallback(async () => {
    try {
      const { venues } = await venuesApi.list();
      setVenues(venues);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load your venues.');
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  // No manager-assignment system exists yet, so every venue is
  // self-run for now — the tab is honest, just always empty for
  // "managed" until that feature ships.
  const visible = venues?.filter((v) => (filter === 'managed' ? false : true)) ?? [];

  // Weighted across venues (a venue with more reviews counts more), not a
  // plain average-of-averages.
  const overallRating = useMemo(() => {
    const totalReviews = (venues ?? []).reduce((sum, v) => sum + v.review_count, 0);
    if (totalReviews === 0) return null;
    const weighted = (venues ?? []).reduce((sum, v) => sum + v.avg_rating * v.review_count, 0);
    return +(weighted / totalReviews).toFixed(1);
  }, [venues]);

  return (
    <View>
      <View style={styles.headRow}>
        <View>
          <Text style={styles.title}>My Venues</Text>
          <Text style={styles.subtitle}>Every venue you own, self-run or delegated to a manager.</Text>
        </View>
        <View style={styles.headActions}>
          <View style={styles.tabs}>
            {TABS.map((tab) => (
              <Pressable key={tab.key} onPress={() => setFilter(tab.key)} style={[styles.tab, filter === tab.key && styles.tabActive]}>
                <Text style={[styles.tabText, filter === tab.key && styles.tabTextActive]}>{tab.label}</Text>
              </Pressable>
            ))}
          </View>
          <Link href="/owner/venues/new" asChild>
            <Pressable style={styles.btnSm}>
              <Text style={styles.btnSmText}>+ Add venue</Text>
            </Pressable>
          </Link>
        </View>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>My venues</Text>
          <Text style={styles.statValue}>{venues ? venues.length : '0'}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Bookings today</Text>
          <Text style={styles.statValue}>0</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Avg rating</Text>
          <Text style={styles.statValue}>{overallRating ?? '—'}</Text>
        </View>
        <Link href="/owner/bookings?filter=pending" asChild>
          <Pressable style={StyleSheet.flatten([styles.statCard, styles.statCardPriority])}>
            <Text style={[styles.statLabel, styles.statLabelAccent]}>Pending approvals</Text>
            <Text style={[styles.statValue, styles.statLabelAccent]}>0</Text>
            <Text style={styles.statSub}>Bookings awaiting review →</Text>
          </Pressable>
        </Link>
      </View>

      {venues === null && !error && (
        <View style={styles.loading}>
          <ActivityIndicator color={colors.accent} />
        </View>
      )}
      {error && <Text style={styles.error}>{error}</Text>}
      {venues && venues.length === 0 && <Text style={styles.emptyNote}>No venues yet — add your first one above.</Text>}
      {venues && venues.length > 0 && visible.length === 0 && <Text style={styles.emptyNote}>No venues match this filter.</Text>}

      <View style={styles.grid}>
        {visible.map((venue) => (
          <Link key={venue.id} href={`/owner/venues/${venue.id}`} asChild>
            <Pressable style={styles.card}>
              <View style={styles.thumb}>
                {venue.photos[0] && <Image source={{ uri: venue.photos[0] }} style={StyleSheet.absoluteFill} resizeMode="cover" />}
                {venue.photos.length > 1 && (
                  <View style={styles.thumbCount}>
                    <Text style={styles.thumbBadgeText}>+{venue.photos.length - 1}</Text>
                  </View>
                )}
                {!venue.photos[0] && venue.amenities[0] && (
                  <View style={styles.thumbBadge}>
                    <Text style={styles.thumbBadgeText}>{venue.amenities[0]}</Text>
                  </View>
                )}
              </View>
              <View style={styles.vHead}>
                <Text style={styles.vName}>{venue.name}</Text>
                <View
                  style={[
                    styles.statusPill,
                    venue.status === 'verified' && styles.statusVerified,
                    venue.status === 'suspended' && styles.statusSuspended,
                  ]}
                >
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
              <Text style={styles.mgrTag}>🔑 You run this venue</Text>
              <View style={styles.sportMeta}>
                <SportIcon sport={venue.sport as Sport} size={13} />
                <Text style={styles.sportMetaText}>
                  {venue.sport} · {venue.location}
                </Text>
              </View>
              <View style={styles.statLine}>
                <Text style={styles.statLineText}>0 bookings today</Text>
                <Text style={styles.statLineText}>{venue.review_count > 0 ? `★ ${venue.avg_rating} (${venue.review_count})` : '★ —'}</Text>
              </View>
              <View style={styles.foot}>
                <Text style={styles.price}>From KES {venue.price_off_peak.toLocaleString()}/hr</Text>
                <View style={styles.manageBtn}>
                  <Text style={styles.manageBtnText}>Manage</Text>
                </View>
              </View>
            </Pressable>
          </Link>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16, marginBottom: 8 },
  title: { fontFamily: fonts.serif, fontSize: 26, color: colors.text, marginBottom: 4 },
  subtitle: { fontFamily: fonts.sans, fontSize: 13.5, color: colors.textSoft },
  headActions: { flexDirection: 'row', alignItems: 'center', gap: 12, flexWrap: 'wrap' },

  tabs: { flexDirection: 'row', gap: 8 },
  tab: { paddingVertical: 9, paddingHorizontal: 16, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  tabActive: { backgroundColor: colors.accent, borderColor: 'transparent' },
  tabText: { fontFamily: fonts.sansSemiBold, fontSize: 13, color: colors.textSoft },
  tabTextActive: { color: colors.accentText },

  btnSm: { backgroundColor: colors.accent, borderRadius: radius.pill, paddingVertical: 10, paddingHorizontal: 18 },
  btnSmText: { fontFamily: fonts.sansBold, fontSize: 13, color: colors.accentText },

  statsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 18, marginTop: 22, marginBottom: 30 },
  statCard: { flexGrow: 1, flexBasis: 200, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, padding: 18 },
  statCardPriority: { borderColor: colors.accent },
  statLabel: { fontFamily: fonts.sansSemiBold, fontSize: 12.5, color: colors.textSoft, marginBottom: 10 },
  statLabelAccent: { color: colors.accent },
  statValue: { fontFamily: fonts.serif, fontSize: 24, color: colors.text },
  statSub: { fontFamily: fonts.sans, fontSize: 11.5, color: colors.textSoft, marginTop: 4 },

  loading: { paddingVertical: 40, alignItems: 'center' },
  error: { fontFamily: fonts.sans, fontSize: 13.5, color: colors.danger },
  emptyNote: { fontFamily: fonts.sans, fontSize: 13, color: colors.textSoft, textAlign: 'center', paddingVertical: 30 },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 22 },
  card: { width: 280, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, padding: 20 },
  thumb: {
    height: 110,
    borderRadius: radius.md,
    backgroundColor: colors.accentSoft,
    marginBottom: 16,
    justifyContent: 'flex-start',
    overflow: 'hidden',
  },
  thumbBadge: { alignSelf: 'flex-start', margin: 10, backgroundColor: 'rgba(30,33,38,0.55)', borderRadius: radius.pill, paddingVertical: 4, paddingHorizontal: 10 },
  thumbBadgeText: { fontFamily: fonts.sansSemiBold, fontSize: 11, color: '#fff' },
  thumbCount: {
    position: 'absolute',
    right: 10,
    bottom: 10,
    backgroundColor: 'rgba(30,33,38,0.55)',
    borderRadius: radius.pill,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },

  vHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 6 },
  vName: { flex: 1, fontFamily: fonts.serifMedium, fontSize: 16, color: colors.text },
  statusPill: { backgroundColor: colors.surface2, borderRadius: radius.pill, paddingVertical: 4, paddingHorizontal: 10 },
  statusVerified: { backgroundColor: 'rgba(60,122,92,0.14)' },
  statusSuspended: { backgroundColor: 'rgba(196,69,63,0.12)' },
  statusPillText: { fontFamily: fonts.sansSemiBold, fontSize: 10.5, color: colors.textSoft },
  statusPillTextVerified: { color: colors.good },
  statusPillTextSuspended: { color: colors.danger },

  mgrTag: { fontFamily: fonts.sansSemiBold, fontSize: 11.5, color: colors.textSoft, marginBottom: 10 },

  sportMeta: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 14 },
  sportMetaText: { fontFamily: fonts.sans, fontSize: 13, color: colors.textSoft, textTransform: 'capitalize' },

  statLine: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14 },
  statLineText: { fontFamily: fonts.sans, fontSize: 12, color: colors.textSoft },

  foot: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  price: { fontFamily: fonts.sansBold, fontSize: 13, color: colors.accent },
  manageBtn: { borderWidth: 1.5, borderColor: colors.border, borderRadius: radius.pill, paddingVertical: 7, paddingHorizontal: 16 },
  manageBtnText: { fontFamily: fonts.sansSemiBold, fontSize: 12.5, color: colors.text },
});
