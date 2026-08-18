import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { apiFetch, colors, fonts, radius } from '@kicko/shared';
import { adminApi, AdminUser, AdminUserActivity } from '../../src/lib/adminApi';
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

type ViewMode = 'grid' | 'table';

const ROLE_STYLE: Record<AdminUser['role'], { bg: string; color: string }> = {
  player: { bg: colors.accentSoft, color: colors.accent },
  owner: { bg: 'rgba(60,122,92,0.14)', color: colors.good },
  manager: { bg: 'rgba(90,95,102,0.16)', color: colors.textSoft },
  admin: { bg: 'rgba(196,69,63,0.12)', color: colors.danger },
};

function metaChipsFor(user: AdminUser): string[] {
  const chips: string[] = [];
  if (user.role === 'player') {
    if (user.sport) chips.push(user.sport.charAt(0).toUpperCase() + user.sport.slice(1));
    if (user.position) chips.push(user.position);
  }
  if (user.role === 'owner' && user.venue_count != null) {
    chips.push(`${user.venue_count} venue${user.venue_count === 1 ? '' : 's'}`);
  }
  if (user.role === 'manager' && user.owner_id) chips.push('Manages a venue');
  return chips;
}

function bookingBadgeLabel(b: { status: string; payment_status: string }): string {
  if (b.status === 'cancelled') return 'Cancelled';
  if (b.status === 'completed') return 'Completed';
  if (b.payment_status === 'paid') return 'Confirmed';
  return 'Awaiting payment';
}

type ActionProps = {
  user: AdminUser;
  isSelf: boolean;
  isLastActiveAdmin: boolean;
  busyId: string | null;
  confirming: boolean;
  onSuspend: () => void;
  onConfirmDelete: () => void;
  onRequestDelete: () => void;
  onCancelDelete: () => void;
};

// Suspend/Delete/Confirm — shared between the grid card and the table row.
// Every handler stops propagation since both containers are themselves
// clickable (open the detail drawer) — without it, clicking "Suspend"
// would also pop the drawer open underneath it.
function UserActions({ user, isSelf, isLastActiveAdmin, busyId, confirming, onSuspend, onConfirmDelete, onRequestDelete, onCancelDelete }: ActionProps) {
  const suspendDisabled = busyId === user.id || isSelf || isLastActiveAdmin;
  const stop = (fn: () => void) => (e: any) => {
    e.stopPropagation();
    e.preventDefault?.();
    fn();
  };

  if (confirming) {
    return (
      <View style={styles.confirmRow}>
        <Pressable onPress={stop(onConfirmDelete)} disabled={busyId === user.id} style={styles.confirmDeleteBtn}>
          <Text style={styles.confirmDeleteBtnText}>{busyId === user.id ? '…' : 'Confirm'}</Text>
        </Pressable>
        <Pressable onPress={stop(onCancelDelete)}>
          <Text style={styles.cancelText}>Cancel</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.actionRow}>
      <Pressable
        onPress={stop(onSuspend)}
        disabled={suspendDisabled}
        style={[styles.actionBtn, user.suspended && styles.actionBtnRestore, suspendDisabled && styles.actionBtnDisabled]}
      >
        <Text style={[styles.actionBtnText, user.suspended && styles.actionBtnTextRestore]}>
          {busyId === user.id ? '…' : user.suspended ? 'Unsuspend' : 'Suspend'}
        </Text>
      </Pressable>
      {user.role === 'admin' && !isSelf && (
        <Pressable onPress={stop(onRequestDelete)} disabled={isLastActiveAdmin && !user.suspended}>
          <Text style={[styles.deleteText, isLastActiveAdmin && !user.suspended && styles.deleteTextDisabled]}>Delete</Text>
        </Pressable>
      )}
    </View>
  );
}

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

