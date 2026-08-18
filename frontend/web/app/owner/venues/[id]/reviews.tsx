import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { colors, fonts, radius } from '@kicko/shared';
import { reviewsApi } from '../../../../src/lib/reviewsApi';
import { useVenueReviews } from '../../../../src/lib/useVenueReviews';
import { venuesApi } from '../../../../src/lib/venuesApi';
import { ReviewCard, ReviewListPanel, LoadMoreButton } from '../../../../src/components/ReviewList';
import { StarRating } from '../../../../src/components/StarRating';
import { useBreadcrumb } from '../../../../src/lib/breadcrumbContext';

function FlagAction({ reviewId, flagged, onFlagged }: { reviewId: string; flagged: boolean; onFlagged: (reviewId: string, reason: string) => void }) {
  const [flagging, setFlagging] = useState(false);
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (flagged) return <Text style={styles.flaggedNote}>Flagged for admin</Text>;

  if (!flagging) {
    return (
      <Pressable onPress={() => setFlagging(true)}>
        <Text style={styles.flagLink}>Flag</Text>
      </Pressable>
    );
  }

  async function submit() {
    setSubmitting(true);
    setError(null);
    try {
      await reviewsApi.flag(reviewId, reason.trim() || undefined);
      onFlagged(reviewId, reason.trim());
      setFlagging(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not flag this review.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <View style={styles.flagBox}>
      <TextInput
        value={reason}
        onChangeText={setReason}
        placeholder="Why should admin look at this? (optional)"
        placeholderTextColor={colors.textSoft}
        style={styles.flagInput}
      />
      {error && <Text style={styles.flagError}>{error}</Text>}
      <View style={styles.flagBoxActions}>
        <Pressable onPress={submit} disabled={submitting} style={styles.flagConfirmBtn}>
          <Text style={styles.flagConfirmText}>{submitting ? 'Flagging…' : 'Confirm flag'}</Text>
        </Pressable>
        <Pressable onPress={() => setFlagging(false)} disabled={submitting}>
          <Text style={styles.cancelText}>Cancel</Text>
        </Pressable>
      </View>
    </View>
  );
}

export default function VenueReviews() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { reviews, average, count, hasMore, loading, loaded, loadMore, replaceLocal } = useVenueReviews(id);
  const [venueName, setVenueName] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    venuesApi
      .get(id)
      .then(({ venue }) => setVenueName(venue.name))
      .catch(() => {});
  }, [id]);

  useBreadcrumb(
    venueName
      ? [{ label: 'Home', href: '/owner' }, { label: 'My Venues', href: '/owner/venues' }, { label: venueName, href: `/owner/venues/${id}` }, { label: 'Reviews' }]
      : null
  );

  function handleFlagged(reviewId: string, reason: string) {
    const existing = reviews.find((r) => r.id === reviewId);
    if (existing) replaceLocal({ ...existing, flagged_at: new Date().toISOString(), flag_reason: reason || null });
  }

  return (
    <View>
      <Text style={styles.title}>Reviews</Text>
      <Text style={styles.subtitle}>What players are saying about this venue.</Text>

      {count > 0 && (
        <View style={styles.summaryRow}>
          <StarRating value={average} size={16} />
          <Text style={styles.summaryText}>
            {average} · {count} review{count === 1 ? '' : 's'}
          </Text>
        </View>
      )}

      {!loaded ? (
        <ActivityIndicator color={colors.accent} style={{ marginTop: 20 }} />
      ) : reviews.length === 0 ? (
        <Text style={styles.emptyText}>No reviews yet.</Text>
      ) : (
        <>
          <ReviewListPanel>
            {reviews.map((r) => (
              <ReviewCard key={r.id} review={r} actions={<FlagAction reviewId={r.id} flagged={Boolean(r.flagged_at)} onFlagged={handleFlagged} />} />
            ))}
          </ReviewListPanel>
          {hasMore && <LoadMoreButton onPress={loadMore} loading={loading} />}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  title: { fontFamily: fonts.serif, fontSize: 26, color: colors.text, marginBottom: 4 },
  subtitle: { fontFamily: fonts.sans, fontSize: 13.5, color: colors.textSoft, marginBottom: 18 },

  summaryRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 22 },
  summaryText: { fontFamily: fonts.sans, fontSize: 13.5, color: colors.textSoft },

  emptyText: { fontFamily: fonts.sans, fontSize: 13, color: colors.textSoft },

  flagLink: { fontFamily: fonts.sansSemiBold, fontSize: 12, color: colors.danger },
  flaggedNote: { fontFamily: fonts.sansSemiBold, fontSize: 11.5, color: colors.textSoft, fontStyle: 'italic' },
  flagBox: { minWidth: 220 },
  flagInput: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bg,
    borderRadius: radius.md,
    paddingVertical: 8,
    paddingHorizontal: 12,
    fontFamily: fonts.sans,
    fontSize: 12.5,
    color: colors.text,
  },
  flagError: { fontFamily: fonts.sans, fontSize: 11.5, color: colors.danger, marginTop: 6 },
  flagBoxActions: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 8 },
  flagConfirmBtn: { backgroundColor: colors.danger, borderRadius: radius.pill, paddingVertical: 7, paddingHorizontal: 14 },
  flagConfirmText: { fontFamily: fonts.sansBold, fontSize: 12, color: '#fff' },
  cancelText: { fontFamily: fonts.sansMedium, fontSize: 12, color: colors.textSoft },
});
