import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Link, useLocalSearchParams, useRouter } from 'expo-router';
import { colors, fonts, radius } from '@kicko/shared';
import { exploreApi, Venue, BookedSlot } from '../../../src/lib/venuesApi';
import { bookingsApi, paymentsApi, Booking, Payment } from '../../../src/lib/bookingsApi';
import { sessionsApi } from '../../../src/lib/sessionsApi';
import { settingsApi, computeServiceFee, ServiceFeeTier } from '../../../src/lib/settingsApi';
import { reviewsApi } from '../../../src/lib/reviewsApi';
import { useVenueReviews } from '../../../src/lib/useVenueReviews';
import { SportIcon, Sport } from '../../../src/components/SportIcon';
import { StarRating, StarRatingInput } from '../../../src/components/StarRating';
import { ReviewCard, ReviewListPanel, LoadMoreButton } from '../../../src/components/ReviewList';
import { dateOptions, hourSlots, slotRange, overlaps } from '../../../src/lib/slots';

// Admin-editable via /admin-dashboard/settings — this is only a preview
// before submitting; the server recomputes and is the source of truth for
// what's actually charged. Defaults match platform_settings' own defaults
// so the preview is correct even before the fetch below resolves.
const DEFAULT_SERVICE_FEE_TIERS: ServiceFeeTier[] = [
  { max: 99.99, fee: 10 },
  { max: 999.99, fee: 20 },
  { max: 1999.99, fee: 50 },
  { max: null, fee: 100 },
];

type Stage = 'form' | 'stk' | 'success';
type BookingMode = 'solo' | 'split';

// Must match MAX_BOOKING_HOURS in backend/src/services/pricing.service.ts
// — kept as a UI-side cap on how far a click can extend the selection.
const MAX_BOOKING_HOURS = 12;