function UserDetailDrawer({ user, onClose }: { user: AdminUser | null; onClose: () => void }) {
  const [activity, setActivity] = useState<AdminUserActivity | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setActivity(null);
      return;
    }
    setLoading(true);
    setError(null);
    adminApi
      .getUser(user.id)
      .then(({ activity }) => setActivity(activity))
      .catch((err) => setError(err instanceof Error ? err.message : 'Could not load this user.'))
      .finally(() => setLoading(false));
  }, [user?.id]);

  if (!user) return null;
  const roleStyle = ROLE_STYLE[user.role];

  return (
    <Drawer visible={Boolean(user)} onClose={onClose} title="User details">
      <View style={styles.detailHead}>
        <View style={[styles.avatar, styles.avatarLg, { backgroundColor: roleStyle.bg }]}>
          <Text style={[styles.avatarText, styles.avatarTextLg, { color: roleStyle.color }]}>{user.name.charAt(0).toUpperCase() || '?'}</Text>
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={styles.detailName}>{user.name || 'Unnamed'}</Text>
          <View style={styles.detailBadgeRow}>
            <View style={[styles.roleBadge, { backgroundColor: roleStyle.bg }]}>
              <Text style={[styles.roleBadgeText, { color: roleStyle.color }]}>{user.role.charAt(0).toUpperCase() + user.role.slice(1)}</Text>
            </View>
            <View style={[styles.statusPill, user.suspended && styles.statusPillSuspended]}>
              <Text style={[styles.statusPillText, user.suspended && styles.statusPillTextSuspended]}>{user.suspended ? 'Suspended' : 'Active'}</Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.detailFieldGrid}>
        <View style={styles.detailField}>
          <Text style={styles.detailFieldLabel}>Email</Text>
          <Text style={styles.detailFieldValue}>{user.email}</Text>
        </View>
        <View style={styles.detailField}>
          <Text style={styles.detailFieldLabel}>Phone</Text>
          <Text style={styles.detailFieldValue}>{user.phone || '—'}</Text>
        </View>
        <View style={styles.detailField}>
          <Text style={styles.detailFieldLabel}>Joined</Text>
          <Text style={styles.detailFieldValue}>{new Date(user.created_at).toLocaleDateString('en-KE', { day: 'numeric', month: 'long', year: 'numeric' })}</Text>
        </View>
        <View style={styles.detailField}>
          <Text style={styles.detailFieldLabel}>User ID</Text>
          <Text style={styles.detailFieldValueMono} numberOfLines={1}>
            {user.id}
          </Text>
        </View>
      </View>

      {loading && (
        <View style={styles.detailLoading}>
          <ActivityIndicator color={colors.accent} />
        </View>
      )}
      {error && <Text style={styles.error}>{error}</Text>}

      {activity && user.role === 'player' && (
        <>
          <Text style={styles.sectionTitle}>Activity</Text>
          <View style={styles.detailStatsRow}>
            <View style={styles.detailStatCard}>
              <Text style={styles.detailStatValue}>{activity.totalBookings ?? 0}</Text>
              <Text style={styles.detailStatLabel}>Bookings</Text>
            </View>
            <View style={styles.detailStatCard}>
              <Text style={styles.detailStatValue}>KES {(activity.totalSpent ?? 0).toLocaleString()}</Text>
              <Text style={styles.detailStatLabel}>Total spent</Text>
            </View>
            <View style={styles.detailStatCard}>
              <Text style={styles.detailStatValue}>{activity.sessionsOrganized ?? 0}</Text>
              <Text style={styles.detailStatLabel}>Sessions organized</Text>
            </View>
          </View>

          <Text style={styles.sectionTitle}>Recent bookings</Text>
          {(activity.recentBookings ?? []).length === 0 ? (
            <Text style={styles.emptyNote}>No bookings yet.</Text>
          ) : (
            (activity.recentBookings ?? []).map((b) => (
              <View key={b.id} style={styles.activityRow}>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={styles.activityRowTitle} numberOfLines={1}>
                    {b.venue?.name ?? 'Unknown venue'} {b.booking_type === 'session' && <Text style={styles.activityRowTag}>· Session</Text>}
                  </Text>
                  <Text style={styles.activityRowMeta}>
                    {new Date(b.start_at).toLocaleDateString('en-KE', { day: 'numeric', month: 'short' })} · KES {b.total_amount.toLocaleString()}
                  </Text>
                </View>
                <Text style={styles.activityRowBadge}>{bookingBadgeLabel(b)}</Text>
              </View>
            ))
          )}
        </>
      )}

      {activity && user.role === 'owner' && (
        <>
          <Text style={styles.sectionTitle}>Venues ({(activity.venues ?? []).length})</Text>
          {(activity.venues ?? []).length === 0 ? (
            <Text style={styles.emptyNote}>No venues listed yet.</Text>
          ) : (
            (activity.venues ?? []).map((v) => (
              <View key={v.id} style={styles.activityRow}>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={styles.activityRowTitle} numberOfLines={1}>
                    {v.name}
                  </Text>
                  <Text style={styles.activityRowMeta}>
                    {v.location} · {v.sport} · KES {v.price_peak.toLocaleString()}/hr
                  </Text>
                </View>
                <Text style={styles.activityRowBadge}>{v.status.charAt(0).toUpperCase() + v.status.slice(1)}</Text>
              </View>
            ))
          )}
        </>
      )}

      {activity && user.role === 'manager' && (
        <>
          <Text style={styles.sectionTitle}>Reports to</Text>
          {activity.managedBy ? (
            <View style={styles.activityRow}>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={styles.activityRowTitle}>{activity.managedBy.name}</Text>
                <Text style={styles.activityRowMeta}>{activity.managedBy.email}</Text>
              </View>
            </View>
          ) : (
            <Text style={styles.emptyNote}>No owner on file.</Text>
          )}
        </>
      )}
    </Drawer>
  );
}

