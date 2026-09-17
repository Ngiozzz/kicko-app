import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Link, useFocusEffect } from 'expo-router';
import { colors, fonts, radius } from '@kicko/shared';
import { adminApi, FinanceOverview } from '../../../src/lib/adminApi';
import { useAdminRole } from '../../../src/lib/adminRoleContext';

function StatCard({ label, value, sub, priority }: { label: string; value: string; sub?: string; priority?: boolean }) {
  return (
    <View style={[styles.statCard, priority && styles.statCardPriority]}>
      <Text style={[styles.statLabel, priority && styles.statLabelAccent]}>{label}</Text>
      <Text style={[styles.statValue, priority && styles.statLabelAccent]}>{value}</Text>
      {sub ? <Text style={styles.statSub}>{sub}</Text> : null}
    </View>
  );
}

function NavCard({ title, description, href }: { title: string; description: string; href: string }) {
  return (
    <Link href={href} asChild>
      <Pressable style={styles.navCard}>
        <View style={{ flex: 1 }}>
          <Text style={styles.navCardTitle}>{title}</Text>
          <Text style={styles.navCardDesc}>{description}</Text>
        </View>
        <Text style={styles.navCardArrow}>→</Text>
      </Pressable>
    </Link>
  );
}

function kes(amount: number): string {
  return `KES ${amount.toLocaleString('en-KE', { maximumFractionDigits: 0 })}`;
}

// This whole sector is reachable only via a nav link CEOs see (see
// AdminShell's CEO_ITEMS) — this guard just covers a plain admin who
// guesses the URL directly. The backend enforces the real boundary (see
// admin.controller.ts#getFinanceOverview).
function CeoOnlyNotice() {
  return (
    <View style={styles.notice}>
      <Text style={styles.noticeTitle}>CEO access only</Text>
      <Text style={styles.noticeBody}>This page shows Kicko's own revenue and profit — only a CEO account can view it.</Text>
    </View>
  );
}

export default function AdminFinance() {
  const role = useAdminRole();
  const [finance, setFinance] = useState<FinanceOverview | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await adminApi.financeOverview();
      setFinance(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load business finances.');
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (role === 'ceo') load();
    }, [role, load])
  );

  if (role !== 'ceo') return <CeoOnlyNotice />;

  return (
    <View>
      <Text style={styles.title}>Finance</Text>
      <Text style={styles.subtitle}>Kicko's own numbers — what the platform has actually made, separate from what venues and players see.</Text>

      {error && <Text style={styles.error}>{error}</Text>}
      {!finance && !error && (
        <View style={styles.loading}>
          <ActivityIndicator color={colors.accent} />
        </View>
      )}

      {finance && (
        <View style={styles.statsRow}>
          <StatCard label="Total revenue" value={kes(finance.totalRevenue)} sub="Collected from players, all-time" />
          <StatCard label="Platform profit" value={kes(finance.platformProfit)} sub="Kicko's service-fee cut — never paid out or refunded" priority />
          <StatCard label="Paid to venues" value={kes(finance.totalPayouts)} sub="Payouts sent to owners" />
          <StatCard label="Refunded" value={kes(finance.totalRefunded)} sub="Returned to players" />
        </View>
      )}

      <Text style={styles.secTitle}>Go to</Text>

      <NavCard
        title="Revenue by venue"
        description="Which venues are actually driving Kicko's revenue and profit, ranked highest first."
        href="/admin-dashboard/finance/venues"
      />
      <NavCard
        title="Transactions"
        description="Every booking payment, payout, and refund, with the service fee — Kicko's cut — broken out per line."
        href="/admin-dashboard/payments/transactions"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  title: { fontFamily: fonts.serif, fontSize: 26, color: colors.text, marginBottom: 4 },
  subtitle: { fontFamily: fonts.sans, fontSize: 13.5, color: colors.textSoft, maxWidth: 640 },

  loading: { paddingVertical: 30, alignItems: 'center', marginTop: 22 },
  error: { fontFamily: fonts.sans, fontSize: 13, color: colors.danger, marginTop: 16 },

  statsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 18, marginTop: 22 },
  statCard: { flexGrow: 1, flexBasis: 220, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, padding: 20 },
  statCardPriority: { borderColor: colors.accent },
  statLabel: { fontFamily: fonts.sansSemiBold, fontSize: 12.5, color: colors.textSoft, marginBottom: 14 },
  statLabelAccent: { color: colors.accent },
  statValue: { fontFamily: fonts.serif, fontSize: 26, color: colors.text },
  statSub: { fontFamily: fonts.sans, fontSize: 12, color: colors.textSoft, marginTop: 6 },

  secTitle: { fontFamily: fonts.serifMedium, fontSize: 18, color: colors.text, marginTop: 36, marginBottom: 16 },

  navCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingVertical: 20,
    paddingHorizontal: 22,
    marginBottom: 14,
    gap: 16,
  },
  navCardTitle: { fontFamily: fonts.serifMedium, fontSize: 15, color: colors.text, marginBottom: 4 },
  navCardDesc: { fontFamily: fonts.sans, fontSize: 12.5, color: colors.textSoft, lineHeight: 18 },
  navCardArrow: { color: colors.accent, fontSize: 20, flexShrink: 0 },

  notice: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, padding: 28, marginTop: 22, maxWidth: 480 },
  noticeTitle: { fontFamily: fonts.serifMedium, fontSize: 17, color: colors.text, marginBottom: 8 },
  noticeBody: { fontFamily: fonts.sans, fontSize: 13.5, color: colors.textSoft, lineHeight: 20 },
});
