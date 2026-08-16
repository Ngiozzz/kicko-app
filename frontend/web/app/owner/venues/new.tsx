import { useEffect, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Link, router } from 'expo-router';
import { colors, fonts, radius, supabase } from '@kicko/shared';
import { VenueForm, VenueFormValue, venueInputFromForm } from '../../../src/components/owner/VenueForm';
import { venuesApi } from '../../../src/lib/venuesApi';
import { SportIcon, Sport } from '../../../src/components/SportIcon';

const SPORT_LABEL: Record<Sport, string> = {
  football: 'Football',
  basketball: 'Basketball',
  tennis: 'Tennis',
  padel: 'Padel',
  volleyball: 'Volleyball',
};

const CHECKLIST = [
  "New listings are reviewed before they go live.",
  'Add photos — listings with photos get more attention.',
  "You can edit pricing and amenities anytime after it's live.",
];

function PreviewCard({ form }: { form: VenueFormValue }) {
  return (
    <View style={styles.previewCard}>
      <View style={styles.previewThumb}>
        {form.photos[0] ? (
          <Image source={{ uri: form.photos[0] }} style={styles.previewImage} resizeMode="cover" />
        ) : (
          form.amenities[0] && (
            <View style={styles.previewBadge}>
              <Text style={styles.previewBadgeText}>{form.amenities[0]}</Text>
            </View>
          )
        )}
      </View>
      <View style={styles.previewBody}>
        <Text style={styles.previewName}>{form.name.trim() || 'Untitled venue'}</Text>
        <Text style={styles.previewMgrTag}>🔑 You'll run this venue</Text>
        <View style={styles.previewMeta}>
          {form.sport && <SportIcon sport={form.sport} size={13} />}
          <Text style={styles.previewMetaText}>
            {form.sport ? SPORT_LABEL[form.sport] : 'Sport'} · {form.location.trim() || 'Location'}
          </Text>
        </View>
        <View style={styles.previewFoot}>
          <Text style={styles.previewPrice}>{form.pricePeak ? `From KES ${form.priceOffPeak || form.pricePeak}/hr` : 'Set a rate'}</Text>
          <View style={styles.previewStatusPill}>
            <Text style={styles.previewStatusText}>Pending review</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

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
          <PreviewCard form={preview} />
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

  previewCard: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, overflow: 'hidden' },
  previewThumb: { height: 110, backgroundColor: colors.accentSoft, justifyContent: 'flex-end', padding: 10 },
  previewImage: StyleSheet.absoluteFill,
  previewBadge: { alignSelf: 'flex-start', backgroundColor: 'rgba(30,33,38,0.55)', borderRadius: radius.pill, paddingVertical: 4, paddingHorizontal: 10 },
  previewBadgeText: { fontFamily: fonts.sansSemiBold, fontSize: 11, color: '#fff' },
  previewBody: { padding: 16 },
  previewName: { fontFamily: fonts.serifMedium, fontSize: 15, color: colors.text, marginBottom: 4 },
  previewMgrTag: { fontFamily: fonts.sansSemiBold, fontSize: 11.5, color: colors.textSoft, marginBottom: 10 },
  previewMeta: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
  previewMetaText: { fontFamily: fonts.sans, fontSize: 12.5, color: colors.textSoft },
  previewFoot: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  previewPrice: { fontFamily: fonts.sansBold, fontSize: 13, color: colors.accent },
  previewStatusPill: { backgroundColor: colors.surface2, borderRadius: radius.pill, paddingVertical: 4, paddingHorizontal: 10 },
  previewStatusText: { fontFamily: fonts.sansSemiBold, fontSize: 10.5, color: colors.textSoft },
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
