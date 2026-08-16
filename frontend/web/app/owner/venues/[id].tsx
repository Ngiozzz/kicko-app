import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { colors, fonts, radius } from '@kicko/shared';
import { VenueForm, VenueFormValue, venueInputFromForm } from '../../../src/components/owner/VenueForm';
import { venuesApi, Venue } from '../../../src/lib/venuesApi';
import { Sport } from '../../../src/components/SportIcon';

export default function VenueDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [venue, setVenue] = useState<Venue | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { venue } = await venuesApi.get(id);
        setVenue(venue);
      } catch (err) {
        setLoadError(err instanceof Error ? err.message : 'Could not load this venue.');
      }
    })();
  }, [id]);

  async function handleSubmit(form: VenueFormValue) {
    const input = venueInputFromForm(form);
    if (!input) {
      setSaveError('Fill in the venue name, location, sport, and a valid price per hour.');
      return;
    }
    setSaveError(null);
    setSaving(true);
    try {
      const { venue } = await venuesApi.update(id, input);
      setVenue(venue);
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
  if (!venue) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  return (
    <View>
      <Text style={styles.title}>{venue.name}</Text>
      <Text style={styles.subtitle}>Added {new Date(venue.created_at).toLocaleDateString()}.</Text>

      <VenueForm
        ownerId={venue.owner_id}
        submitLabel="Save changes"
        loading={saving}
        error={saveError}
        onSubmit={handleSubmit}
        initial={{
          name: venue.name,
          location: venue.location,
          sport: venue.sport as Sport,
          pricePeak: String(venue.price_peak),
          priceOffPeak: String(venue.price_off_peak),
          openingTime: venue.opening_time.slice(0, 5),
          closingTime: venue.closing_time.slice(0, 5),
          amenities: venue.amenities,
          photos: venue.photos,
        }}
      />

      <View style={styles.dangerZone}>
        {!confirmingDelete ? (
          <Pressable onPress={() => setConfirmingDelete(true)}>
            <Text style={styles.deleteLink}>Delete this venue</Text>
          </Pressable>
        ) : (
          <View style={styles.confirmRow}>
            <Text style={styles.confirmText}>Delete "{venue.name}" permanently?</Text>
            <Pressable onPress={handleDelete} disabled={deleting} style={styles.confirmDeleteBtn}>
              <Text style={styles.confirmDeleteText}>{deleting ? 'Deleting…' : 'Yes, delete'}</Text>
            </Pressable>
            <Pressable onPress={() => setConfirmingDelete(false)}>
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  loading: { paddingVertical: 60, alignItems: 'center' },
  error: { fontFamily: fonts.sans, fontSize: 13.5, color: colors.danger },
  title: { fontFamily: fonts.serif, fontSize: 28, color: colors.text, marginBottom: 6 },
  subtitle: { fontFamily: fonts.sans, fontSize: 13, color: colors.textSoft, marginBottom: 28 },

  dangerZone: { marginTop: 32, maxWidth: 440, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 24 },
  deleteLink: { fontFamily: fonts.sansSemiBold, fontSize: 13.5, color: colors.danger },
  confirmRow: { gap: 10, alignItems: 'flex-start' },
  confirmText: { fontFamily: fonts.sans, fontSize: 13.5, color: colors.text },
  confirmDeleteBtn: { backgroundColor: colors.danger, borderRadius: radius.pill, paddingVertical: 10, paddingHorizontal: 18 },
  confirmDeleteText: { fontFamily: fonts.sansBold, fontSize: 13, color: '#FFF' },
  cancelText: { fontFamily: fonts.sansMedium, fontSize: 13, color: colors.textSoft },
});
