import { CSSProperties, useState } from 'react';
import { ActivityIndicator, Text, View, StyleSheet } from 'react-native';
import { colors, fonts, radius, supabase } from '@kicko/shared';

const MAX_PHOTOS = 5;
const MAX_BYTES = 8 * 1024 * 1024;

// Real upload to the venue-photos Storage bucket (see
// backend/supabase/migrations/..._venue_photos_storage.sql) — client
// uploads directly using the owner's own session, scoped by RLS to their
// own "<ownerId>/..." path. Up to 5 photos per venue; the first is the
// cover photo shown everywhere venues are listed.
export function VenuePhotoGallery({
  ownerId,
  photos,
  onChange,
}: {
  ownerId: string;
  photos: string[];
  onChange: (photos: string[]) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function pickFiles() {
    if (typeof document === 'undefined') return;
    const remaining = MAX_PHOTOS - photos.length;
    if (remaining <= 0) return;

    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.multiple = true;
    input.onchange = async () => {
      const files = Array.from(input.files ?? []).slice(0, remaining);
      if (!files.length) return;

      const tooBig = files.find((f) => f.size > MAX_BYTES);
      if (tooBig) {
        setError('Each photo must be under 8MB.');
        return;
      }

      setError(null);
      setUploading(true);
      try {
        const uploaded: string[] = [];
        for (const file of files) {
          const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
          const path = `${ownerId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
          const { error: uploadError } = await supabase.storage.from('venue-photos').upload(path, file, { upsert: true });
          if (uploadError) throw uploadError;
          const { data } = supabase.storage.from('venue-photos').getPublicUrl(path);
          uploaded.push(data.publicUrl);
        }
        onChange([...photos, ...uploaded]);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Could not upload photos.');
      } finally {
        setUploading(false);
      }
    };
    input.click();
  }

  function removePhoto(url: string) {
    onChange(photos.filter((p) => p !== url));
  }

  const slots = Array.from({ length: MAX_PHOTOS }, (_, i) => i);

  return (
    <View>
      <div style={galleryStyle}>
        {slots.map((i) => {
          const url = photos[i];
          const isNextEmpty = i === photos.length;
          const cellStyle: CSSProperties = { ...tileStyle, ...(i === 0 ? { gridRow: 'span 2' } : {}) };

          if (url) {
            return (
              <div key={i} style={{ ...cellStyle, position: 'relative', padding: 0, backgroundImage: `url(${url})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
                {i === 0 && (
                  <View style={styles.coverBadge}>
                    <Text style={styles.coverBadgeText}>Cover</Text>
                  </View>
                )}
                <button
                  type="button"
                  onClick={() => removePhoto(url)}
                  aria-label="Remove photo"
                  style={removeBtnStyle}
                >
                  ✕
                </button>
              </div>
            );
          }

          if (uploading && isNextEmpty) {
            return (
              <div key={i} style={cellStyle}>
                <ActivityIndicator color={colors.accent} />
              </div>
            );
          }

          return (
            <div key={i} style={{ ...cellStyle, cursor: 'pointer' }} onClick={pickFiles}>
              <Text style={styles.addText}>{i === 0 ? '📷 Add cover photo' : '+'}</Text>
            </div>
          );
        })}
      </div>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Text style={styles.hint}>{photos.length}/{MAX_PHOTOS} photos · the first is your cover photo.</Text>
    </View>
  );
}

const galleryStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '2fr 1fr 1fr',
  gridTemplateRows: '1fr 1fr',
  gap: 10,
  height: 220,
};

const tileStyle: CSSProperties = {
  borderRadius: 16,
  backgroundColor: colors.accentSoft as unknown as string,
  border: `1.5px dashed ${colors.border as unknown as string}`,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  overflow: 'hidden',
};

const removeBtnStyle: CSSProperties = {
  position: 'absolute',
  top: 8,
  right: 8,
  width: 22,
  height: 22,
  borderRadius: 11,
  border: 'none',
  backgroundColor: 'rgba(20,18,14,0.6)',
  color: '#fff',
  fontSize: 11,
  lineHeight: '22px',
  cursor: 'pointer',
  padding: 0,
};

const styles = StyleSheet.create({
  addText: { fontFamily: fonts.sansSemiBold, fontSize: 13, color: colors.accent },
  coverBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(20,18,14,0.55)',
    borderRadius: radius.pill,
    paddingVertical: 3,
    paddingHorizontal: 9,
  },
  coverBadgeText: { fontFamily: fonts.sansSemiBold, fontSize: 10.5, color: '#fff' },
  hint: { fontFamily: fonts.sans, fontSize: 12, color: colors.textSoft, marginTop: 8 },
  error: { fontFamily: fonts.sans, fontSize: 12, color: colors.danger, marginTop: 8 },
});
