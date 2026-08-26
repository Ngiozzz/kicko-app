import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import { colors, fonts, radius } from '@kicko/shared';
import { tournamentsApi, Tournament, TournamentTeam, Fixture } from '../../../src/lib/tournamentsApi';
import { teamsApi, Team } from '../../../src/lib/teamsApi';
import { Payment } from '../../../src/lib/bookingsApi';
import { SportIcon, Sport } from '../../../src/components/SportIcon';
import { useBreadcrumb } from '../../../src/lib/breadcrumbContext';

export default function TournamentDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [teams, setTeams] = useState<TournamentTeam[]>([]);
  const [fixtures, setFixtures] = useState<Fixture[]>([]);
  const [myTeams, setMyTeams] = useState<Team[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [pickedTeamId, setPickedTeamId] = useState<string | null>(null);
  const [phone, setPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [pendingPayment, setPendingPayment] = useState<Payment | null>(null);
  const [confirmed, setConfirmed] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    try {
      const [detail, mine] = await Promise.all([tournamentsApi.get(id), teamsApi.mine()]);
      setTournament(detail.tournament);
      setTeams(detail.teams);
      setFixtures(detail.fixtures);
      setMyTeams(mine.teams);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load this tournament.');
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  useBreadcrumb(tournament ? [{ label: 'Home', href: '/player' }, { label: 'Tournaments', href: '/player/tournaments' }, { label: tournament.name }] : null);

  async function handleRegister() {
    if (!id || !pickedTeamId || !phone.trim()) {
      setError('Pick a team and enter a phone number.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const { payment } = await tournamentsApi.register(id, { team_id: pickedTeamId, phone_number: phone.trim() });
      setPendingPayment(payment);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not register this team.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSimulateConfirm() {
    if (!pendingPayment) return;
    setSubmitting(true);
    setError(null);
    try {
      await tournamentsApi.confirmEntryPayment(pendingPayment.id);
      setConfirmed(true);
      setPendingPayment(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not confirm payment.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleWithdraw(teamId: string) {
    if (!id) return;
    setError(null);
    try {
      await tournamentsApi.withdraw(id, teamId);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not withdraw this team.');
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

  const registeredTeamIds = new Set(teams.filter((t) => t.status === 'registered').map((t) => t.team_id));
  const eligibleTeams = myTeams.filter((t) => t.my_role === 'captain' && !registeredTeamIds.has(t.id));
  const myRegisteredTeams = teams.filter((t) => myTeams.some((mt) => mt.id === t.team_id && mt.my_role === 'captain'));
  const canRegister = tournament.status === 'open' && (!tournament.registration_deadline || new Date(tournament.registration_deadline) > new Date());

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
          <Text style={styles.cardTitle}>Fixtures</Text>
          {fixtures.length === 0 && <Text style={styles.emptyText}>No fixtures scheduled yet.</Text>}
          {fixtures.map((f) => (
            <View key={f.id} style={styles.fixtureRow}>
              {f.round_label && <Text style={styles.fixtureRound}>{f.round_label}</Text>}
              <Text style={styles.fixtureTeams}>
                {f.home_team.name} vs {f.away_team.name}
              </Text>
              {f.status === 'completed' ? (
                <Text style={styles.fixtureResult}>
                  {f.home_score} – {f.away_score}
                </Text>
              ) : f.scheduled_at ? (
                <Text style={styles.fixtureMeta}>{new Date(f.scheduled_at).toLocaleString('en-KE', { weekday: 'short', hour: 'numeric', minute: '2-digit' })}</Text>
              ) : (
                <Text style={styles.fixtureMeta}>Not yet scheduled</Text>
              )}
            </View>
          ))}
        </View>
      </View>

      <View style={styles.sideCol}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Entry fee</Text>
          <Text style={styles.priceLine}>KES {tournament.entry_fee.toLocaleString()}</Text>
          <Text style={styles.hint}>Paid once per team by whoever registers it — the captain sorts out the split with their squad.</Text>
        </View>

        {myRegisteredTeams.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Your teams here</Text>
            {myRegisteredTeams.map((t) => (
              <View key={t.id} style={styles.myTeamRow}>
                <View>
                  <Text style={styles.myTeamName}>{t.team.name}</Text>
                  <Text style={styles.myTeamStatus}>{t.status === 'withdrawn' ? 'Withdrawn' : t.payment_status === 'paid' ? 'Paid & registered' : 'Awaiting payment'}</Text>
                </View>
                {t.status === 'registered' && t.payment_status === 'unpaid' && (
                  <Pressable onPress={() => handleWithdraw(t.team_id)}>
                    <Text style={styles.withdrawLink}>Withdraw</Text>
                  </Pressable>
                )}
              </View>
            ))}
          </View>
        )}

        {canRegister && eligibleTeams.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Register a team</Text>
            {!pendingPayment && !confirmed ? (
              <>
                <Text style={styles.fieldLabel}>Which team</Text>
                <View style={styles.teamChips}>
                  {eligibleTeams.map((t) => (
                    <Pressable key={t.id} onPress={() => setPickedTeamId(t.id)} style={[styles.teamChip, pickedTeamId === t.id && styles.teamChipActive]}>
                      <Text style={[styles.teamChipText, pickedTeamId === t.id && styles.teamChipTextActive]}>{t.name}</Text>
                    </Pressable>
                  ))}
                </View>
                <Text style={[styles.fieldLabel, { marginTop: 14 }]}>M-Pesa phone number</Text>
                <TextInput value={phone} onChangeText={setPhone} placeholder="+254 7XX XXX XXX" placeholderTextColor={colors.textSoft} style={styles.input} />

                {error && <Text style={styles.error}>{error}</Text>}

                <Pressable disabled={submitting} onPress={handleRegister} style={[styles.btn, submitting && styles.btnDisabled]}>
                  <Text style={styles.btnText}>{submitting ? 'Starting…' : 'Continue to pay with M-Pesa'}</Text>
                </Pressable>
              </>
            ) : pendingPayment ? (
              <View style={styles.stkPanel}>
                <Text style={styles.stkBody}>
                  Check <Text style={styles.stkStrong}>{pendingPayment.phone_number}</Text> and enter your M-Pesa PIN to pay{' '}
                  <Text style={styles.stkStrong}>KES {pendingPayment.amount.toLocaleString()}</Text>.
                </Text>
                {error && <Text style={styles.error}>{error}</Text>}
                <Pressable onPress={handleSimulateConfirm} disabled={submitting}>
                  <Text style={styles.confirmLink}>{submitting ? 'Confirming…' : 'Simulate M-Pesa confirmation →'}</Text>
                </Pressable>
              </View>
            ) : (
              <Text style={styles.hint}>You're in! The team's entry is confirmed.</Text>
            )}
          </View>
        )}

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Registered teams ({teams.filter((t) => t.status === 'registered').length})</Text>
          {teams.filter((t) => t.status === 'registered').length === 0 && <Text style={styles.emptyText}>No teams registered yet — be the first.</Text>}
          {teams
            .filter((t) => t.status === 'registered')
            .map((t) => (
              <Text key={t.id} style={styles.teamListItem}>
                {t.team.name}
              </Text>
            ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  error: { fontFamily: fonts.sans, fontSize: 13, color: colors.danger, marginTop: 8, marginBottom: 8 },

  layout: { flexDirection: 'row', flexWrap: 'wrap', gap: 24, alignItems: 'flex-start' },
  mainCol: { flex: 1.6, minWidth: 320 },
  sideCol: { flex: 1, minWidth: 300, maxWidth: 380, gap: 18 },

  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6 },
  title: { fontFamily: fonts.serif, fontSize: 24, color: colors.text },
  subtitle: { fontFamily: fonts.sans, fontSize: 13.5, color: colors.textSoft, marginBottom: 4 },
  description: { fontFamily: fonts.sans, fontSize: 13.5, color: colors.text, lineHeight: 19, marginTop: 10 },

  card: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, padding: 22, marginTop: 18 },
  cardTitle: { fontFamily: fonts.sansSemiBold, fontSize: 14, color: colors.text, marginBottom: 14 },
  emptyText: { fontFamily: fonts.sans, fontSize: 13, color: colors.textSoft },

  fixtureRow: { paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border },
  fixtureRound: { fontFamily: fonts.sansBold, fontSize: 10.5, textTransform: 'uppercase', letterSpacing: 0.4, color: colors.accent, marginBottom: 2 },
  fixtureTeams: { fontFamily: fonts.sansSemiBold, fontSize: 14, color: colors.text },
  fixtureMeta: { fontFamily: fonts.sans, fontSize: 12, color: colors.textSoft, marginTop: 2 },
  fixtureResult: { fontFamily: fonts.sansBold, fontSize: 13, color: colors.text, marginTop: 2 },

  priceLine: { fontFamily: fonts.serif, fontSize: 22, color: colors.text, marginBottom: 8 },
  hint: { fontFamily: fonts.sans, fontSize: 12.5, color: colors.textSoft, lineHeight: 18 },

  myTeamRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.border },
  myTeamName: { fontFamily: fonts.sansMedium, fontSize: 13.5, color: colors.text },
  myTeamStatus: { fontFamily: fonts.sans, fontSize: 12, color: colors.textSoft, marginTop: 2 },
  withdrawLink: { fontFamily: fonts.sansSemiBold, fontSize: 12.5, color: colors.danger },

  fieldLabel: { fontFamily: fonts.sansBold, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5, color: colors.textSoft, marginBottom: 8 },
  teamChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  teamChip: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.pill, paddingVertical: 8, paddingHorizontal: 14 },
  teamChipActive: { backgroundColor: colors.accentSoft, borderColor: colors.accent },
  teamChipText: { fontFamily: fonts.sansMedium, fontSize: 12.5, color: colors.textSoft },
  teamChipTextActive: { color: colors.accent },

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

  btn: { marginTop: 16, backgroundColor: colors.accent, borderRadius: radius.pill, paddingVertical: 13, alignItems: 'center' },
  btnDisabled: { opacity: 0.4 },
  btnText: { fontFamily: fonts.sansBold, fontSize: 14, color: colors.accentText },

  stkPanel: { alignItems: 'center' },
  stkBody: { fontFamily: fonts.sans, fontSize: 13, color: colors.textSoft, textAlign: 'center', lineHeight: 19, marginBottom: 12 },
  stkStrong: { fontFamily: fonts.sansBold, color: colors.text },
  confirmLink: { fontFamily: fonts.sansSemiBold, fontSize: 12.5, color: colors.accent, textDecorationLine: 'underline' },

  teamListItem: { fontFamily: fonts.sans, fontSize: 13.5, color: colors.text, paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: colors.border },
});
