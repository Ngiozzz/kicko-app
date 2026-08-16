import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { colors, fonts, radius } from '@kicko/shared';
import { venuesApi, Venue } from '../../src/lib/venuesApi';
import { SportIcon, Sport } from '../../src/components/SportIcon';
import { Drawer } from '../../src/components/owner/Drawer';
import { Field } from '../../src/components/ui';

const PERMISSIONS = [
  { key: 'bookings', title: 'Approve/decline bookings', sub: 'Review and respond to booking requests for the assigned venue.', defaultOn: true },
  { key: 'pricing', title: 'Edit pricing & hours', sub: 'Change hourly rates, peak pricing, and operating hours.', defaultOn: true },
  { key: 'maintenance', title: 'Mark venue under maintenance', sub: 'Take the venue offline temporarily for repairs or upkeep.', defaultOn: true },
  { key: 'staff', title: 'Manage staff', sub: 'Add or remove staff members listed on the venue.', defaultOn: false },
  { key: 'financials', title: 'View venue financials', sub: 'See revenue, payouts, and Kicko commission for the venue.', defaultOn: false },
] as const;

function InviteDrawer({ visible, onClose, venueName }: { visible: boolean; onClose: () => void; venueName?: string }) {
  const [permissions, setPermissions] = useState<Record<string, boolean>>(
    Object.fromEntries(PERMISSIONS.map((p) => [p.key, p.defaultOn]))
  );

  return (
    <Drawer visible={visible} onClose={onClose} title="Invite a manager">
      <Text style={styles.drawerIntro}>
        They'll get access to approve bookings and run day-to-day operations for the venue you assign them.
      </Text>

      <Field label="Full name" placeholder="e.g. Faith Karanja" />
      <Field label="Email or phone" placeholder="faith@example.com" />
      {venueName ? (
        <Field label="Assign to venue" value={venueName} editable={false} />
      ) : (
        <Field label="Assign to venue" placeholder="Pick a venue" />
      )}

      <Text style={styles.permSectionTitle}>Permissions</Text>
      <Text style={styles.permSectionSub}>Choose exactly what this manager can do. You can change this anytime.</Text>
      {PERMISSIONS.map((perm) => (
        <View key={perm.key} style={styles.permRow}>
          <View style={styles.permText}>
            <Text style={styles.permTitle}>{perm.title}</Text>
            <Text style={styles.permSub}>{perm.sub}</Text>
          </View>
          <Switch
            value={permissions[perm.key]}
            onValueChange={(v) => setPermissions((p) => ({ ...p, [perm.key]: v }))}
            trackColor={{ true: colors.accent, false: colors.border }}
          />
        </View>
      ))}

      <View style={styles.drawerFoot}>
        <Pressable onPress={onClose} style={styles.outlineBtn}>
          <Text style={styles.outlineBtnText}>Cancel</Text>
        </Pressable>
        <Pressable onPress={onClose} style={styles.solidBtn}>
          <Text style={styles.solidBtnText}>Send invite</Text>
        </Pressable>
      </View>
    </Drawer>
  );
}

