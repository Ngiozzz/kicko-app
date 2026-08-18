import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Link, router } from 'expo-router';
import { colors, fonts, radius, supabase } from '@kicko/shared';
import { VenueForm, VenueFormValue, venueInputFromForm } from '../../../src/components/owner/VenueForm';
import { VenuePreviewCard } from '../../../src/components/owner/VenuePreviewCard';
import { venuesApi } from '../../../src/lib/venuesApi';

const CHECKLIST = [
  "New listings are reviewed before they go live.",
  'Add photos — listings with photos get more attention.',
  "You can edit pricing and amenities anytime after it's live.",
];

export default function NewVenue() {
  const [ownerId, setOwnerId] = useState<string | null>(null);
  const [preview, setPreview] = useState<VenueFormValue>({
    name: '',
    location: '',
    sport: null,
    pricePeak: '',
    priceOffPeak: '',
    openingTime: '06:00',
    closingTime: '22:00',
    amenities: [],
    photos: [],
    payoutType: null,
    payoutNumber: '',
    payoutAccountRef: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    (async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setOwnerId(session?.user.id ?? null);
    })();
  }, []);

  async function handleSubmit(form: VenueFormValue) {
    const input = venueInputFromForm(form);
    if (!input) {
      setError('Fill in the venue name, location, sport, and a valid price per hour.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await venuesApi.create(input);
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create the venue.');
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <View style={styles.successRoot}>
        <Text style={styles.successIcon}>✅</Text>
        <Text style={styles.successTitle}>Submitted for review</Text>
        <Text style={styles.successBody}>Thanks — new listings are typically reviewed within a day. You'll be notified once it's live.</Text>
        <Pressable onPress={() => router.replace('/owner/venues')} style={styles.primaryBtn}>
          <Text style={styles.primaryBtnText}>Back to My Venues</Text>
        </Pressable>
      </View>
    );
  }

  if (!ownerId) return null;

  return (
    <View>
      <View style={styles.headRow}>
        <View>
          <Text style={styles.title}>Add a venue</Text>
          <Text style={styles.subtitle}>List a new venue for players to discover and book.</Text>
        </View>
        <Link href="/owner/venues" asChild>
          <Pressable style={styles.cancelBtn}>
            <Text style={styles.cancelBtnText}>Cancel</Text>
          </Pressable>
        </Link>
      </View>

      <View style={styles.twoCol}>
        <View style={styles.formCol}>
          <VenueForm ownerId={ownerId} onChange={setPreview} onSubmit={handleSubmit} submitLabel="Submit for review" loading={loading} error={error} />
        </View>

        <View style={styles.sideCol}>
          <Text style={styles.secTitle}>Preview</Text>
          <VenuePreviewCard form={preview} statusLabel="Pending review" statusTone="pending" />
          <Text style={styles.previewNote}>This is roughly how your listing will appear to players once it's live.</Text>

          <Text style={[styles.secTitle, { marginTop: 32 }]}>Before you submit</Text>
          <View style={styles.checklistCard}>
            {CHECKLIST.map((item) => (
              <View key={item} style={styles.checklistRow}>
                <Text style={styles.checklistBullet}>•</Text>
                <Text style={styles.checklistText}>{item}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16, marginBottom: 28 },
  title: { fontFamily: fonts.serif, fontSize: 28, color: colors.text, marginBottom: 6 },
  subtitle: { fontFamily: fonts.sans, fontSize: 13.5, color: colors.textSoft },
  cancelBtn: { borderWidth: 1.5, borderColor: colors.border, borderRadius: radius.pill, paddingVertical: 11, paddingHorizontal: 20 },
  cancelBtnText: { fontFamily: fonts.sansBold, fontSize: 13.5, color: colors.text },

  twoCol: { flexDirection: 'row', flexWrap: 'wrap', gap: 32 },
  formCol: { flex: 1.4, minWidth: 320 },
  sideCol: { flex: 1, minWidth: 280 },

  secTitle: { fontFamily: fonts.serifMedium, fontSize: 17, color: colors.text, marginBottom: 14 },

  previewNote: { fontFamily: fonts.sans, fontSize: 12, color: colors.textSoft, marginTop: 10 },

  checklistCard: { gap: 8 },
  checklistRow: { flexDirection: 'row', gap: 8 },
  checklistBullet: { fontFamily: fonts.sans, fontSize: 13, color: colors.accent },
  checklistText: { flex: 1, fontFamily: fonts.sans, fontSize: 13, color: colors.textSoft, lineHeight: 20 },

  successRoot: { alignItems: 'center', justifyContent: 'center', paddingVertical: 80, paddingHorizontal: 20 },
  successIcon: { fontSize: 40, marginBottom: 10 },
  successTitle: { fontFamily: fonts.serifMedium, fontSize: 22, color: colors.text, marginBottom: 10 },
  successBody: { fontFamily: fonts.sans, fontSize: 14, color: colors.textSoft, textAlign: 'center', maxWidth: 380, lineHeight: 21, marginBottom: 22 },
  primaryBtn: { backgroundColor: colors.accent, borderRadius: radius.pill, paddingVertical: 13, paddingHorizontal: 26 },
  primaryBtnText: { fontFamily: fonts.sansBold, fontSize: 14, color: colors.accentText },
});
