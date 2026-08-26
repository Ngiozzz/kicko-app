import { Image, StyleSheet, Text, View } from 'react-native';
import { colors, fonts, radius } from '@kicko/shared';
import { SportIcon, Sport } from '../SportIcon';
import { VenueFormValue } from './VenueForm';

const SPORT_LABEL: Record<Sport, string> = {
  football: 'Football',
  basketball: 'Basketball',
  tennis: 'Tennis',
  padel: 'Padel',
  volleyball: 'Volleyball',
  rugby: 'Rugby',
};

export type PreviewStatusTone = 'pending' | 'verified' | 'suspended';

const TONE_STYLE: Record<PreviewStatusTone, { bg: string; color: string }> = {
  pending: { bg: 'rgba(30,33,38,0.55)', color: '#fff' },
  verified: { bg: 'rgba(60,122,92,0.85)', color: '#fff' },
  suspended: { bg: 'rgba(196,69,63,0.85)', color: '#fff' },
};

// Shared between Add venue and Edit venue so a listing previews
// identically no matter which screen you're editing it from — only the
// status label/tone differs (new venues are always "Pending review";
// an edit reflects the venue's real, current status).
export function VenuePreviewCard({
  form,
  statusLabel,
  statusTone = 'pending',
}: {
  form: VenueFormValue;
  statusLabel: string;
  statusTone?: PreviewStatusTone;
}) {
  const tone = TONE_STYLE[statusTone];
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
          <View style={[styles.previewStatusPill, { backgroundColor: tone.bg }]}>
            <Text style={[styles.previewStatusText, { color: tone.color }]}>{statusLabel}</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
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
  previewStatusPill: { borderRadius: radius.pill, paddingVertical: 4, paddingHorizontal: 10 },
  previewStatusText: { fontFamily: fonts.sansSemiBold, fontSize: 10.5 },
});
