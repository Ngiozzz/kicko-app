import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { colors, fonts, radius } from '@kicko/shared';
import { venuesApi, Venue } from '../../../src/lib/venuesApi';
import { tournamentsApi } from '../../../src/lib/tournamentsApi';
import { SportIcon, Sport } from '../../../src/components/SportIcon';
import { NumberField, DateTimeField } from '../../../src/components/owner/WebInput';

export default function NewTournament() {
  const router = useRouter();
  const [venues, setVenues] = useState<Venue[] | null>(null);
  const [venueId, setVenueId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [entryFee, setEntryFee] = useState('');
  const [startAt, setStartAt] = useState('');
  const [endAt, setEndAt] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const { venues } = await venuesApi.list();
      const verified = venues.filter((v) => v.status === 'verified');
      setVenues(verified);
      setVenueId(verified[0]?.id ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load your venues.');
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleCreate() {
    if (!venueId) {
      setError('Add and verify a venue before creating a tournament.');
      return;
    }
    if (!name.trim() || !entryFee.trim() || !startAt || !endAt) {
      setError('Name, entry fee, start, and end are all required.');
      return;
    }
    const fee = Number(entryFee);
    if (Number.isNaN(fee) || fee < 0) {
      setError('Entry fee must be a valid number.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const { tournament } = await tournamentsApi.create({
        venue_id: venueId,
        name: name.trim(),
        description: description.trim() || null,
        entry_fee: fee,
        start_at: new Date(startAt).toISOString(),
        end_at: new Date(endAt).toISOString(),
      });
      router.replace(`/owner/tournaments/${tournament.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create this tournament.');
    } finally {
      setSubmitting(false);
    }
  }

  if (venues === null && !error) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <Text style={styles.title}>New tournament</Text>
      <Text style={styles.subtitle}>Starts as a draft — flip it to "open" once you're ready to accept team registrations.</Text>

      {venues && venues.length === 0 ? (
        <Text style={styles.error}>You need at least one verified venue before you can create a tournament.</Text>
      ) : (
        <>
          <Text style={styles.fieldLabel}>Venue</Text>
          <View style={styles.venueRow}>
            {venues?.map((v) => {
              const active = venueId === v.id;
              return (
                <Pressable key={v.id} onPress={() => setVenueId(v.id)} style={[styles.venueChip, active && styles.venueChipActive]}>
                  <SportIcon sport={v.sport as Sport} size={16} />
                  <Text style={[styles.venueChipText, active && styles.venueChipTextActive]}>{v.name}</Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={styles.fieldLabel}>Tournament name</Text>
          <TextInput value={name} onChangeText={setName} placeholder="e.g. Nyali Sevens Cup" placeholderTextColor={colors.textSoft} style={styles.input} />

          <Text style={styles.fieldLabel}>Description (optional)</Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="Rules, format, what teams should know"
            placeholderTextColor={colors.textSoft}
            multiline
            numberOfLines={3}
            style={[styles.input, styles.textarea]}
          />

          <NumberField label="Entry fee per team (KES)" placeholder="0" value={entryFee} onChangeText={setEntryFee} />

          <View style={styles.dateRow}>
            <View style={{ flex: 1 }}>
              <DateTimeField label="Starts" value={startAt} onChangeText={setStartAt} />
            </View>
            <View style={{ flex: 1 }}>
              <DateTimeField label="Ends" value={endAt} onChangeText={setEndAt} />
            </View>
          </View>

          {error && <Text style={styles.error}>{error}</Text>}

          <Pressable disabled={submitting} onPress={handleCreate} style={[styles.btn, submitting && styles.btnDisabled]}>
            <Text style={styles.btnText}>{submitting ? 'Creating…' : 'Create tournament'}</Text>
          </Pressable>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  center: { paddingVertical: 60, alignItems: 'center' },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: 24,
    maxWidth: 560,
  },
  title: { fontFamily: fonts.serif, fontSize: 22, color: colors.text, marginBottom: 6 },
  subtitle: { fontFamily: fonts.sans, fontSize: 13.5, color: colors.textSoft, lineHeight: 19, marginBottom: 22 },

  fieldLabel: { fontFamily: fonts.sansBold, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5, color: colors.textSoft, marginBottom: 8, marginTop: 4 },
  venueRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 18 },
  venueChip: { flexDirection: 'row', alignItems: 'center', gap: 7, borderWidth: 1, borderColor: colors.border, borderRadius: radius.pill, paddingVertical: 8, paddingHorizontal: 13 },
  venueChipActive: { backgroundColor: colors.accentSoft, borderColor: colors.accent },
  venueChipText: { fontFamily: fonts.sansMedium, fontSize: 12.5, color: colors.textSoft },
  venueChipTextActive: { color: colors.accent },

  input: {
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    fontFamily: fonts.sans,
    fontSize: 14,
    color: colors.text,
    marginBottom: 16,
  },
  textarea: { minHeight: 70, textAlignVertical: 'top' },

  dateRow: { flexDirection: 'row', gap: 14 },

  error: { fontFamily: fonts.sans, fontSize: 12.5, color: colors.danger, marginBottom: 12 },

  btn: { marginTop: 8, backgroundColor: colors.accent, borderRadius: radius.pill, paddingVertical: 14, alignItems: 'center' },
  btnDisabled: { opacity: 0.4 },
  btnText: { fontFamily: fonts.sansBold, fontSize: 14, color: colors.accentText },
});
