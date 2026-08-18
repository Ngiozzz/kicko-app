import { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts, radius } from '@kicko/shared';
import { Review } from '../lib/reviewsApi';
import { StarRating } from './StarRating';

// One review row — `actions` is an optional right-aligned slot so each page
// (player/owner/admin) can attach its own action (nothing, "Flag",
// "Remove" + "Dismiss flag") without this component knowing about roles.
export function ReviewCard({ review, actions }: { review: Review; actions?: ReactNode }) {
  return (
    <View style={styles.card}>
      <View style={styles.head}>
        <View style={{ flex: 1 }}>
          <View style={styles.nameRow}>
            <Text style={styles.name}>{review.player?.name ?? 'A player'}</Text>
            {review.flagged_at && <Text style={styles.flaggedBadge}>Flagged</Text>}
          </View>
          <StarRating value={review.rating} />
        </View>
        {actions}
      </View>
      {review.comment && <Text style={styles.comment}>{review.comment}</Text>}
      {review.flagged_at && review.flag_reason && <Text style={styles.flagReason}>Flag reason: {review.flag_reason}</Text>}
      <Text style={styles.date}>{new Date(review.created_at).toLocaleDateString()}</Text>
    </View>
  );
}

export function ReviewListPanel({ children }: { children: ReactNode }) {
  return <View style={styles.list}>{children}</View>;
}

export function LoadMoreButton({ onPress, loading }: { onPress: () => void; loading: boolean }) {
  return (
    <Pressable onPress={onPress} disabled={loading} style={styles.loadMoreBtn}>
      <Text style={styles.loadMoreText}>{loading ? 'Loading…' : 'Load more reviews'}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  list: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, padding: 20, gap: 16 },
  card: { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 14 },
  head: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 6 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  name: { fontFamily: fonts.sansSemiBold, fontSize: 13.5, color: colors.text },
  flaggedBadge: {
    fontFamily: fonts.sansBold,
    fontSize: 10,
    color: colors.danger,
    backgroundColor: 'rgba(196,69,63,0.12)',
    borderRadius: radius.pill,
    paddingVertical: 2,
    paddingHorizontal: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  comment: { fontFamily: fonts.sans, fontSize: 13.5, color: colors.text, lineHeight: 19, marginBottom: 6 },
  flagReason: { fontFamily: fonts.sans, fontSize: 12, color: colors.danger, marginBottom: 6, fontStyle: 'italic' },
  date: { fontFamily: fonts.sans, fontSize: 11.5, color: colors.textSoft },

  loadMoreBtn: { alignSelf: 'center', marginTop: 18, borderWidth: 1.5, borderColor: colors.border, borderRadius: radius.pill, paddingVertical: 10, paddingHorizontal: 20 },
  loadMoreText: { fontFamily: fonts.sansSemiBold, fontSize: 12.5, color: colors.text },
});
