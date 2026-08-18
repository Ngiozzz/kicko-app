import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { colors, fonts, radius } from '@kicko/shared';
import { venuesApi, Venue } from '../../src/lib/venuesApi';
import { managersApi, Manager } from '../../src/lib/managersApi';
import { SportIcon, Sport } from '../../src/components/SportIcon';
import { Drawer } from '../../src/components/owner/Drawer';
import { Field } from '../../src/components/ui';

// Managers are invited by phone + a temp password the owner sets and
// relays themselves — many managers don't have an email, so unlike every
// other invite flow in the app, this one can't lean on Supabase's normal
// email-link mechanics. See conversation for why (option 2: no SMS/OTP
// infra yet, that's a later addition once a provider is picked).
function InviteDrawer({
  visible,
  onClose,
  venue,
  onCreated,
}: {
  visible: boolean;
  onClose: () => void;
  venue?: Venue;
  onCreated: (manager: Manager) => void;
}) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function reset() {
    setName('');
    setPhone('');
    setEmail('');
    setPassword('');
    setError(null);
  }

  async function handleSubmit() {
    if (!venue) return;
    if (!name.trim() || !phone.trim() || password.length < 8) {
      setError('Name, phone number, and a password of at least 8 characters are required.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const { manager } = await managersApi.create({
        name: name.trim(),
        phone: phone.trim(),
        password,
        email: email.trim() || undefined,
        venue_id: venue.id,
      });
      onCreated(manager);
      reset();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not invite this manager.');
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
      title="Invite a manager"
    >
      <Text style={styles.drawerIntro}>
        They'll get access to approve bookings and run day-to-day operations for the venue you assign them. Share the phone number and
        password with them directly — that's how they'll sign in.
      </Text>

      <Field label="Full name" placeholder="e.g. Faith Karanja" value={name} onChangeText={setName} />
      <Field label="Phone number" placeholder="+254 700 000 000" keyboardType="phone-pad" value={phone} onChangeText={setPhone} />
      <Field label="Email (optional)" placeholder="faith@example.com" autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} />
      <Field label="Temporary password" placeholder="At least 8 characters" secureTextEntry value={password} onChangeText={setPassword} />
      <Field label="Assign to venue" value={venue?.name ?? ''} editable={false} />

      {error ? <Text style={styles.drawerError}>{error}</Text> : null}

      <View style={styles.drawerFoot}>
        <Pressable onPress={onClose} style={styles.outlineBtn}>
          <Text style={styles.outlineBtnText}>Cancel</Text>
        </Pressable>
        <Pressable onPress={handleSubmit} disabled={saving} style={[styles.solidBtn, saving && styles.solidBtnDisabled]}>
          <Text style={styles.solidBtnText}>{saving ? 'Sending…' : 'Send invite'}</Text>
        </Pressable>
      </View>
    </Drawer>
  );
}

