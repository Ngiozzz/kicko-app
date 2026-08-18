import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { colors, fonts, radius } from '@kicko/shared';
import { bookingsApi, Booking } from '../../../src/lib/bookingsApi';
import { SportIcon, Sport } from '../../../src/components/SportIcon';
import { useBreadcrumb } from '../../../src/lib/breadcrumbContext';

function statusBadge(b: Booking): { label: string; tone: 'good' | 'warn' | 'bad' } {
  if (b.status === 'cancelled') return { label: `Cancelled${b.refund_pct ? ` · ${b.refund_pct}% refunded` : ''}`, tone: 'bad' };
  if (b.status === 'completed') return { label: 'Completed', tone: 'good' };
  if (b.payment_status === 'paid') return { label: 'Confirmed', tone: 'good' };
  return { label: 'Awaiting payment', tone: 'warn' };
}

// Short form of statusBadge's label for the breadcrumb's last segment —
// no refund-percentage suffix, that belongs in the page body, not the trail.
function bookingCrumbLabel(b: Booking): string {
  if (b.status === 'cancelled') return 'Cancelled';
  if (b.status === 'completed') return 'Completed';
  if (b.payment_status === 'paid') return 'Confirmed';
  return 'Awaiting payment';
}

export default function BookingDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [booking, setBooking] = useState<Booking | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    try {
      const { booking } = await bookingsApi.get(id);
      setBooking(booking);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load this booking.');
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  async function handleCancel() {
    if (!booking) return;
    setCancelling(true);
    setError(null);
    try {
      const { booking: updated } = await bookingsApi.cancel(booking.id);
      setBooking(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not cancel this booking.');
    } finally {
      setCancelling(false);
    }
  }

  useBreadcrumb(
    booking
      ? [
          { label: 'Home', href: '/player' },
          { label: 'Bookings', href: '/player/bookings' },
          { label: booking.venue.name, href: `/player/explore/${booking.venue.id}` },
          { label: bookingCrumbLabel(booking) },
        ]
      : null
  );

  if (error && !booking) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>{error}</Text>
      </View>
    );
  }
  if (!booking) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  const badge = statusBadge(booking);
  const canCancel = booking.status === 'pending_payment' || booking.status === 'confirmed';

  return (
    <View style={styles.layout}>
      <View style={styles.mainCol}>
        <View style={styles.titleRow}>
          <SportIcon sport={booking.venue.sport as Sport} size={22} />
          <Text style={styles.title}>{booking.venue.name}</Text>
        </View>
        <Text style={styles.subtitle}>{booking.venue.location}</Text>
        <Text style={styles.subtitle}>
          {new Date(booking.start_at).toLocaleString('en-KE', { weekday: 'long', day: 'numeric', month: 'long', hour: 'numeric', minute: '2-digit' })} –{' '}
          {new Date(booking.end_at).toLocaleTimeString('en-KE', { hour: 'numeric', minute: '2-digit' })}
        </Text>

        {booking.status === 'cancelled' && (
          <View style={styles.reasonBox}>
            <Text style={styles.reasonLabel}>Cancelled</Text>
            <Text style={styles.reasonText}>
              {booking.cancelled_at && new Date(booking.cancelled_at).toLocaleString('en-KE', { weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })}
              {booking.refund_amount != null && booking.refund_amount > 0
                ? ` — KES ${booking.refund_amount.toLocaleString()} refunded (${booking.refund_pct}% of the venue rate, per the cancellation policy).`
                : ' — no refund was due at the time of cancellation.'}
            </Text>
          </View>
        )}

        <Pressable style={styles.rebookBtn} onPress={() => router.push(`/player/explore/${booking.venue.id}`)}>
          <Text style={styles.rebookBtnText}>Book {booking.venue.name} again →</Text>
        </Pressable>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Booking details</Text>
        <Text style={[styles.badge, styles[`badge_${badge.tone}`]]}>{badge.label}</Text>

        <View style={styles.breakdown}>
          <View style={styles.breakdownRow}>
            <Text style={styles.breakdownLabel}>Slot (1 hr){booking.is_walk_in ? ' · walk-in' : ''}</Text>
            <Text style={styles.breakdownValue}>KES {booking.subtotal.toLocaleString()}</Text>
          </View>
          <View style={styles.breakdownRow}>
            <Text style={styles.breakdownLabel}>Booking fee</Text>
            <Text style={styles.breakdownValue}>KES {booking.service_fee.toLocaleString()}</Text>
          </View>
          <View style={[styles.breakdownRow, styles.breakdownTotal]}>
            <Text style={styles.breakdownTotalLabel}>Total paid</Text>
            <Text style={styles.breakdownTotalValue}>KES {booking.total_amount.toLocaleString()}</Text>
          </View>
        </View>

        {error && <Text style={styles.error}>{error}</Text>}

        {canCancel && (
          <Pressable disabled={cancelling} onPress={handleCancel} style={[styles.btn, styles.btnDanger, cancelling && styles.btnDisabled]}>
            <Text style={styles.btnDangerText}>{cancelling ? 'Cancelling…' : 'Cancel booking'}</Text>
          </Pressable>
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

  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6 },
  title: { fontFamily: fonts.serif, fontSize: 26, color: colors.text },
  subtitle: { fontFamily: fonts.sans, fontSize: 13.5, color: colors.textSoft, marginBottom: 4 },

  reasonBox: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: 16,
    marginTop: 20,
  },
  reasonLabel: { fontFamily: fonts.sansBold, fontSize: 10.5, textTransform: 'uppercase', letterSpacing: 0.5, color: colors.danger, marginBottom: 6 },
  reasonText: { fontFamily: fonts.sans, fontSize: 13, color: colors.text, lineHeight: 19 },

  rebookBtn: { marginTop: 24 },
  rebookBtnText: { fontFamily: fonts.sansSemiBold, fontSize: 13.5, color: colors.accent, textDecorationLine: 'underline' },

  card: { flex: 1, minWidth: 300, maxWidth: 380, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, padding: 24 },
  cardTitle: { fontFamily: fonts.sansSemiBold, fontSize: 14, color: colors.textSoft, marginBottom: 12 },

  badge: { alignSelf: 'flex-start', fontFamily: fonts.sansSemiBold, fontSize: 11.5, paddingVertical: 6, paddingHorizontal: 12, borderRadius: radius.pill, overflow: 'hidden' },
  badge_good: { backgroundColor: colors.accentSoft, color: colors.accent },
  badge_warn: { backgroundColor: colors.surface2, color: colors.textSoft },
  badge_bad: { backgroundColor: colors.surface2, color: colors.danger },

  breakdown: { marginTop: 20, paddingTop: 16, borderTopWidth: 1, borderTopColor: colors.border },
  breakdownRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 },
  breakdownLabel: { fontFamily: fonts.sans, fontSize: 13, color: colors.textSoft },
  breakdownValue: { fontFamily: fonts.sans, fontSize: 13, color: colors.text },
  breakdownTotal: { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 10, marginTop: 2 },
  breakdownTotalLabel: { fontFamily: fonts.sansBold, fontSize: 15, color: colors.text },
  breakdownTotalValue: { fontFamily: fonts.sansBold, fontSize: 15, color: colors.text },

  btn: { marginTop: 20, borderRadius: radius.pill, paddingVertical: 13, alignItems: 'center' },
  btnDisabled: { opacity: 0.4 },
  btnDanger: { borderWidth: 1, borderColor: colors.danger, backgroundColor: 'transparent' },
  btnDangerText: { fontFamily: fonts.sansBold, fontSize: 13.5, color: colors.danger },
});
