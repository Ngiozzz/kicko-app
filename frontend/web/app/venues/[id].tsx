import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Link, useLocalSearchParams } from 'expo-router';
import Head from 'expo-router/head';
import { colors, fonts, radius } from '@kicko/shared';
import { publicVenuesApi, PublicVenue, BookedSlot } from '../../src/lib/venuesApi';
import { usePublicVenueReviews } from '../../src/lib/usePublicVenueReviews';
import { SportIcon, Sport } from '../../src/components/SportIcon';
import { StarRating } from '../../src/components/StarRating';
import { ReviewCard, ReviewListPanel, LoadMoreButton } from '../../src/components/ReviewList';
import { dateOptions, hourSlots, slotRange, overlaps } from '../../src/lib/slots';
import { PublicVenuesNav } from '../../src/components/PublicVenuesNav';
import { withRole } from '../../src/lib/withRole';

// Public (no login) venue page — see app/player/explore/[id].tsx for the
// logged-in equivalent this was adapted from. Same venue info/availability/
// reviews display, but no booking form, split-session flow, or "leave a
// review" form — all of that needs a real player session, so the CTA here
// is "sign in to book" instead. Fed from /api/public/venues*, which never
// returns owner_id/payout_* (see backend/src/controllers/public.controller.ts).
export default function PublicVenueDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const [venue, setVenue] = useState<PublicVenue | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dates] = useState(dateOptions);
  const [selectedDate, setSelectedDate] = useState(dates[0].date);
  const [booked, setBooked] = useState<BookedSlot[] | null>(null);

  const { reviews, average, count, hasMore, loading: reviewsLoading, loaded: reviewsLoaded, loadMore } = usePublicVenueReviews(id);

  useEffect(() => {
    if (!id) return;
    publicVenuesApi
      .get(id)
      .then(({ venue }) => setVenue(venue))
      .catch((err) => setError(err instanceof Error ? err.message : 'Could not load venue.'));
  }, [id]);

  useEffect(() => {
    if (!id) return;
    publicVenuesApi
      .availability(id, selectedDate)
      .then(({ booked }) => setBooked(booked))
      .catch(() => setBooked([]));
  }, [id, selectedDate]);

  const slots = useMemo(() => (venue ? hourSlots(venue.opening_time, venue.closing_time) : []), [venue]);
  const now = Date.now();
  // Sends the visitor back to *this* venue's real booking page after
  // they sign in/up, instead of dumping them on the generic player
  // home — see resolveNext in roleRoute.ts for how sign-in/sign-up
  // consume it.
  const bookingNext = id ? `/player/explore/${id}` : undefined;
  const signUpHref = withRole('/sign-up', 'player', bookingNext);

  if (error) {
    return (
      <ScrollView style={styles.root}>
        <PublicVenuesNav next={bookingNext} />
        <View style={styles.center}>
          <Text style={styles.error}>{error}</Text>
        </View>
      </ScrollView>
    );
  }

  if (!venue) {
    return (
      <ScrollView style={styles.root}>
        <PublicVenuesNav next={bookingNext} />
        <View style={styles.center}>
          <ActivityIndicator color={colors.accent} />
        </View>
      </ScrollView>
    );
  }

  const title = `${venue.name} — ${venue.sport} in ${venue.location} | Kicko`;
  const description = `Book ${venue.name} in ${venue.location} from KES ${venue.price_off_peak.toLocaleString()}/hr on Kicko.${count > 0 ? ` Rated ${average}/5 from ${count} review${count === 1 ? '' : 's'}.` : ''}`;

  return (
    <ScrollView style={styles.root}>
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
      </Head>
      <PublicVenuesNav next={bookingNext} />

      <View style={styles.page}>
        <View style={styles.layout}>
          <View style={styles.mainCol}>
            <View style={styles.gallery}>
              <View style={styles.galleryMain}>{venue.photos[0] && <Image source={{ uri: venue.photos[0] }} style={StyleSheet.absoluteFill} resizeMode="cover" />}</View>
              <View style={styles.gallerySide}>
                <View style={styles.gallerySideCell}>{venue.photos[1] && <Image source={{ uri: venue.photos[1] }} style={StyleSheet.absoluteFill} resizeMode="cover" />}</View>
                <View style={styles.gallerySideCell}>{venue.photos[2] && <Image source={{ uri: venue.photos[2] }} style={StyleSheet.absoluteFill} resizeMode="cover" />}</View>
              </View>
            </View>

            <Text style={styles.venueName}>{venue.name}</Text>
            <View style={styles.venueMeta}>
              {count > 0 && (
                <View style={styles.venueMetaSport}>
                  <StarRating value={average} size={14} />
                  <Text style={styles.venueMetaText}>
                    {average} ({count} review{count === 1 ? '' : 's'})
                  </Text>
                </View>
              )}
              <Text style={styles.venueMetaText}>{venue.location}</Text>
              <View style={styles.venueMetaSport}>
                <SportIcon sport={venue.sport as Sport} size={14} />
                <Text style={styles.venueMetaText}>{venue.sport}</Text>
              </View>
            </View>

            {venue.amenities.length > 0 && (
              <View style={styles.amenities}>
                {venue.amenities.map((a) => (
                  <Text key={a} style={styles.amenity}>
                    {a}
                  </Text>
                ))}
              </View>
            )}

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Pick a date</Text>
              <View style={styles.dateRow}>
                {dates.map((d) => (
                  <Pressable key={d.date} onPress={() => setSelectedDate(d.date)} style={[styles.dateChip, selectedDate === d.date && styles.dateChipActive]}>
                    <Text style={[styles.dateChipText, selectedDate === d.date && styles.dateChipTextActive]}>{d.label}</Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Available slots</Text>
              {booked === null ? (
                <ActivityIndicator color={colors.accent} />
              ) : (
                <View style={styles.slots}>
                  {slots.map((hour) => {
                    const { start, end } = slotRange(selectedDate, hour);
                    const taken = overlaps(start, end, booked);
                    const past = start.getTime() < now;
                    const disabled = taken || past;
                    const label = start.toLocaleTimeString('en-KE', { hour: 'numeric', minute: '2-digit' });
                    return (
                      <View key={hour} style={[styles.slot, disabled && styles.slotTaken]}>
                        <Text style={styles.slotText}>{label}</Text>
                      </View>
                    );
                  })}
                  {slots.length === 0 && <Text style={styles.emptyText}>This venue hasn't set its opening hours.</Text>}
                </View>
              )}
              <Text style={styles.slotsNote}>Sign in to book an open slot.</Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Reviews</Text>
              {!reviewsLoaded ? (
                <ActivityIndicator color={colors.accent} />
              ) : reviews.length === 0 ? (
                <Text style={styles.emptyText}>No reviews yet — be the first to play and review this venue.</Text>
              ) : (
                <>
                  <ReviewListPanel>
                    {reviews.map((r) => (
                      <ReviewCard key={r.id} review={r} />
                    ))}
                  </ReviewListPanel>
                  {hasMore && <LoadMoreButton onPress={loadMore} loading={reviewsLoading} />}
                </>
              )}
            </View>
          </View>

          <View style={styles.bookingCard}>
            <Text style={styles.cardTitle}>Book this venue</Text>
            <Text style={styles.priceLine}>
              KES {venue.price_peak.toLocaleString()} <Text style={styles.priceUnit}>/ hour</Text>
            </Text>
            <Text style={styles.ctaNote}>Create a free Kicko account to book a slot, pay with M-Pesa, and manage your bookings.</Text>
            <Link href={signUpHref} asChild>
              <Pressable style={styles.btn}>
                <Text style={styles.btnText}>Sign in to book</Text>
              </Pressable>
            </Link>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  page: { maxWidth: 1160, width: '100%', alignSelf: 'center', padding: 32, paddingBottom: 90 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  error: { fontFamily: fonts.sans, fontSize: 13, color: colors.danger, marginBottom: 12 },

  layout: { flexDirection: 'row', flexWrap: 'wrap', gap: 40, alignItems: 'flex-start' },
  mainCol: { flex: 1.6, minWidth: 320 },

  gallery: { flexDirection: 'row', gap: 12, height: 320, marginBottom: 28 },
  galleryMain: { flex: 1.6, borderRadius: 20, backgroundImage: `linear-gradient(135deg, ${colors.accent}, ${colors.surface2})`, overflow: 'hidden' } as any,
  gallerySide: { flex: 1, gap: 12 },
  gallerySideCell: { flex: 1, borderRadius: 16, backgroundImage: `linear-gradient(135deg, ${colors.surface2}, ${colors.accentSoft})`, overflow: 'hidden' } as any,

  venueName: { fontFamily: fonts.serif, fontSize: 26, color: colors.text, marginBottom: 6 },
  venueMeta: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 18 },
  venueMetaSport: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  venueMetaText: { fontFamily: fonts.sans, fontSize: 13.5, color: colors.textSoft, textTransform: 'capitalize' },

  amenities: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 26 },
  amenity: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.pill, paddingVertical: 8, paddingHorizontal: 16, fontFamily: fonts.sans, fontSize: 12.5, color: colors.textSoft },

  section: { marginBottom: 30 },
  sectionTitle: { fontFamily: fonts.serifMedium, fontSize: 17, color: colors.text, marginBottom: 14 },

  dateRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  dateChip: { paddingVertical: 9, paddingHorizontal: 14, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  dateChipActive: { backgroundColor: colors.accent, borderColor: 'transparent' },
  dateChipText: { fontFamily: fonts.sansSemiBold, fontSize: 12.5, color: colors.textSoft },
  dateChipTextActive: { color: colors.accentText },

  slots: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  slot: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 12, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  slotTaken: { opacity: 0.35 },
  slotText: { fontFamily: fonts.sansSemiBold, fontSize: 13, color: colors.text },
  slotsNote: { fontFamily: fonts.sans, fontSize: 12, color: colors.textSoft, marginTop: 12 },
  emptyText: { fontFamily: fonts.sans, fontSize: 13, color: colors.textSoft },

  bookingCard: {
    flex: 1,
    minWidth: 300,
    maxWidth: 380,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: 24,
    position: 'sticky' as any,
    top: 20,
  },
  cardTitle: { fontFamily: fonts.sansSemiBold, fontSize: 14, color: colors.textSoft, marginBottom: 12 },
  priceLine: { fontFamily: fonts.serif, fontSize: 24, fontWeight: '700', color: colors.text, marginBottom: 18 },
  priceUnit: { fontFamily: fonts.sans, fontSize: 14, fontWeight: '400', color: colors.textSoft },
  ctaNote: { fontFamily: fonts.sans, fontSize: 13, color: colors.textSoft, lineHeight: 19, marginBottom: 18 },

  btn: { backgroundColor: colors.accent, borderRadius: radius.pill, paddingVertical: 14, alignItems: 'center' },
  btnText: { fontFamily: fonts.sansBold, fontSize: 14, color: colors.accentText },
});