export default function AdminUsers() {
  const [users, setUsers] = useState<AdminUser[] | null>(null);
  const [selfId, setSelfId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [detailUser, setDetailUser] = useState<AdminUser | null>(null);

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
          <Text style={styles.subtitle}>Every account on the platform, across all roles. Click one for the full picture.</Text>
        </View>
        <View style={styles.headActions}>
          <View style={styles.tabs}>
            {TABS.map((tab) => (
              <Pressable key={tab.key} onPress={() => setFilter(tab.key)} style={[styles.tab, filter === tab.key && styles.tabActive]}>
                <Text style={[styles.tabText, filter === tab.key && styles.tabTextActive]}>{tab.label}</Text>
              </Pressable>
            ))}
          </View>
          <View style={styles.viewToggle}>
            <Pressable onPress={() => setViewMode('grid')} style={[styles.viewToggleOption, viewMode === 'grid' && styles.viewToggleOptionActive]}>
              <Text style={[styles.viewToggleText, viewMode === 'grid' && styles.viewToggleTextActive]}>Grid</Text>
            </Pressable>
            <Pressable onPress={() => setViewMode('table')} style={[styles.viewToggleOption, viewMode === 'table' && styles.viewToggleOptionActive]}>
              <Text style={[styles.viewToggleText, viewMode === 'table' && styles.viewToggleTextActive]}>Table</Text>
            </Pressable>
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

      {visible.length > 0 && viewMode === 'grid' && (
        <View style={styles.cardGrid}>
          {visible.map((user) => {
            const roleStyle = ROLE_STYLE[user.role];
            const isSelf = user.id === selfId;
            const isLastActiveAdmin = user.role === 'admin' && !user.suspended && activeAdminCount <= 1;
            const confirming = confirmDeleteId === user.id;
            const metaChips = metaChipsFor(user);

            return (
              <Pressable key={user.id} onPress={() => setDetailUser(user)} style={[styles.userCard, user.suspended && styles.userCardSuspended]}>
                <View style={styles.cardTopRow}>
                  <View style={[styles.avatar, { backgroundColor: roleStyle.bg }]}>
                    <Text style={[styles.avatarText, { color: roleStyle.color }]}>{user.name.charAt(0).toUpperCase() || '?'}</Text>
                  </View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={styles.uName} numberOfLines={1}>
                      {user.name || 'Unnamed'}
                      {isSelf && <Text style={styles.youTag}> · You</Text>}
                    </Text>
                    <View style={[styles.roleBadge, { backgroundColor: roleStyle.bg }]}>
                      <Text style={[styles.roleBadgeText, { color: roleStyle.color }]}>{user.role.charAt(0).toUpperCase() + user.role.slice(1)}</Text>
                    </View>
                  </View>
                  <View style={[styles.statusPill, user.suspended && styles.statusPillSuspended]}>
                    <Text style={[styles.statusPillText, user.suspended && styles.statusPillTextSuspended]}>
                      {user.suspended ? 'Suspended' : 'Active'}
                    </Text>
                  </View>
                </View>

                <View style={styles.cardInfo}>
                  <Text style={styles.uEmail} numberOfLines={1}>
                    {user.email}
                  </Text>
                  <Text style={styles.uMeta}>{user.phone || 'No phone on file'}</Text>
                </View>

                {metaChips.length > 0 && (
                  <View style={styles.chipRow}>
                    {metaChips.map((chip) => (
                      <View key={chip} style={styles.metaChip}>
                        <Text style={styles.metaChipText}>{chip}</Text>
                      </View>
                    ))}
                  </View>
                )}

                <View style={styles.cardFoot}>
                  <View>
                    <Text style={styles.joinedLabel}>Joined</Text>
                    <Text style={styles.joinedText}>{new Date(user.created_at).toLocaleDateString()}</Text>
                  </View>
                  <UserActions
                    user={user}
                    isSelf={isSelf}
                    isLastActiveAdmin={isLastActiveAdmin}
                    busyId={busyId}
                    confirming={confirming}
                    onSuspend={() => toggleSuspend(user)}
                    onConfirmDelete={() => handleDelete(user)}
                    onRequestDelete={() => setConfirmDeleteId(user.id)}
                    onCancelDelete={() => setConfirmDeleteId(null)}
                  />
                </View>
              </Pressable>
            );
          })}
        </View>
      )}

      {visible.length > 0 && viewMode === 'table' && (
        <View style={styles.tablePanel}>
          <View style={styles.tableHeadRow}>
            <Text style={[styles.tableHeadText, styles.colUser]}>User</Text>
            <Text style={[styles.tableHeadText, styles.colRole]}>Role</Text>
            <Text style={[styles.tableHeadText, styles.colMeta]}>Phone Number</Text>
            <Text style={[styles.tableHeadText, styles.colStatus]}>Status</Text>
            <Text style={[styles.tableHeadText, styles.colJoined]}>Joined</Text>
            <Text style={[styles.tableHeadText, styles.colAction]}> </Text>
          </View>
          {visible.map((user) => {
            const roleStyle = ROLE_STYLE[user.role];
            const isSelf = user.id === selfId;
            const isLastActiveAdmin = user.role === 'admin' && !user.suspended && activeAdminCount <= 1;
            const confirming = confirmDeleteId === user.id;

            return (
              <Pressable key={user.id} onPress={() => setDetailUser(user)} style={styles.tableRow}>
                <View style={[styles.userCell, styles.colUser]}>
                  <View style={[styles.avatar, styles.avatarSm, { backgroundColor: roleStyle.bg }]}>
                    <Text style={[styles.avatarText, { color: roleStyle.color }]}>{user.name.charAt(0).toUpperCase() || '?'}</Text>
                  </View>
                  <View style={{ minWidth: 0 }}>
                    <Text style={styles.uName} numberOfLines={1}>
                      {user.name || 'Unnamed'}
                      {isSelf && <Text style={styles.youTag}> · You</Text>}
                    </Text>
                    <Text style={styles.uEmail} numberOfLines={1}>
                      {user.email}
                    </Text>
                  </View>
                </View>
                <View style={styles.colRole}>
                  <View style={[styles.roleBadge, { backgroundColor: roleStyle.bg }]}>
                    <Text style={[styles.roleBadgeText, { color: roleStyle.color }]}>{user.role.charAt(0).toUpperCase() + user.role.slice(1)}</Text>
                  </View>
                </View>
                <Text style={[styles.tableMetaText, styles.colMeta]} numberOfLines={1}>
                  {user.phone || '—'}
                </Text>
                <View style={styles.colStatus}>
                  <View style={[styles.statusPill, user.suspended && styles.statusPillSuspended]}>
                    <Text style={[styles.statusPillText, user.suspended && styles.statusPillTextSuspended]}>
                      {user.suspended ? 'Suspended' : 'Active'}
                    </Text>
                  </View>
                </View>
                <Text style={[styles.joinedText, styles.colJoined]}>{new Date(user.created_at).toLocaleDateString()}</Text>
                <View style={styles.colAction}>
                  <UserActions
                    user={user}
                    isSelf={isSelf}
                    isLastActiveAdmin={isLastActiveAdmin}
                    busyId={busyId}
                    confirming={confirming}
                    onSuspend={() => toggleSuspend(user)}
                    onConfirmDelete={() => handleDelete(user)}
                    onRequestDelete={() => setConfirmDeleteId(user.id)}
                    onCancelDelete={() => setConfirmDeleteId(null)}
                  />
                </View>
              </Pressable>
            );
          })}
        </View>
      )}

      <AddAdminDrawer
        visible={addOpen}
        onClose={() => setAddOpen(false)}
        onCreated={(user) => setUsers((prev) => (prev ? [user, ...prev] : [user]))}
      />
      <UserDetailDrawer user={detailUser} onClose={() => setDetailUser(null)} />
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

  viewToggle: { flexDirection: 'row', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.pill, padding: 3, gap: 2 },
  viewToggleOption: { paddingVertical: 7, paddingHorizontal: 14, borderRadius: radius.pill },
  viewToggleOptionActive: { backgroundColor: colors.accent },
  viewToggleText: { fontFamily: fonts.sansSemiBold, fontSize: 12.5, color: colors.textSoft },
  viewToggleTextActive: { color: colors.accentText },

  btnSm: { backgroundColor: colors.accent, borderRadius: radius.pill, paddingVertical: 10, paddingHorizontal: 16 },
  btnSmText: { fontFamily: fonts.sansBold, fontSize: 13, color: colors.accentText },

  // CSS Grid, not flex-wrap: with flexGrow the cards on a short last row
  // (e.g. 2 left over from 5) stretch wider than the ones above them, since
  // flexbox only balances growth within a single row. Grid's auto-fit
  // columns share one template across every row, so every card — no matter
  // how the row count splits — stays exactly the same width as the rest.
  statsRow: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 18, marginTop: 22, marginBottom: 30 } as any,
  statCard: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, padding: 18 },
  statLabel: { fontFamily: fonts.sansSemiBold, fontSize: 12.5, color: colors.textSoft, marginBottom: 10 },
  statValue: { fontFamily: fonts.serif, fontSize: 24, color: colors.text },

  loading: { paddingVertical: 40, alignItems: 'center' },
  error: { fontFamily: fonts.sans, fontSize: 13.5, color: colors.danger, marginBottom: 12 },
  emptyNote: { fontFamily: fonts.sans, fontSize: 13, color: colors.textSoft, textAlign: 'center', paddingVertical: 12 },

  // Same reasoning as statsRow below: grid with a shared auto-fit column
  // template, not flex-wrap. The old maxWidth:360 cap on userCard also left
  // it stopping short of the stats row's right edge whenever the container
  // was wide enough for 3+ columns — this grid stretches full-width instead,
  // so the card grid's row lines up edge-to-edge with the stat cards above it.
  cardGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 } as any,
  userCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: 18,
  },
  userCardSuspended: { opacity: 0.75, borderColor: 'rgba(196,69,63,0.35)' },

  cardTopRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 14 },
  avatar: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  avatarSm: { width: 32, height: 32, borderRadius: 16 },
  avatarLg: { width: 52, height: 52, borderRadius: 26 },
  avatarText: { fontFamily: fonts.sansSemiBold, fontSize: 14 },
  avatarTextLg: { fontSize: 18 },
  uName: { fontFamily: fonts.sansSemiBold, fontSize: 14.5, color: colors.text, marginBottom: 5 },
  youTag: { fontFamily: fonts.sansMedium, fontSize: 12, color: colors.textSoft },

  cardInfo: { marginBottom: 12, gap: 2 },
  uEmail: { fontFamily: fonts.sans, fontSize: 12.5, color: colors.text },
  uMeta: { fontFamily: fonts.sans, fontSize: 12, color: colors.textSoft },

  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 14 },
  metaChip: { backgroundColor: colors.surface2, borderRadius: radius.pill, paddingVertical: 4, paddingHorizontal: 10 },
  metaChipText: { fontFamily: fonts.sansMedium, fontSize: 11, color: colors.textSoft },

  cardFoot: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  joinedLabel: { fontFamily: fonts.sansBold, fontSize: 9.5, textTransform: 'uppercase', letterSpacing: 0.5, color: colors.textSoft, marginBottom: 2 },

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

  tablePanel: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, padding: 8 },
  tableHeadRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 14, borderBottomWidth: 1, borderBottomColor: colors.border },
  tableHeadText: { fontFamily: fonts.sansBold, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5, color: colors.textSoft },
  tableRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 14, borderBottomWidth: 1, borderBottomColor: colors.border },
  tableMetaText: { fontFamily: fonts.sans, fontSize: 12.5, color: colors.textSoft },

  colUser: { flex: 2.2, minWidth: 190, flexDirection: 'row', alignItems: 'center', gap: 10 },
  colRole: { flex: 0.9, minWidth: 85 },
  colMeta: { flex: 1.4, minWidth: 130 },
  colStatus: { flex: 0.9, minWidth: 85 },
  colJoined: { flex: 0.9, minWidth: 95 },
  colAction: { flex: 1.3, minWidth: 160, alignItems: 'flex-end' },

  userCell: { flexDirection: 'row', alignItems: 'center', gap: 10 },

  drawerIntro: { fontFamily: fonts.sans, fontSize: 13.5, color: colors.textSoft, lineHeight: 20, marginBottom: 20 },
  drawerError: { fontFamily: fonts.sans, fontSize: 12.5, color: colors.danger, marginBottom: 8, lineHeight: 18 },

  detailHead: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 22 },
  detailName: { fontFamily: fonts.serifMedium, fontSize: 18, color: colors.text, marginBottom: 6 },
  detailBadgeRow: { flexDirection: 'row', gap: 8 },

  detailFieldGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16, marginBottom: 24 },
  detailField: { flexBasis: '45%', flexGrow: 1 },
  detailFieldLabel: { fontFamily: fonts.sansBold, fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5, color: colors.textSoft, marginBottom: 4 },
  detailFieldValue: { fontFamily: fonts.sansMedium, fontSize: 13.5, color: colors.text },
  detailFieldValueMono: { fontFamily: fonts.sans, fontSize: 11.5, color: colors.textSoft },

  detailLoading: { paddingVertical: 20, alignItems: 'center' },

  sectionTitle: { fontFamily: fonts.serifMedium, fontSize: 14.5, color: colors.text, marginTop: 8, marginBottom: 12 },
  detailStatsRow: { flexDirection: 'row', gap: 10, marginBottom: 24 },
  detailStatCard: { flex: 1, backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: 12, alignItems: 'center' },
  detailStatValue: { fontFamily: fonts.serif, fontSize: 17, color: colors.text, marginBottom: 2 },
  detailStatLabel: { fontFamily: fonts.sans, fontSize: 10.5, color: colors.textSoft, textAlign: 'center' },

  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  activityRowTitle: { fontFamily: fonts.sansSemiBold, fontSize: 13, color: colors.text },
  activityRowTag: { fontFamily: fonts.sansMedium, fontSize: 11.5, color: colors.accent },
  activityRowMeta: { fontFamily: fonts.sans, fontSize: 11.5, color: colors.textSoft, marginTop: 2 },
  activityRowBadge: { fontFamily: fonts.sansSemiBold, fontSize: 11, color: colors.textSoft },
});
