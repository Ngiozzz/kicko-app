import { Link } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts, radius } from '@kicko/shared';

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

export default function AdminSettings() {
  return (
    <View>
      <Text style={styles.title}>Settings</Text>
      <Text style={styles.subtitle}>Your account, plus the payment and match-session rules that govern the whole platform.</Text>

      <Text style={styles.secTitle}>Go to</Text>

      <NavCard title="Role settings" description="Your admin profile — name, phone, and appearance." href="/admin-dashboard/settings/role" />
      <NavCard
        title="Service fees"
        description="The flat fee added on top of a booking's subtotal, tiered by price bracket."
        href="/admin-dashboard/settings/fees"
      />
      <NavCard
        title="Cancellation refunds"
        description="Refund percentage by hours-to-kickoff at cancellation, plus the walk-in refund rate."
        href="/admin-dashboard/settings/refunds"
      />
      <NavCard
        title="Match windows"
        description="How long each phase of a shared match session stays open, and how big a side can get."
        href="/admin-dashboard/settings/windows"
      />
      <NavCard
        title="Email templates"
        description="The subject and body of every automatic email Kicko sends — booking, payout, venue, and review notices."
        href="/admin-dashboard/settings/emails"
      />
      <NavCard
        title="Server logs"
        description="Recent backend activity, with errors and warnings flagged so problems are easy to spot."
        href="/admin-dashboard/settings/logs"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  title: { fontFamily: fonts.serif, fontSize: 26, color: colors.text, marginBottom: 4 },
  subtitle: { fontFamily: fonts.sans, fontSize: 13.5, color: colors.textSoft, maxWidth: 640 },

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
    maxWidth: 820,
  },
  navCardTitle: { fontFamily: fonts.serifMedium, fontSize: 15, color: colors.text, marginBottom: 4 },
  navCardDesc: { fontFamily: fonts.sans, fontSize: 12.5, color: colors.textSoft, lineHeight: 18 },
  navCardArrow: { color: colors.accent, fontSize: 20, flexShrink: 0 },
});
