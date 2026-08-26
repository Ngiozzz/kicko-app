import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import { colors, fonts, radius } from '@kicko/shared';
import { teamsApi, Team, TeamMember } from '../../../src/lib/teamsApi';
import { SportIcon, Sport } from '../../../src/components/SportIcon';
import { useBreadcrumb } from '../../../src/lib/breadcrumbContext';

export default function TeamDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const [team, setTeam] = useState<Team | null>(null);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [myMembership, setMyMembership] = useState<TeamMember | null>(null);
  const [isCaptain, setIsCaptain] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [invitePhone, setInvitePhone] = useState('');
  const [inviting, setInviting] = useState(false);
  const [responding, setResponding] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    try {
      const res = await teamsApi.get(id);
      setTeam(res.team);
      setMembers(res.members);
      setMyMembership(res.my_membership);
      setIsCaptain(res.is_captain);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load this team.');
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  useBreadcrumb(team ? [{ label: 'Home', href: '/player' }, { label: 'Teams', href: '/player/teams' }, { label: team.name }] : null);

  async function handleInvite() {
    if (!id || !invitePhone.trim()) return;
    setInviting(true);
    setError(null);
    try {
      await teamsApi.invite(id, invitePhone.trim());
      setInvitePhone('');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send that invite.');
    } finally {
      setInviting(false);
    }
  }

  async function handleRespond(accept: boolean) {
    if (!id) return;
    setResponding(true);
    setError(null);
    try {
      await teamsApi.respond(id, accept);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update your invite.');
    } finally {
      setResponding(false);
    }
  }

  async function handleRemove(memberId: string) {
    if (!id) return;
    setRemovingId(memberId);
    setError(null);
    try {
      await teamsApi.removeMember(id, memberId);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not remove that player.');
    } finally {
      setRemovingId(null);
    }
  }

  if (error && !team) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>{error}</Text>
      </View>
    );
  }
  if (!team) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  const iHaveInvite = myMembership?.status === 'invited';

  return (
    <View style={styles.layout}>
      <View style={styles.mainCol}>
        <View style={styles.titleRow}>
          {team.sport && <SportIcon sport={team.sport as Sport} size={22} />}
          <Text style={styles.title}>{team.name}</Text>
        </View>
        <Text style={styles.subtitle}>{team.sport ?? 'No sport set'}</Text>

        {iHaveInvite && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>You've been invited to join this team</Text>
            <View style={styles.inviteRow}>
              <Pressable disabled={responding} onPress={() => handleRespond(true)} style={[styles.btn, styles.btnInline]}>
                <Text style={styles.btnText}>Accept</Text>
              </Pressable>
              <Pressable disabled={responding} onPress={() => handleRespond(false)} style={[styles.btn, styles.btnOutline, styles.btnInline]}>
                <Text style={styles.btnOutlineText}>Decline</Text>
              </Pressable>
            </View>
          </View>
        )}

        {isCaptain && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Invite a player by phone</Text>
            <View style={styles.inviteRow}>
              <TextInput
                value={invitePhone}
                onChangeText={setInvitePhone}
                placeholder="+254 7XX XXX XXX"
                placeholderTextColor={colors.textSoft}
                style={styles.phoneInput}
              />
              <Pressable disabled={inviting} onPress={handleInvite} style={[styles.btn, styles.inviteBtn, inviting && styles.btnDisabled]}>
                <Text style={styles.btnText}>{inviting ? 'Sending…' : 'Invite'}</Text>
              </Pressable>
            </View>
            <Text style={styles.hint}>They'll need a Kicko account already — invite by the phone number they signed up with.</Text>
          </View>
        )}

        {error && <Text style={styles.error}>{error}</Text>}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Roster ({members.length})</Text>
        {members.map((m) => {
          const canRemove = m.role !== 'captain' && (isCaptain || m.user.id === myMembership?.user.id);
          return (
            <View key={m.id} style={styles.memberRow}>
              <View style={styles.memberAvatar}>
                <Text style={styles.memberAvatarText}>{m.user.name.charAt(0).toUpperCase()}</Text>
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={styles.memberName}>
                  {m.user.name} {m.role === 'captain' && <Text style={styles.captainTag}>Captain</Text>}
                </Text>
                <Text style={styles.memberStatus}>{m.status === 'invited' ? 'Invited — awaiting response' : 'Member'}</Text>
              </View>
              {canRemove && (
                <Pressable disabled={removingId === m.id} onPress={() => handleRemove(m.id)}>
                  <Text style={styles.removeLink}>{removingId === m.id ? '…' : m.user.id === myMembership?.user.id ? 'Leave' : 'Remove'}</Text>
                </Pressable>
              )}
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  error: { fontFamily: fonts.sans, fontSize: 13, color: colors.danger, marginBottom: 12 },

  layout: { flexDirection: 'row', flexWrap: 'wrap', gap: 40, alignItems: 'flex-start' },
  mainCol: { flex: 1.6, minWidth: 320 },

  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6 },
  title: { fontFamily: fonts.serif, fontSize: 26, color: colors.text },
  subtitle: { fontFamily: fonts.sans, fontSize: 13.5, color: colors.textSoft, marginBottom: 4, textTransform: 'capitalize' },

  card: {
    flex: 1,
    minWidth: 300,
    maxWidth: 380,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: 24,
    marginTop: 20,
  },
  cardTitle: { fontFamily: fonts.sansSemiBold, fontSize: 14, color: colors.text, marginBottom: 14 },

  inviteRow: { flexDirection: 'row', gap: 10 },
  phoneInput: {
    flex: 1,
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
  hint: { fontFamily: fonts.sans, fontSize: 12, color: colors.textSoft, marginTop: 10, lineHeight: 17 },

  btn: { backgroundColor: colors.accent, borderRadius: radius.pill, paddingVertical: 13, paddingHorizontal: 18, alignItems: 'center' },
  btnInline: { flex: 1 },
  inviteBtn: { paddingHorizontal: 20 },
  btnDisabled: { opacity: 0.4 },
  btnText: { fontFamily: fonts.sansBold, fontSize: 13.5, color: colors.accentText },
  btnOutline: { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.border },
  btnOutlineText: { fontFamily: fonts.sansBold, fontSize: 13.5, color: colors.text },

  memberRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border },
  memberAvatar: { width: 34, height: 34, borderRadius: 17, backgroundColor: colors.accentSoft, alignItems: 'center', justifyContent: 'center' },
  memberAvatarText: { fontFamily: fonts.serifMedium, fontSize: 14, color: colors.accent },
  memberName: { fontFamily: fonts.sansMedium, fontSize: 13.5, color: colors.text },
  captainTag: { fontFamily: fonts.sansBold, fontSize: 10.5, color: colors.accent, textTransform: 'uppercase' },
  memberStatus: { fontFamily: fonts.sans, fontSize: 12, color: colors.textSoft, marginTop: 2 },
  removeLink: { fontFamily: fonts.sansSemiBold, fontSize: 12.5, color: colors.danger },
});
