import { useCallback, useState } from 'react';
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Link, useFocusEffect } from 'expo-router';
import { apiFetch, colors, fonts, radius } from '@kicko/shared';
import { venuesApi, Venue, VenueStats } from '../../src/lib/venuesApi';
import { bookingsApi, Booking } from '../../src/lib/bookingsApi';
import { SportIcon, Sport } from '../../src/components/SportIcon';

function fmtTime(t: string) {
  const [h, m] = t.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, '0')} ${period}`;
}

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
      {sub ? <Text style={styles.statSub}>{sub}</Text> : null}
    </View>
  );
}

const STATUS_LABEL: Record<Venue['status'], string> = { pending: 'Pending review', verified: 'Verified', suspended: 'Suspended' };

export default function ManagerHome() {
  const [venue, setVenue] = useState<Venue | null>(null);
  const [stats, setStats] = useState<VenueStats | null>(null);
  const [bookings, setBookings] = useState<Booking[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [noVenue, setNoVenue] = useState(false);

  const load = useCallback(async () => {
    try {
      const { user } = await apiFetch<{ user: { venue_id: string | null } }>('/api/account/me');
      if (!user.venue_id) {
        setNoVenue(true);
        return;
      }
      const [venueRes, bookingsRes] = await Promise.all([venuesApi.get(user.venue_id), bookingsApi.venue()]);
      setVenue(venueRes.venue);
      setStats(venueRes.stats);
      setBookings(bookingsRes.bookings);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load your venue.');
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  if (noVenue) {
    return (
      <View>
        <Text style={styles.welcomeTitle}>Home</Text>
        <Text style={styles.emptyNote}>You're not assigned to a venue yet — ask your venue owner to assign you one.</Text>
      </View>
    );
  }

  const confirmedCount = bookings?.filter((b) => b.status === 'confirmed').length ?? 0;
  const cancelledCount = bookings?.filter((b) => b.status === 'cancelled').length ?? 0;
  const recent = bookings?.slice(0, 5) ?? [];

  return (
    <View>
      <View style={styles.welcome}>
        <Text style={styles.welcomeTitle}>Home</Text>
        <Text style={styles.welcomeSub}>{venue ? venue.name : 'The venue you run day-to-day.'}</Text>
      </View>

      {error && <Text style={styles.error}>{error}</Text>}
      {!venue && !error && (
        <View style={styles.loading}>
          <ActivityIndicator color={colors.accent} />
        </View>
      )}

      {venue && (
        <>
          <View style={styles.venueCard}>
            <View style={styles.thumb}>{venue.photos[0] && <Image source={{ uri: venue.photos[0] }} style={StyleSheet.absoluteFill} resizeMode="cover" />}</View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <View style={styles.venueTopRow}>
                <SportIcon sport={venue.sport as Sport} size={16} />
                <Text style={styles.venueName}>{venue.name}</Text>
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
              <Text style={styles.venueMeta}>
                {venue.sport} · {venue.location} · KES {venue.price_off_peak.toLocaleString()}–{venue.price_peak.toLocaleString()}/hr
              </Text>
              <Text style={styles.venueHours}>
                Open {fmtTime(venue.opening_time)} – {fmtTime(venue.closing_time)}
              </Text>
            </View>
          </View>

          <View style={styles.statsRow}>
            <StatCard label="Total bookings" value={String(stats?.totalBookings ?? 0)} />
            <StatCard label="Confirmed" value={String(confirmedCount)} />
            <StatCard label="Cancelled" value={String(cancelledCount)} />
            <StatCard label="Total revenue" value={`KES ${(stats?.totalRevenue ?? 0).toLocaleString()}`} sub="This venue's own cut, all-time" />
          </View>

          <View style={styles.secHead}>
            <Text style={styles.secTitle}>Recent bookings</Text>
            <Link href="/manager/bookings" asChild>
              <Pressable>
                <Text style={styles.seeAll}>See all ›</Text>
              </Pressable>
            </Link>
          </View>

          {bookings && recent.length === 0 && <Text style={styles.emptyNote}>No bookings yet.</Text>}
          {recent.map((b) => (
            <View key={b.id} style={styles.listRow}>
              <View>
                <Text style={styles.listRowTitle}>{b.player?.name ?? 'Player'}</Text>
                <Text style={styles.listRowMeta}>
                  {new Date(b.start_at).toLocaleString('en-KE', { weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })}
                </Text>
              </View>
              <View style={styles.rowRight}>
                <Text style={styles.listRowAmount}>KES {b.subtotal.toLocaleString()}</Text>
                <Text style={styles.listRowStatus}>{b.status.replace('_', ' ')}</Text>
              </View>
            </View>
          ))}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  welcome: { marginBottom: 26 },
  welcomeTitle: { fontFamily: fonts.serif, fontSize: 26, color: colors.text, marginBottom: 4 },
  welcomeSub: { fontFamily: fonts.sans, fontSize: 14, color: colors.textSoft },

  loading: { paddingVertical: 40, alignItems: 'center' },
  error: { fontFamily: fonts.sans, fontSize: 13.5, color: colors.danger, marginBottom: 16 },
  emptyNote: { fontFamily: fonts.sans, fontSize: 13.5, color: colors.textSoft },

  venueCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: 18,
    marginBottom: 26,
  },
  thumb: { width: 64, height: 64, borderRadius: radius.md, backgroundColor: colors.accentSoft, overflow: 'hidden', flexShrink: 0 },
  venueTopRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  venueName: { fontFamily: fonts.serifMedium, fontSize: 17, color: colors.text },
  venueMeta: { fontFamily: fonts.sans, fontSize: 12.5, color: colors.textSoft, marginTop: 4, textTransform: 'capitalize' },
  venueHours: { fontFamily: fonts.sans, fontSize: 12, color: colors.textSoft, marginTop: 2 },

  statusPill: { backgroundColor: colors.surface2, borderRadius: radius.pill, paddingVertical: 3, paddingHorizontal: 9 },
  statusVerified: { backgroundColor: 'rgba(60,122,92,0.14)' },
  statusSuspended: { backgroundColor: 'rgba(196,69,63,0.12)' },
  statusPillText: { fontFamily: fonts.sansSemiBold, fontSize: 10.5, color: colors.textSoft },
  statusPillTextVerified: { color: colors.good },
  statusPillTextSuspended: { color: colors.danger },

  statsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 18, marginBottom: 36 },
  statCard: { flexGrow: 1, flexBasis: 200, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, padding: 20 },
  statLabel: { fontFamily: fonts.sansSemiBold, fontSize: 12.5, color: colors.textSoft, marginBottom: 14 },
  statValue: { fontFamily: fonts.serif, fontSize: 24, color: colors.text },
  statSub: { fontFamily: fonts.sans, fontSize: 11.5, color: colors.textSoft, marginTop: 6 },

  secHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 16 },
  secTitle: { fontFamily: fonts.serifMedium, fontSize: 19, color: colors.text },
  seeAll: { fontFamily: fonts.sansSemiBold, fontSize: 13, color: colors.accent },

  listRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 16,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: 16,
    marginBottom: 12,
  },
  listRowTitle: { fontFamily: fonts.sansSemiBold, fontSize: 14, color: colors.text },
  listRowMeta: { fontFamily: fonts.sans, fontSize: 12.5, color: colors.textSoft, marginTop: 2 },
  rowRight: { alignItems: 'flex-end' },
  listRowAmount: { fontFamily: fonts.sansBold, fontSize: 13, color: colors.accent },
  listRowStatus: { fontFamily: fonts.sans, fontSize: 11.5, color: colors.textSoft, marginTop: 2, textTransform: 'capitalize' },
});
