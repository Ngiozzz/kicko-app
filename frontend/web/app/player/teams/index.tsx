import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Link, useFocusEffect } from 'expo-router';
import { colors, fonts, radius } from '@kicko/shared';
import { teamsApi, Team } from '../../../src/lib/teamsApi';
import { SportIcon, Sport } from '../../../src/components/SportIcon';

const SPORTS: { sport: Sport; label: string }[] = [
  { sport: 'football', label: 'Football' },
  { sport: 'basketball', label: 'Basketball' },
  { sport: 'tennis', label: 'Tennis' },
  { sport: 'padel', label: 'Padel' },
  { sport: 'volleyball', label: 'Volleyball' },
  { sport: 'rugby', label: 'Rugby' },
];

export default function PlayerTeams() {
  const [teams, setTeams] = useState<Team[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');
  const [sport, setSport] = useState<Sport | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const { teams } = await teamsApi.mine();
      setTeams(teams);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load your teams.');
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  async function handleCreate() {
    if (!name.trim()) {
      setFormError('Give your team a name.');
      return;
    }
    setSubmitting(true);
    setFormError(null);
    try {
      await teamsApi.create({ name: name.trim(), sport });
      setName('');
      setSport(null);
      setCreating(false);
      await load();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Could not create this team.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <View>
      <View style={styles.headRow}>
        <View>
          <Text style={styles.title}>Teams</Text>
          <Text style={styles.subtitle}>Build a roster once, reuse it to register for tournaments and play together.</Text>
        </View>
        <Pressable style={styles.newBtn} onPress={() => setCreating((v) => !v)}>
          <Text style={styles.newBtnText}>{creating ? 'Cancel' : '+ New team'}</Text>
        </Pressable>
      </View>

      {creating && (
        <View style={styles.card}>
          <Text style={styles.fieldLabel}>Team name</Text>
          <TextInput value={name} onChangeText={setName} placeholder="e.g. Nyali Sevens" placeholderTextColor={colors.textSoft} style={styles.input} />

          <Text style={[styles.fieldLabel, { marginTop: 14 }]}>Sport (optional)</Text>
          <View style={styles.sportRow}>
            {SPORTS.map((s) => {
              const active = sport === s.sport;
              return (
                <Pressable key={s.sport} onPress={() => setSport(active ? null : s.sport)} style={[styles.sportChip, active && styles.sportChipActive]}>
                  <SportIcon sport={s.sport} size={16} />
                  <Text style={[styles.sportChipText, active && styles.sportChipTextActive]}>{s.label}</Text>
                </Pressable>
              );
            })}
          </View>

          {formError && <Text style={styles.error}>{formError}</Text>}

          <Pressable disabled={submitting} onPress={handleCreate} style={[styles.btn, submitting && styles.btnDisabled]}>
            <Text style={styles.btnText}>{submitting ? 'Creating…' : 'Create team'}</Text>
          </Pressable>
        </View>
      )}

      {teams === null && !error && (
        <View style={styles.loading}>
          <ActivityIndicator color={colors.accent} />
        </View>
      )}
      {error && <Text style={styles.error}>{error}</Text>}
      {teams && teams.length === 0 && !creating && (
        <View style={styles.emptyState}>
          <View style={styles.emptyIconRing}>
            <Text style={styles.emptyIcon}>👥</Text>
          </View>
          <Text style={styles.emptyTitle}>No teams yet</Text>
          <Text style={styles.emptyBody}>Create a team to build a roster you can reuse for tournaments and group play.</Text>
        </View>
      )}

      {teams?.map((t) => (
        <Link key={t.id} href={`/player/teams/${t.id}`} asChild>
          <Pressable style={styles.row}>
            <View style={styles.rowInfo}>
              <View style={styles.thumb}>{t.sport ? <SportIcon sport={t.sport as Sport} size={22} /> : <Text style={styles.thumbFallback}>👥</Text>}</View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={styles.rowTitle}>{t.name}</Text>
                <Text style={styles.rowMeta}>{t.sport ?? 'No sport set'}</Text>
              </View>
            </View>
            <View style={styles.rowActions}>
              {t.my_status === 'invited' ? (
                <Text style={styles.pendingTag}>Invited</Text>
              ) : (
                <Text style={styles.roleTag}>{t.my_role === 'captain' ? 'Captain' : 'Member'}</Text>
              )}
            </View>
          </Pressable>
        </Link>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  headRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, gap: 16, flexWrap: 'wrap' },
  title: { fontFamily: fonts.serif, fontSize: 26, color: colors.text, marginBottom: 6 },
  subtitle: { fontFamily: fonts.sans, fontSize: 14, color: colors.textSoft, maxWidth: 520, lineHeight: 20 },
  newBtn: { backgroundColor: colors.accent, borderRadius: radius.pill, paddingVertical: 11, paddingHorizontal: 18 },
  newBtnText: { fontFamily: fonts.sansBold, fontSize: 13.5, color: colors.accentText },

  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: 20,
    marginBottom: 20,
    maxWidth: 480,
  },
  fieldLabel: { fontFamily: fonts.sansBold, fontSize: 11.5, textTransform: 'uppercase', letterSpacing: 0.5, color: colors.textSoft, marginBottom: 8 },
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
  },
  sportRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  sportChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingVertical: 8,
    paddingHorizontal: 13,
  },
  sportChipActive: { backgroundColor: colors.accentSoft, borderColor: colors.accent },
  sportChipText: { fontFamily: fonts.sansMedium, fontSize: 12.5, color: colors.textSoft },
  sportChipTextActive: { color: colors.accent },

  btn: { marginTop: 18, backgroundColor: colors.accent, borderRadius: radius.pill, paddingVertical: 13, alignItems: 'center' },
  btnDisabled: { opacity: 0.4 },
  btnText: { fontFamily: fonts.sansBold, fontSize: 14, color: colors.accentText },

  loading: { paddingVertical: 60, alignItems: 'center' },
  error: { fontFamily: fonts.sans, fontSize: 13, color: colors.danger, marginTop: 10, marginBottom: 4 },

  emptyState: { alignItems: 'center', paddingVertical: 60, paddingHorizontal: 20 },
  emptyIconRing: { width: 56, height: 56, borderRadius: 28, backgroundColor: colors.surface2, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  emptyIcon: { fontSize: 24 },
  emptyTitle: { fontFamily: fonts.serifMedium, fontSize: 17, color: colors.text, marginBottom: 8 },
  emptyBody: { fontFamily: fonts.sans, fontSize: 13.5, color: colors.textSoft, textAlign: 'center', maxWidth: 420, lineHeight: 19 },

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
  thumbFallback: { fontSize: 18 },
  rowTitle: { fontFamily: fonts.sansSemiBold, fontSize: 14.5, color: colors.text },
  rowMeta: { fontFamily: fonts.sans, fontSize: 12.5, color: colors.textSoft, marginTop: 2, textTransform: 'capitalize' },
  rowActions: { flexDirection: 'row', alignItems: 'center' },
  roleTag: {
    fontFamily: fonts.sansBold,
    fontSize: 10.5,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    color: colors.textSoft,
    backgroundColor: colors.surface2,
    paddingVertical: 4,
    paddingHorizontal: 9,
    borderRadius: radius.pill,
    overflow: 'hidden',
  },
  pendingTag: {
    fontFamily: fonts.sansBold,
    fontSize: 10.5,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    color: colors.accent,
    backgroundColor: colors.accentSoft,
    paddingVertical: 4,
    paddingHorizontal: 9,
    borderRadius: radius.pill,
    overflow: 'hidden',
  },
});
