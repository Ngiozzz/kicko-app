import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { colors, fonts, radius } from '@kicko/shared';
import { adminApi, AdminVenue } from '../../../src/lib/adminApi';
import { useVenueReviews } from '../../../src/lib/useVenueReviews';
import { SportIcon, Sport } from '../../../src/components/SportIcon';
import { StarRating } from '../../../src/components/StarRating';
import { ReviewCard, ReviewListPanel, LoadMoreButton } from '../../../src/components/ReviewList';
import { useBreadcrumb } from '../../../src/lib/breadcrumbContext';

const STATUS_LABEL: Record<AdminVenue['status'], string> = {
  pending: 'Pending review',
  verified: 'Verified',
  suspended: 'Suspended',
};

function fmtTime(t: string) {
  const [h, m] = t.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, '0')} ${period}`;
}

export default function AdminVenueDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [venue, setVenue] = useState<AdminVenue | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState('');
  const [deleteConfirming, setDeleteConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [removingReviewId, setRemovingReviewId] = useState<string | null>(null);
  const [dismissingFlagId, setDismissingFlagId] = useState<string | null>(null);
  const { reviews, average, count, hasMore, loading: reviewsLoading, loaded: reviewsLoaded, loadMore, removeLocal, replaceLocal } = useVenueReviews(id);

  async function handleRemoveReview(reviewId: string) {
    setRemovingReviewId(reviewId);
    try {
      await adminApi.deleteReview(reviewId);
      removeLocal(reviewId);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Could not remove this review.');
    } finally {
      setRemovingReviewId(null);
    }
  }

  async function handleDismissFlag(reviewId: string) {
    setDismissingFlagId(reviewId);
    try {
      const { review } = await adminApi.dismissReviewFlag(reviewId);
      replaceLocal(review);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Could not dismiss this flag.');
    } finally {
      setDismissingFlagId(null);
    }
  }

  useEffect(() => {
    (async () => {
      try {
        const { venue } = await adminApi.getVenue(id);
        setVenue(venue);
      } catch (err) {
        setLoadError(err instanceof Error ? err.message : 'Could not load this venue.');
      }
    })();
  }, [id]);

  useBreadcrumb(
    venue ? [{ label: 'Dashboard', href: '/admin-dashboard' }, { label: 'Venues', href: '/admin-dashboard/venues' }, { label: venue.name }] : null
  );

  async function handleSetStatus(status: 'verified' | 'suspended' | 'pending', reasonText?: string) {
    setBusy(true);
    setActionError(null);
    try {
      const { venue: updated } = await adminApi.setVenueStatus(id, status, reasonText);
      setVenue(updated);
      setRejecting(false);
      setReason('');
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Could not update this venue.');
    } finally {
      setBusy(false);
    }
  }

  async function handleReject() {
    if (!reason.trim()) {
      setActionError('Give a reason for suspending this venue.');
      return;
    }
    await handleSetStatus('suspended', reason);
  }

  async function handleDelete() {
    setDeleting(true);
    setActionError(null);
    try {
      await adminApi.deleteVenue(id);
      router.replace('/admin-dashboard/venues');
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Could not delete this venue.');
      setDeleting(false);
    }
  }

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
      <View style={styles.headRow}>
        <View style={{ flex: 1 }}>
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
            {venue.sport} · {venue.location} · Submitted by {venue.owner?.name ?? 'Unknown owner'}
          </Text>
        </View>
        {!rejecting && !deleteConfirming && (
          <View style={styles.actions}>
            {venue.status !== 'verified' && (
              <Pressable onPress={() => handleSetStatus('verified')} disabled={busy} style={styles.approveBtn}>
                <Text style={styles.approveBtnText}>{busy ? 'Working…' : 'Approve & verify'}</Text>
              </Pressable>
            )}
            {venue.status !== 'pending' && (
              <Pressable onPress={() => handleSetStatus('pending')} disabled={busy} style={styles.unverifyBtn}>
                <Text style={styles.unverifyBtnText}>{busy ? 'Working…' : 'Unverify'}</Text>
              </Pressable>
            )}
            {venue.status !== 'suspended' && (
              <Pressable onPress={() => setRejecting(true)} disabled={busy} style={styles.rejectBtn}>
                <Text style={styles.rejectBtnText}>{venue.status === 'pending' ? 'Reject' : 'Suspend'}</Text>
              </Pressable>
            )}
            <Pressable onPress={() => setDeleteConfirming(true)} disabled={busy} style={styles.deleteBtn}>
              <Text style={styles.deleteBtnText}>Delete</Text>
            </Pressable>
          </View>
        )}
        {deleteConfirming && (
          <View style={styles.actions}>
            <Text style={styles.deleteConfirmPrompt}>Delete this venue? This can't be undone.</Text>
            <Pressable onPress={handleDelete} disabled={deleting} style={styles.confirmRejectBtn}>
              <Text style={styles.confirmRejectBtnText}>{deleting ? 'Deleting…' : 'Confirm delete'}</Text>
            </Pressable>
            <Pressable onPress={() => setDeleteConfirming(false)} disabled={deleting}>
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
          </View>
        )}
      </View>

      {venue.status === 'suspended' && venue.rejection_reason && (
        <View style={styles.reasonBanner}>
          <Text style={styles.reasonBannerLabel}>Suspension reason</Text>
          <Text style={styles.reasonBannerText}>{venue.rejection_reason}</Text>
        </View>
      )}

      {rejecting && (
        <View style={styles.rejectBox}>
          <Text style={styles.rejectLabel}>{venue.status === 'pending' ? 'Reason for rejection' : 'Reason for suspension'}</Text>
          <TextInput
            multiline
            numberOfLines={3}
            placeholder="e.g. Photos don't match the listed address, missing safety details…"
            placeholderTextColor={colors.textSoft}
            value={reason}
            onChangeText={setReason}
            style={styles.rejectTextarea}
          />
          <View style={styles.rejectBoxActions}>
            <Pressable onPress={handleReject} disabled={busy} style={styles.confirmRejectBtn}>
              <Text style={styles.confirmRejectBtnText}>{busy ? 'Working…' : venue.status === 'pending' ? 'Confirm rejection' : 'Confirm suspension'}</Text>
            </Pressable>
            <Pressable onPress={() => setRejecting(false)} disabled={busy}>
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      )}

      {actionError ? <Text style={styles.error}>{actionError}</Text> : null}

      {venue.photos.length > 0 ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.gallery} contentContainerStyle={{ gap: 10 }}>
          {venue.photos.map((url) => (
            <Image key={url} source={{ uri: url }} style={styles.galleryImage} resizeMode="cover" />
          ))}
        </ScrollView>
      ) : (
        <View style={styles.noPhotos}>
          <Text style={styles.noPhotosText}>No photos uploaded.</Text>
        </View>
      )}

      <Text style={styles.secTitle}>Listing details</Text>
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Sport</Text>
          <SportIcon sport={venue.sport as Sport} size={18} />
          <Text style={styles.statValueSm}>{venue.sport}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Peak / off-peak</Text>
          <Text style={styles.statValueSm}>
            KES {venue.price_peak.toLocaleString()} / {venue.price_off_peak.toLocaleString()}
          </Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Hours</Text>
          <Text style={styles.statValueSm}>
            {fmtTime(venue.opening_time)} – {fmtTime(venue.closing_time)}
          </Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Submitted</Text>
          <Text style={styles.statValueSm}>{new Date(venue.created_at).toLocaleDateString()}</Text>
        </View>
      </View>

      <View style={styles.twoCol}>
        <View style={{ flex: 1, minWidth: 260 }}>
          <Text style={styles.secTitle}>Amenities</Text>
          {venue.amenities.length === 0 ? (
            <Text style={styles.emptyText}>No amenities listed.</Text>
          ) : (
            <View style={styles.amenityList}>
              {venue.amenities.map((a) => (
                <View key={a} style={styles.amenityChip}>
                  <Text style={styles.amenityChipText}>{a}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        <View style={{ flex: 1, minWidth: 260 }}>
          <Text style={styles.secTitle}>Owner</Text>
          <View style={styles.contactCard}>
            <Text style={styles.ownerName}>{venue.owner?.name ?? 'Unknown owner'}</Text>
            <Text style={styles.ownerContact}>
              {venue.owner?.email}
              {venue.owner?.phone ? ` · ${venue.owner.phone}` : ''}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.reviewsHead}>
        <Text style={styles.secTitle}>Reviews</Text>
        {count > 0 && (
          <View style={styles.reviewsSummary}>
            <StarRating value={average} size={14} />
            <Text style={styles.reviewsSummaryText}>
              {average} ({count} review{count === 1 ? '' : 's'})
            </Text>
          </View>
        )}
      </View>
      {!reviewsLoaded ? (
        <ActivityIndicator color={colors.accent} />
      ) : reviews.length === 0 ? (
        <Text style={styles.emptyText}>No reviews yet.</Text>
      ) : (
        <>
          <ReviewListPanel>
            {reviews.map((r) => (
              <ReviewCard
                key={r.id}
                review={r}
                actions={
                  <View style={styles.reviewActions}>
                    {r.flagged_at && (
                      <Pressable onPress={() => handleDismissFlag(r.id)} disabled={dismissingFlagId === r.id}>
                        <Text style={styles.dismissFlagText}>{dismissingFlagId === r.id ? 'Dismissing…' : 'Dismiss flag'}</Text>
                      </Pressable>
                    )}
                    <Pressable onPress={() => handleRemoveReview(r.id)} disabled={removingReviewId === r.id}>
                      <Text style={styles.removeReviewText}>{removingReviewId === r.id ? 'Removing…' : 'Remove'}</Text>
                    </Pressable>
                  </View>
                }
              />
            ))}
          </ReviewListPanel>
          {hasMore && <LoadMoreButton onPress={loadMore} loading={reviewsLoading} />}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  loading: { paddingVertical: 60, alignItems: 'center' },
  error: { fontFamily: fonts.sans, fontSize: 13.5, color: colors.danger, marginBottom: 16 },

  headRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16, marginBottom: 10 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 12, flexWrap: 'wrap' },
  title: { fontFamily: fonts.serif, fontSize: 26, color: colors.text },
  subtitle: { fontFamily: fonts.sans, fontSize: 13.5, color: colors.textSoft, marginTop: 6 },

  statusPill: { backgroundColor: colors.surface2, borderRadius: radius.pill, paddingVertical: 4, paddingHorizontal: 10 },
  statusVerified: { backgroundColor: 'rgba(60,122,92,0.14)' },
  statusSuspended: { backgroundColor: 'rgba(196,69,63,0.12)' },
  statusPillText: { fontFamily: fonts.sansSemiBold, fontSize: 11, color: colors.textSoft },
  statusPillTextVerified: { color: colors.good },
  statusPillTextSuspended: { color: colors.danger },

  actions: { flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap' },
  rejectBtn: { backgroundColor: colors.danger, borderRadius: radius.pill, paddingVertical: 11, paddingHorizontal: 18 },
  rejectBtnText: { fontFamily: fonts.sansBold, fontSize: 13, color: '#fff' },
  approveBtn: { backgroundColor: colors.accent, borderRadius: radius.pill, paddingVertical: 11, paddingHorizontal: 18 },
  approveBtnText: { fontFamily: fonts.sansBold, fontSize: 13, color: colors.accentText },
  unverifyBtn: { borderWidth: 1.5, borderColor: colors.border, borderRadius: radius.pill, paddingVertical: 10, paddingHorizontal: 17 },
  unverifyBtnText: { fontFamily: fonts.sansSemiBold, fontSize: 13, color: colors.text },
  deleteBtn: { borderWidth: 1.5, borderColor: colors.danger, borderRadius: radius.pill, paddingVertical: 10, paddingHorizontal: 17 },
  deleteBtnText: { fontFamily: fonts.sansSemiBold, fontSize: 13, color: colors.danger },
  deleteConfirmPrompt: { fontFamily: fonts.sans, fontSize: 13, color: colors.text },
  cancelText: { fontFamily: fonts.sansMedium, fontSize: 13, color: colors.textSoft },

  reasonBanner: { backgroundColor: 'rgba(196,69,63,0.08)', borderWidth: 1, borderColor: 'rgba(196,69,63,0.25)', borderRadius: radius.md, padding: 16, marginTop: 16 },
  reasonBannerLabel: { fontFamily: fonts.sansBold, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5, color: colors.danger, marginBottom: 4 },
  reasonBannerText: { fontFamily: fonts.sans, fontSize: 13.5, color: colors.text },

  rejectBox: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: 18, marginTop: 16 },
  rejectLabel: { fontFamily: fonts.sansSemiBold, fontSize: 11.5, color: colors.textSoft, marginBottom: 8 },
  rejectTextarea: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bg,
    borderRadius: radius.md,
    padding: 12,
    fontFamily: fonts.sans,
    fontSize: 13.5,
    color: colors.text,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  rejectBoxActions: { flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 12 },
  confirmRejectBtn: { alignSelf: 'flex-start', backgroundColor: colors.danger, borderRadius: radius.pill, paddingVertical: 11, paddingHorizontal: 18 },
  confirmRejectBtnText: { fontFamily: fonts.sansBold, fontSize: 13, color: '#fff' },

  gallery: { marginTop: 24, marginBottom: 8 },
  galleryImage: { width: 200, height: 140, borderRadius: radius.md, backgroundColor: colors.accentSoft },
  noPhotos: { marginTop: 24, marginBottom: 8, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: 20, alignItems: 'center' },
  noPhotosText: { fontFamily: fonts.sans, fontSize: 13, color: colors.textSoft },

  secTitle: { fontFamily: fonts.serifMedium, fontSize: 17, color: colors.text, marginTop: 28, marginBottom: 14 },
  emptyText: { fontFamily: fonts.sans, fontSize: 13, color: colors.textSoft },

  statsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 18 },
  statCard: { flexGrow: 1, flexBasis: 180, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, padding: 18, gap: 8 },
  statLabel: { fontFamily: fonts.sansSemiBold, fontSize: 12, color: colors.textSoft },
  statValueSm: { fontFamily: fonts.serifMedium, fontSize: 15, color: colors.text, textTransform: 'capitalize' },

  twoCol: { flexDirection: 'row', flexWrap: 'wrap', gap: 32 },
  amenityList: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  amenityChip: { backgroundColor: colors.surface2, borderRadius: radius.pill, paddingVertical: 6, paddingHorizontal: 12 },
  amenityChipText: { fontFamily: fonts.sansMedium, fontSize: 12.5, color: colors.text },

  contactCard: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: 16 },
  ownerName: { fontFamily: fonts.sansSemiBold, fontSize: 14, color: colors.text, marginBottom: 4 },
  ownerContact: { fontFamily: fonts.sans, fontSize: 13, color: colors.textSoft },

  reviewsHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 28, marginBottom: 14 },
  reviewsSummary: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  reviewsSummaryText: { fontFamily: fonts.sans, fontSize: 13, color: colors.textSoft },

  reviewActions: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  dismissFlagText: { fontFamily: fonts.sansSemiBold, fontSize: 12, color: colors.textSoft },
  removeReviewText: { fontFamily: fonts.sansSemiBold, fontSize: 12, color: colors.danger },
});