export default function ExploreVenueDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [venue, setVenue] = useState<Venue | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dates] = useState(dateOptions);
  const [selectedDate, setSelectedDate] = useState(dates[0].date);
  const [booked, setBooked] = useState<BookedSlot[] | null>(null);
  // Contiguous hours only, kept sorted ascending — see handleSlotPress for
  // how clicks extend/shrink the range. Matches MAX_BOOKING_HOURS on the
  // backend (pricing.service.ts).
  const [selectedHours, setSelectedHours] = useState<number[]>([]);
  const [phone, setPhone] = useState('');
  const [mode, setMode] = useState<BookingMode>('solo');
  const [stage, setStage] = useState<Stage>('form');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [booking, setBooking] = useState<Booking | null>(null);
  const [payment, setPayment] = useState<Payment | null>(null);
  const [serviceFeeTiers, setServiceFeeTiers] = useState<ServiceFeeTier[]>(DEFAULT_SERVICE_FEE_TIERS);

  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const { reviews, average, count, eligibleBookingId, hasMore, loading: reviewsLoading, loaded: reviewsLoaded, loadMore, refresh: refreshReviews } = useVenueReviews(id);

  useEffect(() => {
    if (!id) return;
    exploreApi
      .get(id)
      .then(({ venue }) => setVenue(venue))
      .catch((err) => setError(err instanceof Error ? err.message : 'Could not load venue.'));
  }, [id]);

  async function submitReview() {
    if (!id || !eligibleBookingId) return;
    setSubmittingReview(true);
    setReviewError(null);
    try {
      await reviewsApi.create(id, { booking_id: eligibleBookingId, rating: reviewRating, comment: reviewComment.trim() || undefined });
      setReviewComment('');
      setReviewRating(5);
      refreshReviews();
    } catch (err) {
      setReviewError(err instanceof Error ? err.message : 'Could not save your review.');
    } finally {
      setSubmittingReview(false);
    }
  }

  useEffect(() => {
    settingsApi
      .get()
      .then(({ settings }) => setServiceFeeTiers(settings.service_fee_tiers))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!id) return;
    setSelectedHours([]);
    exploreApi
      .availability(id, selectedDate)
      .then(({ booked }) => setBooked(booked))
      .catch(() => setBooked([]));
  }, [id, selectedDate]);

  const slots = useMemo(() => (venue ? hourSlots(venue.opening_time, venue.closing_time) : []), [venue]);
  const now = Date.now();

  const sortedHours = useMemo(() => [...selectedHours].sort((a, b) => a - b), [selectedHours]);
  const hours = sortedHours.length;
  const selectionRange = useMemo(() => {
    if (hours === 0) return null;
    return { start: slotRange(selectedDate, sortedHours[0]).start, end: slotRange(selectedDate, sortedHours[hours - 1]).end };
  }, [selectedDate, sortedHours, hours]);

  // Clicking a slot extends the current range by exactly one adjacent
  // hour, shrinks it from an endpoint, toggles off a lone selection, or
  // (for any other click) starts a fresh single-hour selection — this
  // keeps the range contiguous by construction, so it can never span over
  // a taken hour that was never actually clicked.
  function handleSlotPress(hour: number) {
    setSelectedHours((prev) => {
      if (prev.length === 0) return [hour];
      const min = prev[0];
      const max = prev[prev.length - 1];
      if (prev.length === 1 && hour === min) return [];
      if ((hour === max + 1 || hour === min - 1) && prev.length >= MAX_BOOKING_HOURS) return prev;
      if (hour === max + 1) return [...prev, hour];
      if (hour === min - 1) return [hour, ...prev];
      if (hour === max && prev.length > 1) return prev.filter((h) => h !== max);
      if (hour === min && prev.length > 1) return prev.filter((h) => h !== min);
      return [hour];
    });
  }

  const subtotal = (venue?.price_peak ?? 0) * hours;
  const serviceFee = computeServiceFee(subtotal, serviceFeeTiers);
  const total = subtotal + serviceFee;

  async function submitBooking() {
    if (!venue || !selectionRange) return;
    if (!phone.trim()) {
      setFormError('Enter the phone number to receive the M-Pesa prompt on.');
      return;
    }
    setFormError(null);
    setSubmitting(true);
    try {
      const { booking, payment } = await bookingsApi.create({
        venue_id: venue.id,
        start_at: selectionRange.start.toISOString(),
        end_at: selectionRange.end.toISOString(),
        phone_number: phone.trim(),
      });
      setBooking(booking);
      setPayment(payment);
      setStage('stk');
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Could not start this booking.');
    } finally {
      setSubmitting(false);
    }
  }

  async function submitSession() {
    if (!venue || !selectionRange) return;
    setFormError(null);
    setSubmitting(true);
    try {
      const { session } = await sessionsApi.create({ venue_id: venue.id, start_at: selectionRange.start.toISOString(), end_at: selectionRange.end.toISOString() });
      router.push(`/player/sessions/${session.id}`);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Could not start a match session.');
    } finally {
      setSubmitting(false);
    }
  }

  async function simulateConfirm() {
    if (!payment) return;
    setSubmitting(true);
    try {
      const { booking } = await paymentsApi.confirm(payment.id);
      setBooking(booking);
      setStage('success');
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Could not confirm payment.');
    } finally {
      setSubmitting(false);
    }
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>{error}</Text>
      </View>
    );
  }

  if (!venue) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  return (
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
                const selected = sortedHours.includes(hour);
                const label = start.toLocaleTimeString('en-KE', { hour: 'numeric', minute: '2-digit' });
                return (
                  <Pressable
                    key={hour}
                    disabled={disabled}
                    onPress={() => handleSlotPress(hour)}
                    style={[styles.slot, disabled && styles.slotTaken, selected && styles.slotSelected]}
                  >
                    <Text style={[styles.slotText, selected && styles.slotTextSelected]}>{label}</Text>
                  </Pressable>
                );
              })}
              {slots.length === 0 && <Text style={styles.emptyText}>This venue hasn't set its opening hours.</Text>}
            </View>
          )}
          {hours > 0 && (
            <Text style={styles.slotsHint}>
              {hours} hour{hours === 1 ? '' : 's'} selected — click an edge slot to extend, or a highlighted slot to shrink.
            </Text>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Reviews</Text>

          {eligibleBookingId && (
            <View style={styles.reviewForm}>
              <Text style={styles.reviewFormLabel}>You played here — leave a review</Text>
              <StarRatingInput value={reviewRating} onChange={setReviewRating} />
              <TextInput
                value={reviewComment}
                onChangeText={setReviewComment}
                placeholder="How was it? (optional)"
                placeholderTextColor={colors.textSoft}
                multiline
                numberOfLines={2}
                style={styles.reviewInput}
              />
              {reviewError && <Text style={styles.error}>{reviewError}</Text>}
              <Pressable disabled={submittingReview} onPress={submitReview} style={[styles.reviewSubmitBtn, submittingReview && styles.btnDisabled]}>
                <Text style={styles.reviewSubmitBtnText}>{submittingReview ? 'Saving…' : 'Post review'}</Text>
              </Pressable>
            </View>
          )}

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
        {stage === 'form' && (
          <>
            <Text style={styles.cardTitle}>Book this venue</Text>
            <Text style={styles.priceLine}>
              KES {venue.price_peak.toLocaleString()} <Text style={styles.priceUnit}>/ hour</Text>
            </Text>

            <View style={styles.modeToggle}>
              <Pressable onPress={() => setMode('solo')} style={[styles.modeOption, mode === 'solo' && styles.modeOptionActive]}>
                <Text style={[styles.modeOptionText, mode === 'solo' && styles.modeOptionTextActive]}>Book solo</Text>
              </Pressable>
              <Pressable onPress={() => setMode('split')} style={[styles.modeOption, mode === 'split' && styles.modeOptionActive]}>
                <Text style={[styles.modeOptionText, mode === 'split' && styles.modeOptionTextActive]}>Split with friends</Text>
              </Pressable>
            </View>

            <Text style={styles.fieldLabel}>Date &amp; time</Text>
            <View style={styles.fieldValue}>
              <Text style={styles.fieldValueText}>
                {!selectionRange
                  ? 'Pick one or more slots on the left'
                  : `${dates.find((d) => d.date === selectedDate)?.label}, ${selectionRange.start.toLocaleTimeString('en-KE', { hour: 'numeric', minute: '2-digit' })} – ${selectionRange.end.toLocaleTimeString('en-KE', { hour: 'numeric', minute: '2-digit' })} (${hours} hr${hours === 1 ? '' : 's'})`}
              </Text>
            </View>

            {mode === 'solo' ? (
              <>
                <Text style={styles.fieldLabel}>M-Pesa phone number</Text>
                <TextInput
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="+254 7XX XXX XXX"
                  placeholderTextColor={colors.textSoft}
                  style={styles.phoneInput}
                />

                <View style={styles.breakdown}>
                  <View style={styles.breakdownRow}>
                    <Text style={styles.breakdownLabel}>Slot ({hours} hr{hours === 1 ? '' : 's'})</Text>
                    <Text style={styles.breakdownValue}>KES {subtotal.toLocaleString()}</Text>
                  </View>
                  <View style={styles.breakdownRow}>
                    <Text style={styles.breakdownLabel}>Booking fee</Text>
                    <Text style={styles.breakdownValue}>KES {serviceFee.toLocaleString()}</Text>
                  </View>
                  <View style={[styles.breakdownRow, styles.breakdownTotal]}>
                    <Text style={styles.breakdownTotalLabel}>Total</Text>
                    <Text style={styles.breakdownTotalValue}>KES {total.toLocaleString()}</Text>
                  </View>
                </View>

                {formError && <Text style={styles.error}>{formError}</Text>}

                <Pressable
                  disabled={!selectionRange || submitting}
                  onPress={submitBooking}
                  style={[styles.btn, (!selectionRange || submitting) && styles.btnDisabled]}
                >
                  <Text style={styles.btnText}>{submitting ? 'Starting…' : 'Continue to pay with M-Pesa'}</Text>
                </Pressable>
              </>
            ) : (
              <>
                <Text style={styles.splitNote}>
                  You'll invite two sides (home &amp; away), each led by a captain, and everyone pays their own share once the roster's set.
                </Text>

                {formError && <Text style={styles.error}>{formError}</Text>}

                <Pressable
                  disabled={!selectionRange || submitting}
                  onPress={submitSession}
                  style={[styles.btn, (!selectionRange || submitting) && styles.btnDisabled]}
                >
                  <Text style={styles.btnText}>{submitting ? 'Starting…' : 'Start a match session'}</Text>
                </Pressable>
              </>
            )}
          </>
        )}

        {stage === 'stk' && payment && (
          <View style={styles.stkPanel}>
            <Text style={styles.stkIcon}>📱</Text>
            <Text style={styles.stkTitle}>STK push sent</Text>
            <Text style={styles.stkBody}>
              Check <Text style={styles.stkStrong}>{payment.phone_number}</Text> and enter your M-Pesa PIN to pay{' '}
              <Text style={styles.stkStrong}>KES {payment.amount.toLocaleString()}</Text>.
            </Text>
            {formError && <Text style={styles.error}>{formError}</Text>}
            <Pressable onPress={simulateConfirm} disabled={submitting}>
              <Text style={styles.confirmLink}>{submitting ? 'Confirming…' : 'Simulate M-Pesa confirmation →'}</Text>
            </Pressable>
          </View>
        )}

        {stage === 'success' && booking && (
          <View style={styles.stkPanel}>
            <Text style={styles.stkIcon}>✅</Text>
            <Text style={styles.stkTitle}>Booking confirmed</Text>
            <Text style={styles.stkBody}>
              KES {booking.total_amount.toLocaleString()} paid via M-Pesa. {venue.name},{' '}
              {new Date(booking.start_at).toLocaleString('en-KE', { weekday: 'short', hour: 'numeric', minute: '2-digit' })}.
            </Text>
            <Pressable style={styles.btn} onPress={() => router.push('/player/bookings')}>
              <Text style={styles.btnText}>View my bookings</Text>
            </Pressable>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
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
  slotSelected: { backgroundColor: colors.accent, borderColor: 'transparent' },
  slotText: { fontFamily: fonts.sansSemiBold, fontSize: 13, color: colors.text },
  slotTextSelected: { color: colors.accentText },
  slotsHint: { fontFamily: fonts.sans, fontSize: 12, color: colors.textSoft, marginTop: 10 },
  emptyText: { fontFamily: fonts.sans, fontSize: 13, color: colors.textSoft },

  reviewForm: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: 16, marginBottom: 20 },
  reviewFormLabel: { fontFamily: fonts.sansSemiBold, fontSize: 13, color: colors.text, marginBottom: 10 },
  reviewInput: {
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 12,
    marginTop: 12,
    fontFamily: fonts.sans,
    fontSize: 13.5,
    color: colors.text,
    minHeight: 60,
    textAlignVertical: 'top',
  },
  reviewSubmitBtn: { alignSelf: 'flex-start', marginTop: 12, backgroundColor: colors.accent, borderRadius: radius.pill, paddingVertical: 10, paddingHorizontal: 18 },
  reviewSubmitBtnText: { fontFamily: fonts.sansBold, fontSize: 13, color: colors.accentText },

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

  modeToggle: { flexDirection: 'row', backgroundColor: colors.bg, borderRadius: radius.pill, padding: 4, marginBottom: 6, gap: 4 },
  modeOption: { flex: 1, paddingVertical: 8, borderRadius: radius.pill, alignItems: 'center' },
  modeOptionActive: { backgroundColor: colors.accent },
  modeOptionText: { fontFamily: fonts.sansSemiBold, fontSize: 12.5, color: colors.textSoft },
  modeOptionTextActive: { color: colors.accentText },
  splitNote: { fontFamily: fonts.sans, fontSize: 13, color: colors.textSoft, lineHeight: 19, marginTop: 14, marginBottom: 4 },

  fieldLabel: { fontFamily: fonts.sansBold, fontSize: 11.5, textTransform: 'uppercase', letterSpacing: 0.5, color: colors.textSoft, marginTop: 16, marginBottom: 6 },
  fieldValue: { backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 14 },
  fieldValueText: { fontFamily: fonts.sans, fontSize: 14, color: colors.text },
  phoneInput: {
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    fontFamily: fonts.sans,
    fontSize: 14,
    color: colors.text,
    outlineStyle: 'none',
  } as any,

  breakdown: { marginTop: 18, paddingTop: 16, borderTopWidth: 1, borderTopColor: colors.border },
  breakdownRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 },
  breakdownLabel: { fontFamily: fonts.sans, fontSize: 13, color: colors.textSoft },
  breakdownValue: { fontFamily: fonts.sans, fontSize: 13, color: colors.text },
  breakdownTotal: { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 10, marginTop: 2 },
  breakdownTotalLabel: { fontFamily: fonts.sansBold, fontSize: 15, color: colors.text },
  breakdownTotalValue: { fontFamily: fonts.sansBold, fontSize: 15, color: colors.text },

  btn: { marginTop: 18, backgroundColor: colors.accent, borderRadius: radius.pill, paddingVertical: 14, alignItems: 'center' },
  btnDisabled: { opacity: 0.4 },
  btnText: { fontFamily: fonts.sansBold, fontSize: 14, color: colors.accentText },

  stkPanel: { alignItems: 'center', paddingVertical: 6 },
  stkIcon: { fontSize: 32, marginBottom: 10 },
  stkTitle: { fontFamily: fonts.serifMedium, fontSize: 16, color: colors.text, marginBottom: 8 },
  stkBody: { fontFamily: fonts.sans, fontSize: 13, color: colors.textSoft, textAlign: 'center', lineHeight: 19, marginBottom: 16 },
  stkStrong: { fontFamily: fonts.sansBold, color: colors.text },
  confirmLink: { fontFamily: fonts.sansSemiBold, fontSize: 12.5, color: colors.accent, textDecorationLine: 'underline' },
});
