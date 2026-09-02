import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { colors, fonts, radius } from '@kicko/shared';
import { bookingsApi, paymentsApi, Booking, BookingParticipant, Payment } from '../../../src/lib/bookingsApi';
import { SportIcon, Sport } from '../../../src/components/SportIcon';
import { getSportContent } from '../../../src/content/sportContent';
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
  const [participants, setParticipants] = useState<BookingParticipant[]>([]);
  const [myParticipant, setMyParticipant] = useState<BookingParticipant | null>(null);
  const [isOrganizer, setIsOrganizer] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [responding, setResponding] = useState(false);
  const [sharePhone, setSharePhone] = useState('');
  const [payingShare, setPayingShare] = useState(false);
  const [pendingSharePayment, setPendingSharePayment] = useState<Payment | null>(null);
  const [canClaimOpenSlot, setCanClaimOpenSlot] = useState(false);
  const [claiming, setClaiming] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    try {
      const res = await bookingsApi.get(id);
      setBooking(res.booking);
      setParticipants(res.participants ?? []);
      setMyParticipant(res.my_participant ?? null);
      setIsOrganizer(res.is_organizer ?? false);
      setCanClaimOpenSlot(res.can_claim_open_slot ?? false);
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

  async function handleRespond(accept: boolean) {
    if (!booking) return;
    setResponding(true);
    setError(null);
    try {
      const { booking: updated } = await bookingsApi.respond(booking.id, accept);
      setBooking(updated);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not respond to this invite.');
    } finally {
      setResponding(false);
    }
  }

  async function handlePayShare() {
    if (!booking || !sharePhone.trim()) {
      setError('Enter the phone number to receive the M-Pesa prompt on.');
      return;
    }
    setPayingShare(true);
    setError(null);
    try {
      const { payment } = await bookingsApi.paySplitShare(booking.id, sharePhone.trim());
      setPendingSharePayment(payment);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not start payment.');
    } finally {
      setPayingShare(false);
    }
  }

  async function handleClaimOpenSlot() {
    if (!booking) return;
    setClaiming(true);
    setError(null);
    try {
      await bookingsApi.claimOpenSlot(booking.id);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not claim this spot.');
    } finally {
      setClaiming(false);
    }
  }

  async function handleSimulateConfirmShare() {
    if (!pendingSharePayment) return;
    setPayingShare(true);
    setError(null);
    try {
      const { booking: updated } = await paymentsApi.confirmSplitShare(pendingSharePayment.id);
      setPendingSharePayment(null);
      setBooking(updated);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not confirm payment.');
    } finally {
      setPayingShare(false);
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
  const isSplit = booking.booking_type === 'split';
  const canCancel = (booking.status === 'pending_payment' || booking.status === 'confirmed') && (!isSplit || isOrganizer);
  const iCanRespond = isSplit && myParticipant?.status === 'invited';
  const iCanPayShare = isSplit && booking.status === 'pending_payment' && myParticipant?.status === 'accepted' && !myParticipant.paid;

  return (
    <View style={styles.layout}>
      <View style={styles.mainCol}>
        <View style={styles.titleRow}>
          <SportIcon sport={booking.venue.sport as Sport} size={22} />
          <Text style={styles.title}>{booking.venue.name}</Text>
          {booking.format && (
            <Text style={styles.formatTag}>
              {getSportContent(booking.venue.sport).sessionFormats.find((f) => f.key === booking.format)?.label ?? booking.format}
            </Text>
          )}
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
            <Text style={styles.breakdownTotalLabel}>{isSplit ? `Total (split ${participants.length} ways)` : 'Total paid'}</Text>
            <Text style={styles.breakdownTotalValue}>KES {booking.total_amount.toLocaleString()}</Text>
          </View>
        </View>

        {isSplit && (
          <View style={styles.participants}>
            <Text style={styles.participantsTitle}>
              {participants.length === 2 ? 'Singles' : 'Doubles'} — who's playing{booking.is_open ? ' (open to the public)' : ''}
            </Text>
            {participants.map((p) => (
              <View key={p.id} style={styles.participantRow}>
                <Text style={styles.participantName}>
                  {p.status === 'open' ? 'Open spot — anyone can claim it' : p.user?.name}{' '}
                  {p.is_organizer && <Text style={styles.organizerTag}>Organizer</Text>}
                </Text>
                <Text style={styles.participantStatus}>
                  {p.status === 'open'
                    ? 'Waiting for a player'
                    : p.status === 'invited'
                      ? 'Invited'
                      : p.status === 'declined'
                        ? 'Declined'
                        : p.paid
                          ? 'Paid'
                          : 'Accepted — awaiting payment'}
                </Text>
              </View>
            ))}
          </View>
        )}

        {error && <Text style={styles.error}>{error}</Text>}

        {canClaimOpenSlot && (
          <Pressable disabled={claiming} onPress={handleClaimOpenSlot} style={[styles.btn, claiming && styles.btnDisabled]}>
            <Text style={styles.btnText}>{claiming ? 'Claiming…' : 'Claim this spot'}</Text>
          </Pressable>
        )}

        {iCanRespond && (
          <View style={styles.inviteRow}>
            <Pressable disabled={responding} onPress={() => handleRespond(true)} style={[styles.btn, styles.btnInline]}>
              <Text style={styles.btnText}>Accept</Text>
            </Pressable>
            <Pressable disabled={responding} onPress={() => handleRespond(false)} style={[styles.btn, styles.btnOutline, styles.btnInline]}>
              <Text style={styles.btnOutlineText}>Decline</Text>
            </Pressable>
          </View>
        )}

        {iCanPayShare &&
          (!pendingSharePayment ? (
            <>
              <Text style={styles.fieldLabel}>Your share: KES {myParticipant?.share_amount.toLocaleString()}</Text>
              <TextInput
                value={sharePhone}
                onChangeText={setSharePhone}
                placeholder="+254 7XX XXX XXX"
                placeholderTextColor={colors.textSoft}
                style={styles.phoneInput}
              />
              <Pressable disabled={payingShare} onPress={handlePayShare} style={[styles.btn, payingShare && styles.btnDisabled]}>
                <Text style={styles.btnText}>{payingShare ? 'Starting…' : 'Pay my share with M-Pesa'}</Text>
              </Pressable>
            </>
          ) : (
            <View style={styles.stkPanel}>
              <Text style={styles.stkBody}>
                Check <Text style={styles.stkStrong}>{pendingSharePayment.phone_number}</Text> and enter your M-Pesa PIN to pay{' '}
                <Text style={styles.stkStrong}>KES {pendingSharePayment.amount.toLocaleString()}</Text>.
              </Text>
              <Pressable onPress={handleSimulateConfirmShare} disabled={payingShare}>
                <Text style={styles.confirmLink}>{payingShare ? 'Confirming…' : 'Simulate M-Pesa confirmation →'}</Text>
              </Pressable>
            </View>
          ))}

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
  formatTag: {
    fontFamily: fonts.sansBold,
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    color: colors.accent,
    backgroundColor: colors.accentSoft,
    paddingVertical: 4,
    paddingHorizontal: 9,
    borderRadius: radius.pill,
  },
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

  btn: { marginTop: 20, backgroundColor: colors.accent, borderRadius: radius.pill, paddingVertical: 13, alignItems: 'center' },
  btnInline: { flex: 1, marginTop: 0 },
  btnDisabled: { opacity: 0.4 },
  btnDanger: { borderWidth: 1, borderColor: colors.danger, backgroundColor: 'transparent' },
  btnDangerText: { fontFamily: fonts.sansBold, fontSize: 13.5, color: colors.danger },
  btnText: { fontFamily: fonts.sansBold, fontSize: 13.5, color: colors.accentText },
  btnOutline: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: colors.border },
  btnOutlineText: { fontFamily: fonts.sansBold, fontSize: 13.5, color: colors.text },

  fieldLabel: { fontFamily: fonts.sansBold, fontSize: 11.5, textTransform: 'uppercase', letterSpacing: 0.5, color: colors.textSoft, marginTop: 20, marginBottom: 8 },
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
  },

  inviteRow: { flexDirection: 'row', gap: 10, marginTop: 20 },

  stkPanel: { marginTop: 20, alignItems: 'center' },
  stkBody: { fontFamily: fonts.sans, fontSize: 13, color: colors.textSoft, textAlign: 'center', lineHeight: 19, marginBottom: 12 },
  stkStrong: { fontFamily: fonts.sansBold, color: colors.text },
  confirmLink: { fontFamily: fonts.sansSemiBold, fontSize: 12.5, color: colors.accent, textDecorationLine: 'underline' },

  participants: { marginTop: 20, paddingTop: 16, borderTopWidth: 1, borderTopColor: colors.border },
  participantsTitle: { fontFamily: fonts.sansSemiBold, fontSize: 12.5, color: colors.textSoft, marginBottom: 10 },
  participantRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6 },
  participantName: { fontFamily: fonts.sansMedium, fontSize: 13.5, color: colors.text },
  organizerTag: { fontFamily: fonts.sans, fontSize: 11, color: colors.textSoft },
  participantStatus: { fontFamily: fonts.sans, fontSize: 12.5, color: colors.textSoft },
});
