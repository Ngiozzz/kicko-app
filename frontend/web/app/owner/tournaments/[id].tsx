import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import { colors, fonts, radius } from '@kicko/shared';
import { tournamentsApi, Tournament, TournamentTeam, Fixture, TournamentStatus } from '../../../src/lib/tournamentsApi';
import { SportIcon, Sport } from '../../../src/components/SportIcon';
import { DateTimeField } from '../../../src/components/owner/WebInput';
import { useBreadcrumb } from '../../../src/lib/breadcrumbContext';

const STATUS_FLOW: { key: TournamentStatus; label: string }[] = [
  { key: 'draft', label: 'Draft' },
  { key: 'open', label: 'Open for registration' },
  { key: 'in_progress', label: 'In progress' },
  { key: 'completed', label: 'Completed' },
  { key: 'cancelled', label: 'Cancelled' },
];

function PaymentTag({ status }: { status: TournamentTeam['payment_status'] }) {
  const label = status === 'paid' ? 'Paid' : status === 'refunded' ? 'Refunded' : 'Awaiting payment';
  return <Text style={[styles.payTag, status === 'paid' ? styles.payTagGood : styles.payTagWarn]}>{label}</Text>;
}

// Owns its own score-entry state so typing into one fixture's score boxes
// doesn't re-render (or get clobbered by a reload of) every other fixture.
function FixtureRow({ fixture, onSave, onDelete }: { fixture: Fixture; onSave: (homeScore: number, awayScore: number) => Promise<void>; onDelete: () => void }) {
  const [homeScore, setHomeScore] = useState(fixture.home_score?.toString() ?? '');
  const [awayScore, setAwayScore] = useState(fixture.away_score?.toString() ?? '');
  const [saving, setSaving] = useState(false);

  async function save() {
    const h = Number(homeScore);
    const a = Number(awayScore);
    if (Number.isNaN(h) || Number.isNaN(a)) return;
    setSaving(true);
    try {
      await onSave(h, a);
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={styles.fixtureRow}>
      <View style={{ flex: 1, minWidth: 0 }}>
        {fixture.round_label && <Text style={styles.fixtureRound}>{fixture.round_label}</Text>}
        <Text style={styles.fixtureTeams}>
          {fixture.home_team.name} vs {fixture.away_team.name}
        </Text>
        {fixture.scheduled_at && (
          <Text style={styles.fixtureMeta}>{new Date(fixture.scheduled_at).toLocaleString('en-KE', { weekday: 'short', hour: 'numeric', minute: '2-digit' })}</Text>
        )}
        {fixture.status === 'completed' && (
          <Text style={styles.fixtureResult}>
            Result: {fixture.home_score} – {fixture.away_score}
            {fixture.winner_team_id ? ` · ${fixture.winner_team_id === fixture.home_team_id ? fixture.home_team.name : fixture.away_team.name} won` : ' · Draw'}
          </Text>
        )}
      </View>
      <View style={styles.scoreRow}>
        <TextInput value={homeScore} onChangeText={setHomeScore} keyboardType="numeric" placeholder="0" placeholderTextColor={colors.textSoft} style={styles.scoreInput} />
        <Text style={styles.scoreDash}>–</Text>
        <TextInput value={awayScore} onChangeText={setAwayScore} keyboardType="numeric" placeholder="0" placeholderTextColor={colors.textSoft} style={styles.scoreInput} />
        <Pressable disabled={saving} onPress={save} style={styles.saveResultBtn}>
          <Text style={styles.saveResultBtnText}>{saving ? '…' : 'Save'}</Text>
        </Pressable>
        <Pressable onPress={onDelete}>
          <Text style={styles.removeLink}>Remove</Text>
        </Pressable>
      </View>
    </View>
  );
}

export default function ManageTournament() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [teams, setTeams] = useState<TournamentTeam[]>([]);
  const [fixtures, setFixtures] = useState<Fixture[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [fxRoundLabel, setFxRoundLabel] = useState('');
  const [fxHomeTeamId, setFxHomeTeamId] = useState<string | null>(null);
  const [fxAwayTeamId, setFxAwayTeamId] = useState<string | null>(null);
  const [fxScheduledAt, setFxScheduledAt] = useState('');
  const [fxSubmitting, setFxSubmitting] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    try {
      const res = await tournamentsApi.get(id);
      setTournament(res.tournament);
      setTeams(res.teams);
      setFixtures(res.fixtures);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load this tournament.');
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  useBreadcrumb(tournament ? [{ label: 'Home', href: '/owner' }, { label: 'Tournaments', href: '/owner/tournaments' }, { label: tournament.name }] : null);

  async function handleStatusChange(status: TournamentStatus) {
    if (!id) return;
    setError(null);
    try {
      const { tournament } = await tournamentsApi.update(id, { status });
      setTournament(tournament);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update status.');
    }
  }

  const registeredTeams = teams.filter((t) => t.status === 'registered');

  async function handleCreateFixture() {
    if (!id || !fxHomeTeamId || !fxAwayTeamId) {
      setError('Pick both teams for the fixture.');
      return;
    }
    setFxSubmitting(true);
    setError(null);
    try {
      await tournamentsApi.createFixture(id, {
        round_label: fxRoundLabel.trim() || undefined,
        home_team_id: fxHomeTeamId,
        away_team_id: fxAwayTeamId,
        scheduled_at: fxScheduledAt ? new Date(fxScheduledAt).toISOString() : undefined,
      });
      setFxRoundLabel('');
      setFxHomeTeamId(null);
      setFxAwayTeamId(null);
      setFxScheduledAt('');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create fixture.');
    } finally {
      setFxSubmitting(false);
    }
  }

  async function handleSaveResult(fixtureId: string, homeScore: number, awayScore: number) {
    if (!id) return;
    try {
      await tournamentsApi.updateFixture(id, fixtureId, { home_score: homeScore, away_score: awayScore });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save that result.');
    }
  }

  async function handleDeleteFixture(fixtureId: string) {
    if (!id) return;
    try {
      await tournamentsApi.deleteFixture(id, fixtureId);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not remove that fixture.');
    }
  }

  if (error && !tournament) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>{error}</Text>
      </View>
    );
  }
  if (!tournament) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  return (
    <View style={styles.layout}>
      <View style={styles.mainCol}>
        <View style={styles.titleRow}>
          <SportIcon sport={tournament.venue.sport as Sport} size={22} />
          <Text style={styles.title}>{tournament.name}</Text>
        </View>
        <Text style={styles.subtitle}>
          {tournament.venue.name} · {tournament.venue.location}
        </Text>
        <Text style={styles.subtitle}>
          {new Date(tournament.start_at).toLocaleString('en-KE', { weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })} –{' '}
          {new Date(tournament.end_at).toLocaleString('en-KE', { weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })}
        </Text>
        {tournament.description && <Text style={styles.description}>{tournament.description}</Text>}

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Status</Text>
          <View style={styles.statusRow}>
            {STATUS_FLOW.map((s) => (
              <Pressable
                key={s.key}
                onPress={() => handleStatusChange(s.key)}
                style={[styles.statusChip, tournament.status === s.key && styles.statusChipActive]}
              >
                <Text style={[styles.statusChipText, tournament.status === s.key && styles.statusChipTextActive]}>{s.label}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        {error && <Text style={styles.error}>{error}</Text>}

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Fixtures</Text>
          {fixtures.length === 0 && <Text style={styles.emptyText}>No fixtures yet — add one below once teams have registered.</Text>}
          {fixtures.map((f) => (
            <FixtureRow key={f.id} fixture={f} onSave={(h, a) => handleSaveResult(f.id, h, a)} onDelete={() => handleDeleteFixture(f.id)} />
          ))}

          <View style={styles.addFixture}>
            <Text style={styles.cardSubtitle}>Add a fixture</Text>
            {registeredTeams.length < 2 ? (
              <Text style={styles.emptyText}>Need at least 2 registered teams first.</Text>
            ) : (
              <>
                <TextInput
                  value={fxRoundLabel}
                  onChangeText={setFxRoundLabel}
                  placeholder="Round (optional) — e.g. Pool A, Semi-final"
                  placeholderTextColor={colors.textSoft}
                  style={styles.input}
                />
                <View style={styles.teamPickRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.pickLabel}>Home</Text>
                    <View style={styles.teamChips}>
                      {registeredTeams.map((t) => (
                        <Pressable
                          key={t.team.id}
                          onPress={() => setFxHomeTeamId(t.team.id)}
                          style={[styles.teamChip, fxHomeTeamId === t.team.id && styles.teamChipActive]}
                        >
                          <Text style={[styles.teamChipText, fxHomeTeamId === t.team.id && styles.teamChipTextActive]}>{t.team.name}</Text>
                        </Pressable>
                      ))}
                    </View>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.pickLabel}>Away</Text>
                    <View style={styles.teamChips}>
                      {registeredTeams
                        .filter((t) => t.team.id !== fxHomeTeamId)
                        .map((t) => (
                          <Pressable
                            key={t.team.id}
                            onPress={() => setFxAwayTeamId(t.team.id)}
                            style={[styles.teamChip, fxAwayTeamId === t.team.id && styles.teamChipActive]}
                          >
                            <Text style={[styles.teamChipText, fxAwayTeamId === t.team.id && styles.teamChipTextActive]}>{t.team.name}</Text>
                          </Pressable>
                        ))}
                    </View>
                  </View>
                </View>
                <DateTimeField label="Kick-off (optional)" value={fxScheduledAt} onChangeText={setFxScheduledAt} />
                <Pressable disabled={fxSubmitting} onPress={handleCreateFixture} style={[styles.btn, fxSubmitting && styles.btnDisabled]}>
                  <Text style={styles.btnText}>{fxSubmitting ? 'Adding…' : 'Add fixture'}</Text>
                </Pressable>
              </>
            )}
          </View>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Registered teams ({registeredTeams.length})</Text>
        {teams.length === 0 && <Text style={styles.emptyText}>No teams registered yet.</Text>}
        {teams.map((t) => (
          <View key={t.id} style={styles.teamRow}>
            <Text style={styles.teamRowName}>{t.team.name}</Text>
            {t.status === 'withdrawn' ? <Text style={styles.withdrawnTag}>Withdrawn</Text> : <PaymentTag status={t.payment_status} />}
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  error: { fontFamily: fonts.sans, fontSize: 13, color: colors.danger, marginBottom: 12 },

  layout: { flexDirection: 'row', flexWrap: 'wrap', gap: 24, alignItems: 'flex-start' },
  mainCol: { flex: 1.8, minWidth: 340 },

  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6 },
  title: { fontFamily: fonts.serif, fontSize: 24, color: colors.text },
  subtitle: { fontFamily: fonts.sans, fontSize: 13.5, color: colors.textSoft, marginBottom: 4 },
  description: { fontFamily: fonts.sans, fontSize: 13.5, color: colors.text, lineHeight: 19, marginTop: 10 },

  card: {
    flex: 1,
    minWidth: 300,
    maxWidth: 420,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: 22,
    marginTop: 18,
  },
  cardTitle: { fontFamily: fonts.sansSemiBold, fontSize: 14, color: colors.text, marginBottom: 14 },
  cardSubtitle: { fontFamily: fonts.sansSemiBold, fontSize: 12.5, color: colors.textSoft, marginBottom: 10 },
  emptyText: { fontFamily: fonts.sans, fontSize: 13, color: colors.textSoft },

  statusRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  statusChip: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.pill, paddingVertical: 8, paddingHorizontal: 14 },
  statusChipActive: { backgroundColor: colors.accent, borderColor: 'transparent' },
  statusChipText: { fontFamily: fonts.sansSemiBold, fontSize: 12.5, color: colors.textSoft },
  statusChipTextActive: { color: colors.accentText },

  teamRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border },
  teamRowName: { fontFamily: fonts.sansMedium, fontSize: 13.5, color: colors.text },
  payTag: { fontFamily: fonts.sansBold, fontSize: 10.5, textTransform: 'uppercase', letterSpacing: 0.4, paddingVertical: 4, paddingHorizontal: 9, borderRadius: radius.pill, overflow: 'hidden' },
  payTagGood: { backgroundColor: colors.accentSoft, color: colors.accent },
  payTagWarn: { backgroundColor: colors.surface2, color: colors.textSoft },
  withdrawnTag: { fontFamily: fonts.sansBold, fontSize: 10.5, textTransform: 'uppercase', color: colors.danger },

  fixtureRow: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border, gap: 8 },
  fixtureRound: { fontFamily: fonts.sansBold, fontSize: 10.5, textTransform: 'uppercase', letterSpacing: 0.4, color: colors.accent, marginBottom: 2 },
  fixtureTeams: { fontFamily: fonts.sansSemiBold, fontSize: 14, color: colors.text },
  fixtureMeta: { fontFamily: fonts.sans, fontSize: 12, color: colors.textSoft, marginTop: 2 },
  fixtureResult: { fontFamily: fonts.sans, fontSize: 12.5, color: colors.text, marginTop: 4 },

  scoreRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  scoreInput: {
    width: 44,
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingVertical: 8,
    textAlign: 'center',
    fontFamily: fonts.sans,
    fontSize: 13,
    color: colors.text,
  },
  scoreDash: { fontFamily: fonts.sansBold, color: colors.textSoft },
  saveResultBtn: { backgroundColor: colors.accent, borderRadius: radius.pill, paddingVertical: 7, paddingHorizontal: 14 },
  saveResultBtnText: { fontFamily: fonts.sansBold, fontSize: 12, color: colors.accentText },
  removeLink: { fontFamily: fonts.sansSemiBold, fontSize: 12, color: colors.danger },

  addFixture: { marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: colors.border },
  input: {
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    fontFamily: fonts.sans,
    fontSize: 13.5,
    color: colors.text,
    marginBottom: 14,
  },
  teamPickRow: { flexDirection: 'row', gap: 14, marginBottom: 14 },
  pickLabel: { fontFamily: fonts.sansBold, fontSize: 10.5, textTransform: 'uppercase', letterSpacing: 0.4, color: colors.textSoft, marginBottom: 6 },
  teamChips: { gap: 6 },
  teamChip: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.pill, paddingVertical: 7, paddingHorizontal: 12, alignSelf: 'flex-start' },
  teamChipActive: { backgroundColor: colors.accentSoft, borderColor: colors.accent },
  teamChipText: { fontFamily: fonts.sansMedium, fontSize: 12, color: colors.textSoft },
  teamChipTextActive: { color: colors.accent },

  btn: { marginTop: 4, backgroundColor: colors.accent, borderRadius: radius.pill, paddingVertical: 12, alignItems: 'center' },
  btnDisabled: { opacity: 0.4 },
  btnText: { fontFamily: fonts.sansBold, fontSize: 13.5, color: colors.accentText },
});
