import { useCallback, useState } from 'react';
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Link, useFocusEffect } from 'expo-router';
import { colors, fonts, radius } from '@kicko/shared';
import { exploreApi } from '../../src/lib/venuesApi';
import { bookingsApi, Booking } from '../../src/lib/bookingsApi';
import { SportIcon, Sport } from '../../src/components/SportIcon';
import type { Venue } from '../../src/lib/venuesApi';

function StatCard({ label, value, unit, sub }: { label: string; value: string; unit?: string; sub?: string }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>
        {value}
        {unit ? <Text style={styles.statUnit}> {unit}</Text> : null}
      </Text>
      {sub ? <Text style={styles.statSub}>{sub}</Text> : null}
    </View>
  );
}

function statusLabel(b: Booking): string {
  if (b.status === 'cancelled') return 'Cancelled';
  if (b.status === 'completed') return 'Completed';
  if (b.payment_status === 'paid') return 'Paid';
  return 'Awaiting payment';
}

export default function PlayerHome() {
  const [venues, setVenues] = useState<Venue[] | null>(null);
  const [bookings, setBookings] = useState<Booking[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [{ venues }, { bookings }] = await Promise.all([exploreApi.list(), bookingsApi.mine()]);
      setVenues(venues);
      setBookings(bookings);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load your dashboard.');
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const activeBookings = bookings?.filter((b) => b.status === 'pending_payment' || b.status === 'confirmed') ?? [];
  const completedBookings = bookings?.filter((b) => b.status === 'completed') ?? [];
  const spotlight = venues?.[0] ?? null;
  const trending = venues?.slice(1, 5) ?? [];

  return (
    <View>
      <View style={styles.welcome}>
        <Text style={styles.welcomeTitle}>Home</Text>
      </View>

      {error && <Text style={styles.error}>{error}</Text>}

      <View style={styles.statsRow}>
        <StatCard label="Available nearby" value={venues ? String(venues.length) : '0'} unit="venues" />
        <StatCard label="Active bookings" value={String(activeBookings.length)} unit="games" />
        <View style={[styles.statCard, styles.statCardAccent]}>
          <Text style={styles.statLabelAccentOn}>Player status</Text>
          <Text style={styles.statValueAccentOn}>Active Player</Text>
        </View>
        <StatCard label="Loyalty games" value={String(completedBookings.length)} unit="played" />
      </View>

      <View style={styles.dashGrid}>
        <View style={styles.mainCol}>
          {venues === null && !error && (
            <View style={styles.loading}>
              <ActivityIndicator color={colors.accent} />
            </View>
          )}
          {venues && venues.length === 0 && <Text style={styles.emptyText}>No verified venues yet — check back soon.</Text>}

          {spotlight && (
            <View style={styles.spotlight}>
              <View style={styles.spotlightImg}>
                {spotlight.photos[0] && <Image source={{ uri: spotlight.photos[0] }} style={StyleSheet.absoluteFill} resizeMode="cover" />}
                <View style={styles.spotlightBadge}>
                  <Text style={styles.spotlightBadgeText}>Spotlight</Text>
                </View>
              </View>
              <View style={styles.spotlightBody}>
                <Text style={styles.spotlightTitle}>{spotlight.name}</Text>
                <View style={styles.spotlightMeta}>
                  <SportIcon sport={spotlight.sport as Sport} size={13} />
                  <Text style={styles.spotlightMetaText}>
                    {spotlight.sport} · {spotlight.location} · From KES {spotlight.price_off_peak.toLocaleString()}/hr
                  </Text>
                </View>
                <View style={styles.spotlightActions}>
                  <Link href={`/player/explore/${spotlight.id}`} asChild>
                    <Pressable style={styles.btn}>
                      <Text style={styles.btnText}>Book now →</Text>
                    </Pressable>
                  </Link>
                  <Link href={`/player/explore/${spotlight.id}`} asChild>
                    <Pressable style={styles.btnOutline}>
                      <Text style={styles.btnOutlineText}>View details</Text>
                    </Pressable>
                  </Link>
                </View>
              </View>
            </View>
          )}

          <View style={styles.secHead}>
            <Text style={styles.secTitle}>Trending near you</Text>
            <Link href="/player/explore" asChild>
              <Pressable>
                <Text style={styles.seeAll}>See all ›</Text>
              </Pressable>
            </Link>
          </View>

          <View style={styles.trendGrid}>
            {trending.map((venue) => (
              <Link key={venue.id} href={`/player/explore/${venue.id}`} asChild>
                <Pressable style={styles.trendCard}>
                  <View style={styles.trendThumb}>
                    {venue.photos[0] && <Image source={{ uri: venue.photos[0] }} style={StyleSheet.absoluteFill} resizeMode="cover" />}
                  </View>
                  <Text style={styles.trendTitle}>{venue.name}</Text>
                  <View style={styles.trendMeta}>
                    <SportIcon sport={venue.sport as Sport} size={12} />
                    <Text style={styles.trendMetaText}>
                      {venue.sport} · {venue.location}
                    </Text>
                  </View>
                  <Text style={styles.trendPrice}>From KES {venue.price_off_peak.toLocaleString()}/hr</Text>
                </Pressable>
              </Link>
            ))}
            {venues && trending.length === 0 && !spotlight && <Text style={styles.emptyText}>No other venues yet.</Text>}
          </View>
        </View>

        <View style={styles.sideCol}>
          <View style={styles.sideCard}>
            <Text style={styles.sideCardTitle}>⚡ Quick actions</Text>
            <Link href="/player/explore" asChild>
              <Pressable style={styles.actionItem}>
                <View style={styles.actionIcon}>
                  <Text>🔍</Text>
                </View>
                <View style={styles.actionTextWrap}>
                  <Text style={styles.actionTitle}>Browse venues</Text>
                  <Text style={styles.actionSub}>Find a venue to book</Text>
                </View>
                <Text style={styles.actionArrow}>›</Text>
              </Pressable>
            </Link>
            <Link href="/player/bookings" asChild>
              <Pressable style={styles.actionItem}>
                <View style={styles.actionIcon}>
                  <Text>↻</Text>
                </View>
                <View style={styles.actionTextWrap}>
                  <Text style={styles.actionTitle}>My bookings</Text>
                  <Text style={styles.actionSub}>See your upcoming games</Text>
                </View>
                <Text style={styles.actionArrow}>›</Text>
              </Pressable>
            </Link>
            <Link href="/player/settings" asChild>
              <Pressable style={StyleSheet.flatten([styles.actionItem, styles.actionItemLast])}>
                <View style={styles.actionIcon}>
                  <Text>⚙</Text>
                </View>
                <View style={styles.actionTextWrap}>
                  <Text style={styles.actionTitle}>Edit profile</Text>
                  <Text style={styles.actionSub}>Update your details</Text>
                </View>
                <Text style={styles.actionArrow}>›</Text>
              </Pressable>
            </Link>
          </View>

          <View style={styles.sideCard}>
            <Text style={styles.sideCardTitle}>Recent activity</Text>
            {bookings && bookings.length === 0 && <Text style={styles.emptyText}>No bookings yet.</Text>}
            {bookings?.slice(0, 3).map((b) => (
              <View key={b.id} style={styles.activityRow}>
                <Text style={styles.activityText} numberOfLines={1}>
                  {b.venue.name} · KES {b.total_amount.toLocaleString()}
                </Text>
                <Text style={styles.activityStatus}>{statusLabel(b)}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      <Link href="/player/explore" asChild>
        <Pressable style={styles.fab}>
          <Text style={styles.fabText}>+</Text>
        </Pressable>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  welcome: { marginBottom: 26 },
  welcomeTitle: { fontFamily: fonts.serif, fontSize: 26, color: colors.text },

  statsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 18, marginBottom: 36 },
  statCard: { flexGrow: 1, flexBasis: 200, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, padding: 20 },
  statCardAccent: { backgroundColor: colors.accent, borderColor: 'transparent' },
  statLabel: { fontFamily: fonts.sansSemiBold, fontSize: 12.5, color: colors.textSoft, marginBottom: 14 },
  statLabelAccentOn: { fontFamily: fonts.sansSemiBold, fontSize: 12.5, color: colors.accentText, marginBottom: 14, opacity: 0.85 },
  statValue: { fontFamily: fonts.serif, fontSize: 26, color: colors.text },
  statValueAccentOn: { fontFamily: fonts.serif, fontSize: 22, color: colors.accentText },
  statUnit: { fontFamily: fonts.sans, fontSize: 12, fontWeight: '500', color: colors.textSoft },
  statSub: { fontFamily: fonts.sans, fontSize: 12, color: colors.textSoft, marginTop: 6 },

  dashGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 28, alignItems: 'flex-start' },
  mainCol: { flex: 1.65, minWidth: 320 },
  sideCol: { flex: 1, minWidth: 260 },

  spotlight: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 22, overflow: 'hidden', marginBottom: 32 },
  spotlightImg: { height: 200, backgroundColor: colors.accentSoft },
  spotlightBadge: { position: 'absolute', top: 14, left: 14, backgroundColor: 'rgba(30,33,38,0.55)', borderRadius: radius.pill, paddingVertical: 5, paddingHorizontal: 12 },
  spotlightBadgeText: { fontFamily: fonts.sansBold, fontSize: 11, color: '#fff' },
  spotlightBody: { padding: 22 },
  spotlightTitle: { fontFamily: fonts.serifMedium, fontSize: 22, color: colors.text, marginBottom: 8 },
  spotlightMeta: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 18 },
  spotlightMetaText: { fontFamily: fonts.sans, fontSize: 13, color: colors.textSoft, textTransform: 'capitalize' },
  spotlightActions: { flexDirection: 'row', gap: 12 },

  btn: { backgroundColor: colors.accent, borderRadius: radius.pill, paddingVertical: 12, paddingHorizontal: 20 },
  btnText: { fontFamily: fonts.sansBold, fontSize: 13.5, color: colors.accentText },
  btnOutline: { borderWidth: 1.5, borderColor: colors.border, borderRadius: radius.pill, paddingVertical: 12, paddingHorizontal: 20 },
  btnOutlineText: { fontFamily: fonts.sansBold, fontSize: 13.5, color: colors.text },

  secHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 18 },
  secTitle: { fontFamily: fonts.serifMedium, fontSize: 19, color: colors.text },
  seeAll: { fontFamily: fonts.sansSemiBold, fontSize: 13, color: colors.accent },

  loading: { paddingVertical: 30, alignItems: 'center' },
  error: { fontFamily: fonts.sans, fontSize: 13, color: colors.danger, marginBottom: 16 },
  emptyText: { fontFamily: fonts.sans, fontSize: 13.5, color: colors.textSoft },

  trendGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  trendCard: { flexGrow: 1, flexBasis: 220, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, padding: 16 },
  trendThumb: { height: 90, borderRadius: 10, marginBottom: 12, backgroundColor: colors.accentSoft, overflow: 'hidden' },
  trendTitle: { fontFamily: fonts.sansSemiBold, fontSize: 14, color: colors.text, marginBottom: 4 },
  trendMeta: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 8 },
  trendMetaText: { fontFamily: fonts.sans, fontSize: 12.5, color: colors.textSoft, textTransform: 'capitalize' },
  trendPrice: { fontFamily: fonts.sansBold, fontSize: 12.5, color: colors.accent },

  sideCard: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, padding: 20, marginBottom: 20 },
  sideCardTitle: { fontFamily: fonts.sansSemiBold, fontSize: 14, color: colors.text, marginBottom: 14 },
  actionItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
  actionItemLast: { borderBottomWidth: 0 },
  actionIcon: { width: 36, height: 36, borderRadius: radius.sm, backgroundColor: colors.accentSoft, alignItems: 'center', justifyContent: 'center' },
  actionTextWrap: { flex: 1 },
  actionTitle: { fontFamily: fonts.sansSemiBold, fontSize: 13.5, color: colors.text },
  actionSub: { fontFamily: fonts.sans, fontSize: 12, color: colors.textSoft },
  actionArrow: { color: colors.textSoft, fontSize: 16 },

  activityRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border },
  activityText: { flex: 1, fontFamily: fonts.sans, fontSize: 13, color: colors.text },
  activityStatus: { fontFamily: fonts.sansSemiBold, fontSize: 11.5, color: colors.accent },

  fab: {
    position: 'fixed' as any,
    right: 32,
    bottom: 32,
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 10px 24px rgba(0,0,0,0.25)',
  } as any,
  fabText: { fontFamily: fonts.sansBold, fontSize: 26, color: colors.accentText, lineHeight: 28 },
});
