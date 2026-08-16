import { Link } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts, radius } from '@kicko/shared';

function StatCard({ label, value, sub, href, priority }: { label: string; value: string; sub?: string; href?: string; priority?: boolean }) {
  const content = (
    <View style={[styles.statCard, priority && styles.statCardPriority]}>
      <Text style={[styles.statLabel, priority && styles.statLabelAccent]}>{label}</Text>
      <Text style={[styles.statValue, priority && styles.statLabelAccent]}>{value}</Text>
      {sub ? <Text style={styles.statSub}>{sub}</Text> : null}
    </View>
  );
  if (!href) return content;
  return (
    <Link href={href} asChild>
      <Pressable>{content}</Pressable>
    </Link>
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

export default function AdminPayments() {
  return (
    <View>
      <Text style={styles.title}>Payments</Text>
      <Text style={styles.subtitle}>Real money collected, real payouts and refunds — platform-wide.</Text>

      <View style={styles.statsRow}>
        <StatCard label="Total collected" value="KES 0" sub="From players, all-time" />
        <StatCard label="Paid out to owners" value="KES 0" />
        <StatCard label="Refunded to players" value="KES 0" />
        <StatCard label="Needs attention" value="0" sub="Failed payouts + refunds awaiting follow-up →" href="/admin-dashboard/payments/transactions?filter=attention" priority />
      </View>

      <Text style={styles.secTitle}>Go to</Text>

      <NavCard
        title="Transactions"
        description="Every booking payment, payout, and refund — with failed payouts and disputed refunds flagged for review."
        href="/admin-dashboard/payments/transactions"
      />
      <NavCard
        title="M-Pesa STK push reliability"
        description="Success, timeout, and cancellation rates for STK push collections, plus callback lag."
        href="/admin-dashboard/payments/reliability"
      />
      <NavCard
        title="Match sessions"
        description="Bookings turned into shared, split-cost sessions — fill rate, success rate, and why the failed ones failed."
        href="/admin-dashboard/payments/sessions"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  title: { fontFamily: fonts.serif, fontSize: 26, color: colors.text, marginBottom: 4 },
  subtitle: { fontFamily: fonts.sans, fontSize: 13.5, color: colors.textSoft, maxWidth: 640 },

  statsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 18, marginTop: 22, marginBottom: 8 },
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
});