export default function OwnerManagers() {
  const [venues, setVenues] = useState<Venue[] | null>(null);
  const [managers, setManagers] = useState<Manager[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [inviteFor, setInviteFor] = useState<Venue | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [{ venues }, { managers }] = await Promise.all([venuesApi.list(), managersApi.list()]);
      setVenues(venues);
      setManagers(managers);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load managers.');
      setVenues((v) => v ?? []);
      setManagers((m) => m ?? []);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  async function handleRemove(manager: Manager) {
    setBusyId(manager.id);
    setError(null);
    try {
      await managersApi.remove(manager.id);
      setManagers((prev) => prev?.filter((m) => m.id !== manager.id) ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not remove this manager.');
    } finally {
      setBusyId(null);
    }
  }

  const managedVenueIds = new Set((managers ?? []).map((m) => m.venue_id));
  const unmanagedVenues = (venues ?? []).filter((v) => !managedVenueIds.has(v.id));

  return (
    <View>
      <View style={styles.headRow}>
        <View>
          <Text style={styles.title}>Managers</Text>
          <Text style={styles.subtitle}>People you've delegated day-to-day running of a venue to.</Text>
        </View>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Active managers</Text>
          <Text style={styles.statValue}>{managers ? managers.length : '—'}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Venues managed</Text>
          <Text style={styles.statValue}>
            {managers ? managedVenueIds.size : '—'}
            <Text style={styles.statUnit}> of {venues ? venues.length : '—'}</Text>
          </Text>
        </View>
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Text style={styles.secTitle}>Your managers</Text>
      <View style={styles.tablePanel}>
        {managers === null && (
          <View style={styles.loading}>
            <ActivityIndicator color={colors.accent} />
          </View>
        )}
        {managers && managers.length === 0 && <Text style={styles.emptyText}>No managers added yet.</Text>}
        {managers?.map((manager) => (
          <View key={manager.id} style={styles.managerRow}>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={styles.managerName}>{manager.name}</Text>
              <Text style={styles.managerMeta}>
                {manager.phone}
                {manager.venue ? ` · ${manager.venue.name}` : ''}
              </Text>
            </View>
            <Pressable onPress={() => handleRemove(manager)} disabled={busyId === manager.id}>
              <Text style={styles.removeText}>{busyId === manager.id ? '…' : 'Remove'}</Text>
            </Pressable>
          </View>
        ))}
      </View>

      <Text style={[styles.secTitle, { marginTop: 32 }]}>Unmanaged venues</Text>
      <Text style={styles.secSubtitle}>You're handling approvals and day-to-day yourself for these.</Text>

      {venues === null && <Text style={styles.emptyText}>Loading…</Text>}
      {venues && venues.length === 0 && <Text style={styles.emptyText}>You haven't added a venue yet.</Text>}
      {venues && venues.length > 0 && unmanagedVenues.length === 0 && <Text style={styles.emptyText}>Every venue has a manager assigned.</Text>}
      {unmanagedVenues.map((venue) => (
        <View key={venue.id} style={styles.unmanagedRow}>
          <View style={styles.unmanagedInfo}>
            <SportIcon sport={venue.sport as Sport} size={28} />
            <View>
              <Text style={styles.unmanagedTitle}>{venue.name}</Text>
              <Text style={styles.unmanagedMeta}>
                {venue.sport} · {venue.location}
              </Text>
            </View>
          </View>
          <Pressable onPress={() => setInviteFor(venue)} style={styles.outlineBtnSm}>
            <Text style={styles.outlineBtnSmText}>+ Assign manager</Text>
          </Pressable>
        </View>
      ))}

      <InviteDrawer
        visible={inviteFor !== null}
        onClose={() => setInviteFor(null)}
        venue={inviteFor ?? undefined}
        onCreated={(manager) => setManagers((prev) => (prev ? [manager, ...prev] : [manager]))}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  headRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16, marginBottom: 24 },
  title: { fontFamily: fonts.serif, fontSize: 26, color: colors.text, marginBottom: 4 },
  subtitle: { fontFamily: fonts.sans, fontSize: 13.5, color: colors.textSoft },

  statsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 18, marginBottom: 30 },
  statCard: { flexGrow: 1, flexBasis: 200, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, padding: 18 },
  statLabel: { fontFamily: fonts.sansSemiBold, fontSize: 12.5, color: colors.textSoft, marginBottom: 10 },
  statValue: { fontFamily: fonts.serif, fontSize: 24, color: colors.text },
  statUnit: { fontFamily: fonts.sans, fontSize: 12, fontWeight: '500', color: colors.textSoft },

  secTitle: { fontFamily: fonts.serifMedium, fontSize: 19, color: colors.text, marginBottom: 6 },
  secSubtitle: { fontFamily: fonts.sans, fontSize: 13, color: colors.textSoft, marginBottom: 16 },

  error: { fontFamily: fonts.sans, fontSize: 13.5, color: colors.danger, marginBottom: 12 },
  loading: { paddingVertical: 20, alignItems: 'center' },

  tablePanel: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, padding: 22, marginBottom: 8 },
  emptyText: { fontFamily: fonts.sans, fontSize: 13, color: colors.textSoft },

  managerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  managerName: { fontFamily: fonts.sansSemiBold, fontSize: 14, color: colors.text },
  managerMeta: { fontFamily: fonts.sans, fontSize: 12, color: colors.textSoft, marginTop: 2 },
  removeText: { fontFamily: fonts.sansSemiBold, fontSize: 12.5, color: colors.danger },

  unmanagedRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 14,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: 16,
    marginBottom: 12,
  },
  unmanagedInfo: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  unmanagedTitle: { fontFamily: fonts.sansSemiBold, fontSize: 14, color: colors.text },
  unmanagedMeta: { fontFamily: fonts.sans, fontSize: 12, color: colors.textSoft, marginTop: 2, textTransform: 'capitalize' },
  outlineBtnSm: { borderWidth: 1.5, borderColor: colors.border, borderRadius: radius.pill, paddingVertical: 8, paddingHorizontal: 14 },
  outlineBtnSmText: { fontFamily: fonts.sansSemiBold, fontSize: 12.5, color: colors.text },

  drawerIntro: { fontFamily: fonts.sans, fontSize: 13, color: colors.textSoft, marginBottom: 20, lineHeight: 20 },
  drawerError: { fontFamily: fonts.sans, fontSize: 12.5, color: colors.danger, marginBottom: 8, lineHeight: 18 },

  drawerFoot: { flexDirection: 'row', gap: 10, marginTop: 20, paddingTop: 20, borderTopWidth: 1, borderTopColor: colors.border },
  outlineBtn: { flex: 1, borderWidth: 1.5, borderColor: colors.border, borderRadius: radius.pill, paddingVertical: 13, alignItems: 'center' },
  outlineBtnText: { fontFamily: fonts.sansBold, fontSize: 14, color: colors.text },
  solidBtn: { flex: 1, backgroundColor: colors.accent, borderRadius: radius.pill, paddingVertical: 13, alignItems: 'center' },
  solidBtnDisabled: { opacity: 0.6 },
  solidBtnText: { fontFamily: fonts.sansBold, fontSize: 14, color: colors.accentText },
});
