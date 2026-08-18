import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Link, router, useLocalSearchParams } from 'expo-router';
import { colors, fonts, radius } from '@kicko/shared';
import { VenueForm, VenueFormValue, venueInputFromForm } from '../../../../src/components/owner/VenueForm';
import { VenuePreviewCard, PreviewStatusTone } from '../../../../src/components/owner/VenuePreviewCard';
import { venuesApi, Venue, VenueStatus } from '../../../../src/lib/venuesApi';
import { Sport } from '../../../../src/components/SportIcon';
import { useBreadcrumb } from '../../../../src/lib/breadcrumbContext';

const STATUS: Record<VenueStatus, { label: string; tone: PreviewStatusTone }> = {
  pending: { label: 'Pending review', tone: 'pending' },
  verified: { label: 'Verified', tone: 'verified' },
  suspended: { label: 'Suspended', tone: 'suspended' },
};

const PAYOUT_LABEL: Record<'phone' | 'paybill' | 'till', string> = {
  phone: 'M-Pesa · Personal number',
  paybill: 'M-Pesa · Paybill',
  till: 'M-Pesa · Till number',
};

function formValueFromVenue(venue: Venue): VenueFormValue {
  return {
    name: venue.name,
    location: venue.location,
    sport: venue.sport as Sport,
    pricePeak: String(venue.price_peak),
    priceOffPeak: String(venue.price_off_peak),
    openingTime: venue.opening_time.slice(0, 5),
    closingTime: venue.closing_time.slice(0, 5),
    amenities: venue.amenities,
    photos: venue.photos,
    payoutType: venue.payout_type,
    payoutNumber: venue.payout_number ?? '',
    payoutAccountRef: venue.payout_account_ref ?? '',
  };
}

export default function VenueEdit() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [venue, setVenue] = useState<Venue | null>(null);
  const [preview, setPreview] = useState<VenueFormValue | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { venue } = await venuesApi.get(id);
        setVenue(venue);
        setPreview(formValueFromVenue(venue));
      } catch (err) {
        setLoadError(err instanceof Error ? err.message : 'Could not load this venue.');
      }
    })();
  }, [id]);

  useBreadcrumb(
    venue
      ? [{ label: 'Home', href: '/owner' }, { label: 'My Venues', href: '/owner/venues' }, { label: venue.name, href: `/owner/venues/${id}` }, { label: 'Edit venue' }]
      : null
  );

  async function handleSubmit(form: VenueFormValue) {
    const input = venueInputFromForm(form);
    if (!input) {
      setSaveError('Fill in the venue name, location, sport, and a valid price per hour.');
      return;
    }
    setSaveError(null);
    setSaved(false);
    setSaving(true);
    try {
      const { venue } = await venuesApi.update(id, input);
      setVenue(venue);
      setSaved(true);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Could not save changes.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await venuesApi.remove(id);
      router.replace('/owner/venues');
    } catch (err) {
      setDeleting(false);
      setSaveError(err instanceof Error ? err.message : 'Could not delete this venue.');
    }
  }

  if (loadError) return <Text style={styles.error}>{loadError}</Text>;
  if (!venue || !preview) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  const status = STATUS[venue.status];

  return (
    <View>
      <View style={styles.headRow}>
        <View style={{ flex: 1, minWidth: 240 }}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>Edit {venue.name}</Text>
            <View style={[styles.statusPill, { backgroundColor: STATUS_PILL_BG[venue.status] }]}>
              <Text style={[styles.statusPillText, { color: STATUS_PILL_COLOR[venue.status] }]}>{status.label}</Text>
            </View>
          </View>
          <Text style={styles.subtitle}>Changes go live immediately for players browsing this venue.</Text>
        </View>
        <Link href={`/owner/venues/${id}`} asChild>
          <Pressable style={styles.viewBtn}>
            <Text style={styles.viewBtnText}>View venue</Text>
          </Pressable>
        </Link>
      </View>

      {saved && (
        <View style={styles.savedBanner}>
          <Text style={styles.savedBannerText}>✓ Saved</Text>
        </View>
      )}

      <View style={styles.twoCol}>
        <View style={styles.formCol}>
          <VenueForm
            ownerId={venue.owner_id}
            submitLabel="Save changes"
            loading={saving}
            error={saveError}
            onSubmit={handleSubmit}
            onChange={setPreview}
            initial={preview}
          />
        </View>

        <View style={styles.sideCol}>
          <Text style={styles.secTitle}>Preview</Text>
          <VenuePreviewCard form={preview} statusLabel={status.label} statusTone={status.tone} />
          <Text style={styles.previewNote}>This is roughly how your listing appears to players right now.</Text>

          <Text style={[styles.secTitle, { marginTop: 32 }]}>Payout</Text>
          <View style={styles.payoutCard}>
            {venue.payout_type ? (
              <>
                <View style={styles.payoutDot} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.payoutLabel}>{PAYOUT_LABEL[venue.payout_type]}</Text>
                  <Text style={styles.payoutValue}>{venue.payout_number}</Text>
                </View>
              </>
            ) : (
              <>
                <View style={[styles.payoutDot, styles.payoutDotOff]} />
                <Text style={styles.payoutEmpty}>No payout method set — bookings will pile up unpaid until you add one below.</Text>
              </>
            )}
          </View>

          <Text style={[styles.secTitle, { marginTop: 32 }]}>Danger zone</Text>
          <View style={styles.dangerCard}>
            {!confirmingDelete ? (
              <Pressable onPress={() => setConfirmingDelete(true)}>
                <Text style={styles.deleteLink}>Delete this venue</Text>
              </Pressable>
            ) : (
              <View style={styles.confirmRow}>
                <Text style={styles.confirmText}>Delete "{venue.name}" permanently? This can't be undone.</Text>
                <View style={styles.confirmActions}>
                  <Pressable onPress={handleDelete} disabled={deleting} style={styles.confirmDeleteBtn}>
                    <Text style={styles.confirmDeleteText}>{deleting ? 'Deleting…' : 'Yes, delete'}</Text>
                  </Pressable>
                  <Pressable onPress={() => setConfirmingDelete(false)}>
                    <Text style={styles.cancelText}>Cancel</Text>
                  </Pressable>
                </View>
              </View>
            )}
          </View>
        </View>
      </View>
    </View>
  );
}

