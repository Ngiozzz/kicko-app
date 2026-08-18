import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Link, useLocalSearchParams } from 'expo-router';
import { colors, fonts, radius } from '@kicko/shared';
import { venuesApi, Venue, VenueStats } from '../../../../src/lib/venuesApi';
import { useVenueReviews } from '../../../../src/lib/useVenueReviews';
import { StarRating } from '../../../../src/components/StarRating';
import { useBreadcrumb } from '../../../../src/lib/breadcrumbContext';

const STATUS_LABEL: Record<Venue['status'], string> = {
  pending: 'Pending review',
  verified: 'Verified',
  suspended: 'Suspended',
};

function NavCard({ title, description, href }: { title: string; description: string; href: string }) {
  return (
    <Link href={href} asChild>
      <Pressable style={styles.navCard}>
        <View style={{ flex: 1 }}>
          <Text style={styles.navCardTitle}>{title}</Text>
          <Text style={styles.navCardDesc}>{description}</Text>
        </View>
        <Text style={styles.navCardArrow}>→</Text>
      </Pressable>
    </Link>
  );
}

export default function VenueOverview() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [venue, setVenue] = useState<Venue | null>(null);
  const [stats, setStats] = useState<VenueStats | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const { average, count } = useVenueReviews(id);

  useEffect(() => {
    (async () => {
      try {
        const { venue, stats } = await venuesApi.get(id);
        setVenue(venue);
        setStats(stats);
      } catch (err) {
        setLoadError(err instanceof Error ? err.message : 'Could not load this venue.');
      }
    })();
  }, [id]);

  useBreadcrumb(venue ? [{ label: 'Home', href: '/owner' }, { label: 'My Venues', href: '/owner/venues' }, { label: venue.name }] : null);

  if (loadError) return <Text style={styles.error}>{loadError}</Text>;
  if (!venue) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  return (
    <View>
      <View style={styles.titleRow}>
        <Text style={styles.title}>{venue.name}</Text>
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
      <Text style={styles.subtitle}>
        {venue.sport} · {venue.location} · Added {new Date(venue.created_at).toLocaleDateString()}
      </Text>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Total bookings</Text>
          <Text style={styles.statValue}>{stats ? stats.totalBookings : '—'}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Revenue collected</Text>
          <Text style={styles.statValue}>{stats ? `KES ${stats.totalRevenue.toLocaleString()}` : '—'}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Rating</Text>
          {count > 0 ? (
            <View style={styles.ratingRow}>
              <Text style={styles.statValue}>{average}</Text>
              <StarRating value={average} size={13} />
            </View>
          ) : (
            <Text style={styles.statValue}>—</Text>
          )}
          <Text style={styles.statSub}>{count} review{count === 1 ? '' : 's'}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Peak / off-peak</Text>
          <Text style={styles.statValue}>
            {venue.price_peak.toLocaleString()} / {venue.price_off_peak.toLocaleString()}
          </Text>
          <Text style={styles.statSub}>KES per hour</Text>
        </View>
      </View>

      <Text style={styles.secTitle}>Go to</Text>
      <NavCard title="Reviews" description={`See what players are saying about this venue${count > 0 ? ` — ${count} so far` : ''}.`} href={`/owner/venues/${id}/reviews`} />
      <NavCard title="Edit venue" description="Update photos, pricing, hours, and amenities." href={`/owner/venues/${id}/edit`} />
    </View>
  );
}

const styles = StyleSheet.create({
  loading: { paddingVertical: 60, alignItems: 'center' },
  error: { fontFamily: fonts.sans, fontSize: 13.5, color: colors.danger },

  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 12, flexWrap: 'wrap' },
  title: { fontFamily: fonts.serif, fontSize: 28, color: colors.text },
  subtitle: { fontFamily: fonts.sans, fontSize: 13, color: colors.textSoft, marginTop: 6, textTransform: 'capitalize' },

  statusPill: { backgroundColor: colors.surface2, borderRadius: radius.pill, paddingVertical: 4, paddingHorizontal: 10 },
  statusVerified: { backgroundColor: 'rgba(60,122,92,0.14)' },
  statusSuspended: { backgroundColor: 'rgba(196,69,63,0.12)' },
  statusPillText: { fontFamily: fonts.sansSemiBold, fontSize: 11, color: colors.textSoft },
  statusPillTextVerified: { color: colors.good },
  statusPillTextSuspended: { color: colors.danger },

  statsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 18, marginTop: 24, marginBottom: 8 },
  statCard: { flexGrow: 1, flexBasis: 180, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, padding: 18, gap: 6 },
  statLabel: { fontFamily: fonts.sansSemiBold, fontSize: 12, color: colors.textSoft },
  statValue: { fontFamily: fonts.serif, fontSize: 22, color: colors.text },
  statSub: { fontFamily: fonts.sans, fontSize: 11.5, color: colors.textSoft },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },

  secTitle: { fontFamily: fonts.serifMedium, fontSize: 18, color: colors.text, marginTop: 34, marginBottom: 16 },

  navCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingVertical: 20,
    paddingHorizontal: 22,
    marginBottom: 14,
    gap: 16,
  },
  navCardTitle: { fontFamily: fonts.serifMedium, fontSize: 15, color: colors.text, marginBottom: 4 },
  navCardDesc: { fontFamily: fonts.sans, fontSize: 12.5, color: colors.textSoft, lineHeight: 18 },
  navCardArrow: { color: colors.accent, fontSize: 20, flexShrink: 0 },
});
