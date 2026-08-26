import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { colors, fonts, radius } from '@kicko/shared';
import { exploreApi, Venue } from '../../../src/lib/venuesApi';
import { SportIcon, Sport } from '../../../src/components/SportIcon';
import { getSportContent } from '../../../src/content/sportContent';

// Quick-start picker for the Open Sessions tab's "+ Session" button — only
// squad sports (football/basketball/rugby) have a session to start here;
// tennis/padel's "open" flow is a slot on a split booking instead, started
// from the venue page itself, not from this list.
export default function NewOpenSession() {
  const router = useRouter();
  const [venues, setVenues] = useState<Venue[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const { venues } = await exploreApi.list();
      setVenues(venues.filter((v) => getSportContent(v.sport).bookingMode === 'squad'));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load venues.');
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  return (
    <View>
      <View style={styles.headRow}>
        <Text style={styles.title}>Start an open session</Text>
        <Text style={styles.subtitle}>Pick a venue — you'll choose the date, time, and game details next.</Text>
      </View>

      {venues === null && !error && (
        <View style={styles.loading}>
          <ActivityIndicator color={colors.accent} />
        </View>
      )}
      {error && <Text style={styles.error}>{error}</Text>}
      {venues && venues.length === 0 && <Text style={styles.emptyText}>No football, basketball, or rugby venues are live yet.</Text>}

      {venues?.map((v) => (
        <Pressable key={v.id} style={styles.row} onPress={() => router.push(`/player/explore/${v.id}?open=1`)}>
          <View style={styles.rowInfo}>
            <View style={styles.thumb}>
              <SportIcon sport={v.sport as Sport} size={22} />
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={styles.rowTitle}>{v.name}</Text>
              <Text style={styles.rowMeta}>
                {v.sport} · {v.location}
              </Text>
            </View>
          </View>
          <Text style={styles.rowPrice}>KES {v.price_off_peak.toLocaleString()}/hr</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  headRow: { marginBottom: 24 },
  title: { fontFamily: fonts.serif, fontSize: 26, color: colors.text, marginBottom: 6 },
  subtitle: { fontFamily: fonts.sans, fontSize: 14, color: colors.textSoft, maxWidth: 520, lineHeight: 20 },

  loading: { paddingVertical: 60, alignItems: 'center' },
  error: { fontFamily: fonts.sans, fontSize: 13, color: colors.danger, marginBottom: 12 },
  emptyText: { fontFamily: fonts.sans, fontSize: 13.5, color: colors.textSoft },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 14,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: 16,
    marginBottom: 12,
  },
  rowInfo: { flexDirection: 'row', alignItems: 'center', gap: 14, flex: 1, minWidth: 0 },
  thumb: { width: 44, height: 44, borderRadius: 12, backgroundColor: colors.surface2, alignItems: 'center', justifyContent: 'center' },
  rowTitle: { fontFamily: fonts.sansSemiBold, fontSize: 14.5, color: colors.text },
  rowMeta: { fontFamily: fonts.sans, fontSize: 12.5, color: colors.textSoft, marginTop: 2, textTransform: 'capitalize' },
  rowPrice: { fontFamily: fonts.sansBold, fontSize: 13, color: colors.accent },
});
