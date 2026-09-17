import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { colors, fonts, radius } from '@kicko/shared';
import { venuePhotoAssistApi, Venue } from '../../lib/venuesApi';

const FEE = 500;

// Lets an owner who can't (or doesn't want to) upload their own photos pay
// admin to add them instead — same STK "form -> pending -> simulate
// confirmation -> success" flow used for bookings/session payments, just
// scoped to this one flat fee (see venues.controller.ts#requestVenuePhotoAssist).
export function PhotoAssistCard({
  venueId,
  requested,
  onConfirmed,
}: {
  venueId: string;
  requested: boolean;
  onConfirmed: (venue: Venue) => void;
}) {
  const [stage, setStage] = useState<'idle' | 'form' | 'stk' | 'success'>('idle');
  const [phone, setPhone] = useState('');
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (!phone.trim()) {
      setError('Enter the phone number to receive the M-Pesa prompt on.');
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const { payment } = await venuePhotoAssistApi.request(venueId, phone.trim());
      setPaymentId(payment.id);
      setStage('stk');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not start this payment.');
    } finally {
      setSubmitting(false);
    }
  }

  async function simulateConfirm() {
    if (!paymentId) return;
    setSubmitting(true);
    try {
      const { venue } = await venuePhotoAssistApi.confirm(paymentId);
      onConfirmed(venue);
      setStage('success');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not confirm payment.');
    } finally {
      setSubmitting(false);
    }
  }

  if (requested || stage === 'success') {
    return (
      <View style={styles.card}>
        <Text style={styles.doneTitle}>✓ Photo help requested</Text>
        <Text style={styles.body}>Our team will add photos to this venue shortly.</Text>
      </View>
    );
  }

  if (stage === 'idle') {
    return (
      <View style={styles.card}>
        <Text style={styles.title}>Can't add photos yourself?</Text>
        <Text style={styles.body}>Pay a flat KES {FEE} and our team will add photos to this venue for you.</Text>
        <Pressable onPress={() => setStage('form')} style={styles.linkBtn}>
          <Text style={styles.linkBtnText}>Ask admin to add photos →</Text>
        </Pressable>
      </View>
    );
  }

  if (stage === 'form') {
    return (
      <View style={styles.card}>
        <Text style={styles.title}>Ask admin to add photos</Text>
        <Text style={styles.body}>KES {FEE} · you'll get an M-Pesa prompt on the number below.</Text>
        <TextInput
          value={phone}
          onChangeText={setPhone}
          placeholder="0712345678"
          placeholderTextColor={colors.textSoft}
          keyboardType="phone-pad"
          style={styles.input}
        />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <View style={styles.row}>
          <Pressable onPress={submit} disabled={submitting} style={[styles.payBtn, submitting && styles.btnDisabled]}>
            <Text style={styles.payBtnText}>{submitting ? 'Starting…' : `Pay KES ${FEE}`}</Text>
          </Pressable>
          <Pressable onPress={() => setStage('idle')} disabled={submitting}>
            <Text style={styles.cancelText}>Cancel</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  // stage === 'stk'
  return (
    <View style={styles.card}>
      <Text style={styles.title}>Check your phone</Text>
      <Text style={styles.body}>
        Check <Text style={styles.strong}>{phone}</Text> and enter your M-Pesa PIN to pay KES {FEE}.
      </Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Pressable onPress={simulateConfirm} disabled={submitting} style={styles.linkBtn}>
        <Text style={styles.linkBtnText}>{submitting ? 'Confirming…' : 'Simulate M-Pesa confirmation →'}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, padding: 16 },
  title: { fontFamily: fonts.sansSemiBold, fontSize: 13.5, color: colors.text, marginBottom: 4 },
  doneTitle: { fontFamily: fonts.sansSemiBold, fontSize: 13.5, color: colors.good, marginBottom: 4 },
  body: { fontFamily: fonts.sans, fontSize: 12.5, color: colors.textSoft, lineHeight: 18 },
  strong: { fontFamily: fonts.sansSemiBold, color: colors.text },
  input: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bg,
    borderRadius: radius.md,
    paddingVertical: 11,
    paddingHorizontal: 14,
    fontFamily: fonts.sans,
    fontSize: 13.5,
    color: colors.text,
  },
  error: { fontFamily: fonts.sans, fontSize: 12, color: colors.danger, marginTop: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 12 },
  payBtn: { backgroundColor: colors.accent, borderRadius: radius.pill, paddingVertical: 10, paddingHorizontal: 18 },
  btnDisabled: { opacity: 0.5 },
  payBtnText: { fontFamily: fonts.sansBold, fontSize: 13, color: colors.accentText },
  cancelText: { fontFamily: fonts.sansMedium, fontSize: 13, color: colors.textSoft },
  linkBtn: { marginTop: 10 },
  linkBtnText: { fontFamily: fonts.sansSemiBold, fontSize: 13, color: colors.accent },
});