const STATUS_PILL_BG: Record<VenueStatus, string> = {
  pending: colors.surface2,
  verified: 'rgba(60,122,92,0.14)',
  suspended: 'rgba(196,69,63,0.12)',
};
const STATUS_PILL_COLOR: Record<VenueStatus, string> = {
  pending: colors.textSoft,
  verified: colors.good,
  suspended: colors.danger,
};

const styles = StyleSheet.create({
  loading: { paddingVertical: 60, alignItems: 'center' },
  error: { fontFamily: fonts.sans, fontSize: 13.5, color: colors.danger },

  headRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16, marginBottom: 20 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap' },
  title: { fontFamily: fonts.serif, fontSize: 28, color: colors.text },
  subtitle: { fontFamily: fonts.sans, fontSize: 13, color: colors.textSoft, marginTop: 6 },
  statusPill: { borderRadius: radius.pill, paddingVertical: 4, paddingHorizontal: 11 },
  statusPillText: { fontFamily: fonts.sansSemiBold, fontSize: 11 },
  viewBtn: { borderWidth: 1.5, borderColor: colors.border, borderRadius: radius.pill, paddingVertical: 11, paddingHorizontal: 20 },
  viewBtnText: { fontFamily: fonts.sansBold, fontSize: 13.5, color: colors.text },

  savedBanner: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(60,122,92,0.14)',
    borderRadius: radius.pill,
    paddingVertical: 7,
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  savedBannerText: { fontFamily: fonts.sansSemiBold, fontSize: 12.5, color: colors.good },

  twoCol: { flexDirection: 'row', flexWrap: 'wrap', gap: 32 },
  formCol: { flex: 1.4, minWidth: 320 },
  sideCol: { flex: 1, minWidth: 280 },

  secTitle: { fontFamily: fonts.serifMedium, fontSize: 17, color: colors.text, marginBottom: 14 },
  previewNote: { fontFamily: fonts.sans, fontSize: 12, color: colors.textSoft, marginTop: 10 },

  payoutCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: 16,
  },
  payoutDot: { width: 9, height: 9, borderRadius: 5, backgroundColor: colors.good, marginTop: 4 },
  payoutDotOff: { backgroundColor: colors.textSoft },
  payoutLabel: { fontFamily: fonts.sansSemiBold, fontSize: 13, color: colors.text },
  payoutValue: { fontFamily: fonts.sans, fontSize: 12.5, color: colors.textSoft, marginTop: 2 },
  payoutEmpty: { flex: 1, fontFamily: fonts.sans, fontSize: 12.5, color: colors.textSoft, lineHeight: 18 },

  dangerCard: {
    backgroundColor: 'rgba(196,69,63,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(196,69,63,0.25)',
    borderRadius: radius.lg,
    padding: 16,
  },
  deleteLink: { fontFamily: fonts.sansSemiBold, fontSize: 13.5, color: colors.danger },
  confirmRow: { gap: 12 },
  confirmText: { fontFamily: fonts.sans, fontSize: 13, color: colors.text, lineHeight: 19 },
  confirmActions: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  confirmDeleteBtn: { backgroundColor: colors.danger, borderRadius: radius.pill, paddingVertical: 10, paddingHorizontal: 18 },
  confirmDeleteText: { fontFamily: fonts.sansBold, fontSize: 13, color: '#FFF' },
  cancelText: { fontFamily: fonts.sansMedium, fontSize: 13, color: colors.textSoft },
});