export default function OwnerManagers() {
  const [venues, setVenues] = useState<Venue[] | null>(null);
  const [inviteFor, setInviteFor] = useState<string | undefined | null>(null);

  const load = useCallback(async () => {
    try {
      const { venues } = await venuesApi.list();
      setVenues(venues);
    } catch {
      setVenues([]);
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
        <View>
          <Text style={styles.title}>Managers</Text>
          <Text style={styles.subtitle}>People you've delegated day-to-day running of a venue to.</Text>
        </View>
        <Pressable onPress={() => setInviteFor(undefined)} style={styles.btnSm}>
          <Text style={styles.btnSmText}>+ Invite manager</Text>
        </Pressable>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Active managers</Text>
          <Text style={styles.statValue}>0</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Venues managed</Text>
          <Text style={styles.statValue}>
            0<Text style={styles.statUnit}> of {venues ? venues.length : '—'}</Text>
          </Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Avg approval turnaround</Text>
          <Text style={styles.statValue}>—</Text>
        </View>
        <View style={[styles.statCard, styles.statCardAccent]}>
          <Text style={[styles.statLabel, { color: colors.accentText }]}>Bookings handled this month</Text>
          <Text style={[styles.statValue, { color: colors.accentText }]}>0</Text>
        </View>
      </View>

      <Text style={styles.secTitle}>Your managers</Text>
      <View style={styles.tablePanel}>
        <Text style={styles.emptyText}>No managers added yet.</Text>
      </View>

      <Text style={[styles.secTitle, { marginTop: 32 }]}>Unmanaged venues</Text>
      <Text style={styles.secSubtitle}>You're handling approvals and day-to-day yourself for these.</Text>

      {venues === null && <Text style={styles.emptyText}>Loading…</Text>}
      {venues && venues.length === 0 && <Text style={styles.emptyText}>You haven't added a venue yet.</Text>}
      {venues?.map((venue) => (
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
          <Pressable onPress={() => setInviteFor(venue.name)} style={styles.outlineBtnSm}>
            <Text style={styles.outlineBtnSmText}>+ Assign manager</Text>
          </Pressable>
        </View>
      ))}

      <InviteDrawer visible={inviteFor !== null} onClose={() => setInviteFor(null)} venueName={inviteFor ?? undefined} />
    </View>
  );
}

const styles = StyleSheet.create({
  headRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16, marginBottom: 24 },
  title: { fontFamily: fonts.serif, fontSize: 26, color: colors.text, marginBottom: 4 },
  subtitle: { fontFamily: fonts.sans, fontSize: 13.5, color: colors.textSoft },
  btnSm: { backgroundColor: colors.accent, borderRadius: radius.pill, paddingVertical: 10, paddingHorizontal: 18 },
  btnSmText: { fontFamily: fonts.sansBold, fontSize: 13, color: colors.accentText },

  statsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 18, marginBottom: 30 },
  statCard: { flexGrow: 1, flexBasis: 200, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, padding: 18 },
  statCardAccent: { backgroundColor: colors.accent },
  statLabel: { fontFamily: fonts.sansSemiBold, fontSize: 12.5, color: colors.textSoft, marginBottom: 10 },
  statValue: { fontFamily: fonts.serif, fontSize: 24, color: colors.text },
  statUnit: { fontFamily: fonts.sans, fontSize: 12, fontWeight: '500', color: colors.textSoft },

  secTitle: { fontFamily: fonts.serifMedium, fontSize: 19, color: colors.text, marginBottom: 6 },
  secSubtitle: { fontFamily: fonts.sans, fontSize: 13, color: colors.textSoft, marginBottom: 16 },

  tablePanel: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, padding: 22, marginBottom: 8 },
  emptyText: { fontFamily: fonts.sans, fontSize: 13, color: colors.textSoft },

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
  permSectionTitle: {
    fontFamily: fonts.sansBold,
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    color: colors.textSoft,
    marginTop: 22,
    marginBottom: 4,
  },
  permSectionSub: { fontFamily: fonts.sans, fontSize: 12, color: colors.textSoft, marginBottom: 8 },
  permRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  permText: { flex: 1 },
  permTitle: { fontFamily: fonts.sansSemiBold, fontSize: 13.5, color: colors.text },
  permSub: { fontFamily: fonts.sans, fontSize: 12, color: colors.textSoft, marginTop: 2 },

  drawerFoot: { flexDirection: 'row', gap: 10, marginTop: 20, paddingTop: 20, borderTopWidth: 1, borderTopColor: colors.border },
  outlineBtn: { flex: 1, borderWidth: 1.5, borderColor: colors.border, borderRadius: radius.pill, paddingVertical: 13, alignItems: 'center' },
  outlineBtnText: { fontFamily: fonts.sansBold, fontSize: 14, color: colors.text },
  solidBtn: { flex: 1, backgroundColor: colors.accent, borderRadius: radius.pill, paddingVertical: 13, alignItems: 'center' },
  solidBtnText: { fontFamily: fonts.sansBold, fontSize: 14, color: colors.accentText },
});
