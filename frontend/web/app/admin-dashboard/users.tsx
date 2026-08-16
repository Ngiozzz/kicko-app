import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { apiFetch, colors, fonts, radius } from '@kicko/shared';
import { adminApi, AdminUser } from '../../src/lib/adminApi';
import { Drawer } from '../../src/components/owner/Drawer';
import { Button, Field } from '../../src/components/ui';

type Filter = 'all' | 'player' | 'owner' | 'manager' | 'admin';
const TABS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'player', label: 'Players' },
  { key: 'owner', label: 'Owners' },
  { key: 'manager', label: 'Managers' },
  { key: 'admin', label: 'Admins' },
];

const ROLE_STYLE: Record<AdminUser['role'], { bg: string; color: string }> = {
  player: { bg: colors.accentSoft, color: colors.accent },
  owner: { bg: 'rgba(60,122,92,0.14)', color: colors.good },
  manager: { bg: 'rgba(90,95,102,0.16)', color: colors.textSoft },
  admin: { bg: 'rgba(196,69,63,0.12)', color: colors.danger },
};

function AddAdminDrawer({ visible, onClose, onCreated }: { visible: boolean; onClose: () => void; onCreated: (user: AdminUser) => void }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function reset() {
    setName('');
    setEmail('');
    setPhone('');
    setPassword('');
    setError(null);
  }

  async function handleSubmit() {
    if (!name.trim() || !email.trim() || password.length < 8) {
      setError('Name, email, and a password of at least 8 characters are required.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const { user } = await adminApi.createAdmin({ name: name.trim(), email: email.trim(), password, phone: phone || undefined });
      onCreated(user);
      reset();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create this admin account.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Drawer
      visible={visible}
      onClose={() => {
        reset();
        onClose();
      }}
      title="Add an admin"
    >
      <Text style={styles.drawerIntro}>
        They'll get full admin access — every venue, every account, platform-wide. Only add people you'd trust with that.
      </Text>

      <Field label="Full name" placeholder="Jane Doe" value={name} onChangeText={setName} />
      <Field label="Email" placeholder="jane@kicko.app" autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} />
      <Field label="Phone (optional)" placeholder="+254 700 000 000" keyboardType="phone-pad" value={phone} onChangeText={setPhone} />
      <Field label="Temporary password" placeholder="At least 8 characters" secureTextEntry value={password} onChangeText={setPassword} />

      {error ? <Text style={styles.drawerError}>{error}</Text> : null}

      <Button title={saving ? 'Creating…' : 'Create admin account'} onPress={handleSubmit} disabled={saving} />
    </Drawer>
  );
}

export default function AdminUsers() {
  const [users, setUsers] = useState<AdminUser[] | null>(null);
  const [selfId, setSelfId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>('all');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);

  const load = useCallback(async () => {
    try {
      const { users } = await adminApi.listUsers();
      setUsers(users);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load users.');
    }
  }, []);

  useEffect(() => {
    apiFetch<{ user: { id: string } }>('/api/account/me')
      .then(({ user }) => setSelfId(user.id))
      .catch(() => {});
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const activeAdminCount = users?.filter((u) => u.role === 'admin' && !u.suspended).length ?? 0;

  async function toggleSuspend(user: AdminUser) {
    setBusyId(user.id);
    setError(null);
    try {
      const { user: updated } = await adminApi.setUserSuspended(user.id, !user.suspended);
      setUsers((prev) => prev?.map((u) => (u.id === updated.id ? updated : u)) ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update this user.');
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(user: AdminUser) {
    setBusyId(user.id);
    setError(null);
    try {
      await adminApi.deleteAdmin(user.id);
      setUsers((prev) => prev?.filter((u) => u.id !== user.id) ?? null);
      setConfirmDeleteId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not delete this admin account.');
    } finally {
      setBusyId(null);
    }
  }

  const counts = {
    total: users?.length ?? 0,
    player: users?.filter((u) => u.role === 'player').length ?? 0,
    owner: users?.filter((u) => u.role === 'owner').length ?? 0,
    manager: users?.filter((u) => u.role === 'manager').length ?? 0,
    admin: users?.filter((u) => u.role === 'admin').length ?? 0,
  };
  const visible = users?.filter((u) => filter === 'all' || u.role === filter) ?? [];

  return (
    <View>
      <View style={styles.headRow}>
        <View>
          <Text style={styles.title}>Users</Text>
          <Text style={styles.subtitle}>Every account on the platform, across all roles.</Text>
        </View>
        <View style={styles.headActions}>
          <View style={styles.tabs}>
            {TABS.map((tab) => (
              <Pressable key={tab.key} onPress={() => setFilter(tab.key)} style={[styles.tab, filter === tab.key && styles.tabActive]}>
                <Text style={[styles.tabText, filter === tab.key && styles.tabTextActive]}>{tab.label}</Text>
              </Pressable>
            ))}
          </View>
          <Pressable onPress={() => setAddOpen(true)} style={styles.btnSm}>
            <Text style={styles.btnSmText}>+ Add admin</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Total users</Text>
          <Text style={styles.statValue}>{counts.total}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Players</Text>
          <Text style={styles.statValue}>{counts.player}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Owners</Text>
          <Text style={styles.statValue}>{counts.owner}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Managers</Text>
          <Text style={styles.statValue}>{counts.manager}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Admins</Text>
          <Text style={styles.statValue}>{counts.admin}</Text>
        </View>
      </View>

      {error && <Text style={styles.error}>{error}</Text>}
      {users === null && !error && (
        <View style={styles.loading}>
          <ActivityIndicator color={colors.accent} />
        </View>
      )}
      {users && visible.length === 0 && <Text style={styles.emptyNote}>No users match this filter.</Text>}

      {visible.length > 0 && (
        <View style={styles.tablePanel}>
          <View style={styles.tableHeadRow}>
            <Text style={[styles.tableHeadText, styles.colUser]}>User</Text>
            <Text style={[styles.tableHeadText, styles.colRole]}>Role</Text>
            <Text style={[styles.tableHeadText, styles.colStatus]}>Status</Text>
            <Text style={[styles.tableHeadText, styles.colJoined]}>Joined</Text>
            <Text style={[styles.tableHeadText, styles.colAction]}> </Text>
          </View>
          {visible.map((user) => {
            const roleStyle = ROLE_STYLE[user.role];
            const isSelf = user.id === selfId;
            const isLastActiveAdmin = user.role === 'admin' && !user.suspended && activeAdminCount <= 1;
            const suspendDisabled = busyId === user.id || isSelf || isLastActiveAdmin;
            const confirming = confirmDeleteId === user.id;

            return (
              <View key={user.id} style={styles.tableRow}>
                <View style={[styles.userCell, styles.colUser]}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{user.name.charAt(0).toUpperCase() || '?'}</Text>
                  </View>
                  <View>
                    <Text style={styles.uName}>{user.name || 'Unnamed'}</Text>
                    <Text style={styles.uEmail}>{user.email}</Text>
                  </View>
                </View>
                <View style={styles.colRole}>
                  <View style={[styles.roleBadge, { backgroundColor: roleStyle.bg }]}>
                    <Text style={[styles.roleBadgeText, { color: roleStyle.color }]}>{user.role.charAt(0).toUpperCase() + user.role.slice(1)}</Text>
                  </View>
                </View>
                <View style={styles.colStatus}>
                  <View style={[styles.statusPill, user.suspended && styles.statusPillSuspended]}>
                    <Text style={[styles.statusPillText, user.suspended && styles.statusPillTextSuspended]}>
                      {user.suspended ? 'Suspended' : 'Active'}
                    </Text>
                  </View>
                </View>
                <Text style={[styles.joinedText, styles.colJoined]}>{new Date(user.created_at).toLocaleDateString()}</Text>

                <View style={styles.colAction}>
                  {confirming ? (
                    <View style={styles.confirmRow}>
                      <Pressable onPress={() => handleDelete(user)} disabled={busyId === user.id} style={styles.confirmDeleteBtn}>
                        <Text style={styles.confirmDeleteBtnText}>{busyId === user.id ? '…' : 'Confirm'}</Text>
                      </Pressable>
                      <Pressable onPress={() => setConfirmDeleteId(null)}>
                        <Text style={styles.cancelText}>Cancel</Text>
                      </Pressable>
                    </View>
                  ) : (
                    <View style={styles.actionRow}>
                      <Pressable
                        onPress={() => toggleSuspend(user)}
                        disabled={suspendDisabled}
                        style={[styles.actionBtn, user.suspended && styles.actionBtnRestore, suspendDisabled && styles.actionBtnDisabled]}
                      >
                        <Text style={[styles.actionBtnText, user.suspended && styles.actionBtnTextRestore]}>
                          {busyId === user.id ? '…' : user.suspended ? 'Unsuspend' : 'Suspend'}
                        </Text>
                      </Pressable>
                      {user.role === 'admin' && !isSelf && (
                        <Pressable onPress={() => setConfirmDeleteId(user.id)} disabled={isLastActiveAdmin && !user.suspended}>
                          <Text style={[styles.deleteText, isLastActiveAdmin && !user.suspended && styles.deleteTextDisabled]}>Delete</Text>
                        </Pressable>
                      )}
                    </View>
                  )}
                </View>
              </View>
            );
          })}
        </View>
      )}

      <AddAdminDrawer
        visible={addOpen}
        onClose={() => setAddOpen(false)}
        onCreated={(user) => setUsers((prev) => (prev ? [user, ...prev] : [user]))}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  headRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16, marginBottom: 8 },
  title: { fontFamily: fonts.serif, fontSize: 26, color: colors.text, marginBottom: 4 },
  subtitle: { fontFamily: fonts.sans, fontSize: 13.5, color: colors.textSoft },
  headActions: { flexDirection: 'row', alignItems: 'center', gap: 12, flexWrap: 'wrap' },

  tabs: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  tab: { paddingVertical: 9, paddingHorizontal: 16, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  tabActive: { backgroundColor: colors.accent, borderColor: 'transparent' },
  tabText: { fontFamily: fonts.sansSemiBold, fontSize: 13, color: colors.textSoft },
  tabTextActive: { color: colors.accentText },

  btnSm: { backgroundColor: colors.accent, borderRadius: radius.pill, paddingVertical: 10, paddingHorizontal: 16 },
  btnSmText: { fontFamily: fonts.sansBold, fontSize: 13, color: colors.accentText },

  statsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 18, marginTop: 22, marginBottom: 30 },
  statCard: { flexGrow: 1, flexBasis: 160, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, padding: 18 },
  statLabel: { fontFamily: fonts.sansSemiBold, fontSize: 12.5, color: colors.textSoft, marginBottom: 10 },
  statValue: { fontFamily: fonts.serif, fontSize: 24, color: colors.text },

  loading: { paddingVertical: 40, alignItems: 'center' },
  error: { fontFamily: fonts.sans, fontSize: 13.5, color: colors.danger, marginBottom: 12 },
  emptyNote: { fontFamily: fonts.sans, fontSize: 13, color: colors.textSoft, textAlign: 'center', paddingVertical: 30 },

  tablePanel: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, padding: 8 },
  tableHeadRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 14, borderBottomWidth: 1, borderBottomColor: colors.border },
  tableHeadText: { fontFamily: fonts.sansBold, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5, color: colors.textSoft },
  tableRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 14, borderBottomWidth: 1, borderBottomColor: colors.border },

  colUser: { flex: 2.4, minWidth: 200 },
  colRole: { flex: 1, minWidth: 90 },
  colStatus: { flex: 1, minWidth: 90 },
  colJoined: { flex: 1, minWidth: 100 },
  colAction: { flex: 1.3, minWidth: 160, alignItems: 'flex-end' },

  userCell: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.accentSoft, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontFamily: fonts.sansSemiBold, fontSize: 12, color: colors.accent },
  uName: { fontFamily: fonts.sansSemiBold, fontSize: 13.5, color: colors.text },
  uEmail: { fontFamily: fonts.sans, fontSize: 12, color: colors.textSoft, marginTop: 1 },

  roleBadge: { alignSelf: 'flex-start', borderRadius: radius.pill, paddingVertical: 4, paddingHorizontal: 11 },
  roleBadgeText: { fontFamily: fonts.sansBold, fontSize: 11.5 },

  statusPill: { alignSelf: 'flex-start', backgroundColor: 'rgba(60,122,92,0.14)', borderRadius: radius.pill, paddingVertical: 4, paddingHorizontal: 10 },
  statusPillSuspended: { backgroundColor: 'rgba(196,69,63,0.12)' },
  statusPillText: { fontFamily: fonts.sansSemiBold, fontSize: 11, color: colors.good },
  statusPillTextSuspended: { color: colors.danger },

  joinedText: { fontFamily: fonts.sans, fontSize: 12.5, color: colors.textSoft },

  actionRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  actionBtn: { borderWidth: 1.5, borderColor: colors.border, borderRadius: radius.pill, paddingVertical: 7, paddingHorizontal: 14 },
  actionBtnRestore: { borderColor: colors.accent },
  actionBtnDisabled: { opacity: 0.4 },
  actionBtnText: { fontFamily: fonts.sansSemiBold, fontSize: 12, color: colors.text },
  actionBtnTextRestore: { color: colors.accent },
  deleteText: { fontFamily: fonts.sansSemiBold, fontSize: 12, color: colors.danger },
  deleteTextDisabled: { opacity: 0.4 },

  confirmRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  confirmDeleteBtn: { backgroundColor: colors.danger, borderRadius: radius.pill, paddingVertical: 7, paddingHorizontal: 14 },
  confirmDeleteBtnText: { fontFamily: fonts.sansBold, fontSize: 12, color: '#fff' },
  cancelText: { fontFamily: fonts.sansMedium, fontSize: 12, color: colors.textSoft },

  drawerIntro: { fontFamily: fonts.sans, fontSize: 13.5, color: colors.textSoft, lineHeight: 20, marginBottom: 20 },
  drawerError: { fontFamily: fonts.sans, fontSize: 12.5, color: colors.danger, marginBottom: 8, lineHeight: 18 },
});
