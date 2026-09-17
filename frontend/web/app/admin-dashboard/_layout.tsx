import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Slot, router } from 'expo-router';
import { colors, fonts, radius, supabase } from '@kicko/shared';
import { useRoleGate } from '../../src/lib/useRoleGate';
import { AdminShell } from '../../src/components/admin/AdminShell';

// Shown instead of the dashboard for an admin account a ceo hasn't
// approved yet (see admin.controller.ts#createAdmin/approveAdmin) — they
// can sign in, they just can't see or do anything until approved.
function PendingApprovalScreen({ name }: { name: string }) {
  async function handleSignOut() {
    await supabase.auth.signOut();
    router.replace('/admin');
  }

  return (
    <View style={styles.center}>
      <View style={styles.pendingCard}>
        <Text style={styles.pendingIcon}>⏳</Text>
        <Text style={styles.pendingTitle}>Hi {name.split(' ')[0]}, you're almost in.</Text>
        <Text style={styles.pendingBody}>
          Your admin account has been created but needs approval from Kicko's CEO before you can access the dashboard. They've been notified — check back shortly.
        </Text>
        <Pressable onPress={handleSignOut} style={styles.pendingSignOutBtn}>
          <Text style={styles.pendingSignOutText}>Sign out</Text>
        </Pressable>
      </View>
    </View>
  );
}

// Auth/role gate for every /admin-dashboard/* screen — see useRoleGate for
// the shared checks (auth, role, session-inactivity timeout). Unauthenticated
// visitors bounce to the dedicated admin sign-in page (not the public
// /sign-in — admins never self-register, see app/admin.tsx). 'ceo' is a
// full admin-equivalent account under a different label, so it shares this
// entire layout. A 'pending' admin sees a waiting screen instead of being
// bounced elsewhere — they matched the role, they just aren't approved yet.
export default function AdminLayout() {
  const { status, name, avatarUrl, role } = useRoleGate(['admin', 'ceo']);

  if (status === 'checking') {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  if (status === 'pending') {
    return <PendingApprovalScreen name={name} />;
  }

  return (
    <AdminShell userName={name} avatarUrl={avatarUrl} roleLabel={role === 'ceo' ? 'CEO' : 'Admin'}>
      <Slot />
    </AdminShell>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg, padding: 24 },
  pendingCard: {
    maxWidth: 400,
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: 32,
  },
  pendingIcon: { fontSize: 32, marginBottom: 14 },
  pendingTitle: { fontFamily: fonts.serifMedium, fontSize: 19, color: colors.text, textAlign: 'center', marginBottom: 10 },
  pendingBody: { fontFamily: fonts.sans, fontSize: 13.5, color: colors.textSoft, textAlign: 'center', lineHeight: 20, marginBottom: 22 },
  pendingSignOutBtn: { borderWidth: 1.5, borderColor: colors.border, borderRadius: radius.pill, paddingVertical: 10, paddingHorizontal: 22 },
  pendingSignOutText: { fontFamily: fonts.sansSemiBold, fontSize: 13, color: colors.text },
});
