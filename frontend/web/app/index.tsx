import { StyleSheet, Text, View, ScrollView, Pressable } from 'react-native';
import { Link } from 'expo-router';
import { colors, fonts, radius } from '@kicko/shared';
import { WebNav } from '../src/components/WebNav';
import { SportIcon, Sport } from '../src/components/SportIcon';

const SPORTS: Sport[] = ['football', 'basketball', 'tennis', 'padel', 'volleyball'];

export default function Landing() {
  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.rootContent}>
      <WebNav />

      {/* Hero */}
      <View style={styles.hero}>
        <Text style={styles.eyebrow}>Multi-sport venue booking</Text>
        <Text style={styles.heroTitle}>Every court, one platform.</Text>
        <Text style={styles.heroSubtitle}>
          Kicko connects players looking for a game with the owners and managers running the venues that host it.
        </Text>
        <View style={styles.sportRow}>
          {SPORTS.map((s) => (
            <SportIcon key={s} sport={s} size={30} />
          ))}
        </View>
        <View style={styles.heroActions}>
          <Link href="/sign-up" asChild>
            <Pressable style={styles.primaryBtn}>
              <Text style={styles.primaryBtnText}>List your venue</Text>
            </Pressable>
          </Link>
          <Link href="/sign-in" asChild>
            <Pressable style={styles.secondaryBtn}>
              <Text style={styles.secondaryBtnText}>Sign in</Text>
            </Pressable>
          </Link>
        </View>
      </View>

      {/* For Players */}
      <View nativeID="players" style={[styles.section, styles.sectionAlt]}>
        <View style={styles.sectionInner}>
          <Text style={styles.sectionEyebrow}>For players</Text>
          <Text style={styles.sectionTitle}>Book pitches in minutes and get playing.</Text>
          <Text style={styles.sectionBody}>
            Find a court, book a slot, and split the cost with your team — all from the Kicko mobile app.
          </Text>
          <View style={styles.comingSoonBadge}>
            <Text style={styles.comingSoonText}>Mobile app — coming soon</Text>
          </View>
        </View>
      </View>

      {/* For Owners */}
      <View nativeID="owners" style={styles.section}>
        <View style={styles.sectionInner}>
          <Text style={styles.sectionEyebrow}>For owners</Text>
          <Text style={styles.sectionTitle}>Run your venues like a business.</Text>
          <Text style={styles.sectionBody}>
            List your courts, take bookings automatically, track payouts, and add managers to help run the day-to-day
            — all from one dashboard.
          </Text>
          <View style={styles.sectionActions}>
            <Link href="/sign-up" asChild>
              <Pressable style={styles.primaryBtn}>
                <Text style={styles.primaryBtnText}>Create your account</Text>
              </Pressable>
            </Link>
            <Link href="/sign-in" asChild>
              <Pressable>
                <Text style={styles.inlineLink}>Already have an account? Sign in</Text>
              </Pressable>
            </Link>
          </View>
        </View>
      </View>

      {/* For Managers */}
      <View nativeID="managers" style={[styles.section, styles.sectionAlt]}>
        <View style={styles.sectionInner}>
          <Text style={styles.sectionEyebrow}>For managers</Text>
          <Text style={styles.sectionTitle}>Manage the day-to-day, without owning the account.</Text>
          <Text style={styles.sectionBody}>
            Managers are added directly by their venue owner — there's no separate sign-up. If you've been added to a
            venue, sign in below.
          </Text>
          <View style={styles.sectionActions}>
            <Link href="/sign-in" asChild>
              <Pressable style={styles.primaryBtn}>
                <Text style={styles.primaryBtnText}>Manager sign in</Text>
              </Pressable>
            </Link>
          </View>
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>© {new Date().getFullYear()} Kicko</Text>
        <Link href="/admin" asChild>
          <Pressable>
            <Text style={styles.adminLink}>Admin</Text>
          </Pressable>
        </Link>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  rootContent: { flexGrow: 1 },

  hero: {
    maxWidth: 720,
    alignSelf: 'center',
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 56,
    paddingBottom: 72,
  },
  eyebrow: {
    fontFamily: fonts.sansBold,
    fontSize: 12,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: colors.accent,
    marginBottom: 14,
  },
  heroTitle: {
    fontFamily: fonts.serif,
    fontSize: 46,
    lineHeight: 52,
    color: colors.text,
    textAlign: 'center',
    marginBottom: 14,
  },
  heroSubtitle: {
    fontFamily: fonts.sans,
    fontSize: 16,
    lineHeight: 24,
    color: colors.textSoft,
    textAlign: 'center',
    maxWidth: 480,
    marginBottom: 28,
  },
  sportRow: { flexDirection: 'row', gap: 14, marginBottom: 36 },
  heroActions: { flexDirection: 'row', gap: 14 },

  primaryBtn: {
    backgroundColor: colors.accent,
    borderRadius: radius.pill,
    paddingVertical: 13,
    paddingHorizontal: 24,
  },
  primaryBtnText: { fontFamily: fonts.sansBold, fontSize: 14.5, color: colors.accentText },
  secondaryBtn: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingVertical: 13,
    paddingHorizontal: 24,
  },
  secondaryBtnText: { fontFamily: fonts.sansBold, fontSize: 14.5, color: colors.text },

  section: { paddingVertical: 64, paddingHorizontal: 24 },
  sectionAlt: { backgroundColor: colors.surface },
  sectionInner: { maxWidth: 640, alignSelf: 'center', width: '100%' },
  sectionEyebrow: {
    fontFamily: fonts.sansBold,
    fontSize: 12,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: colors.accent,
    marginBottom: 12,
  },
  sectionTitle: { fontFamily: fonts.serif, fontSize: 30, lineHeight: 36, color: colors.text, marginBottom: 14 },
  sectionBody: { fontFamily: fonts.sans, fontSize: 15, lineHeight: 23, color: colors.textSoft, maxWidth: 520, marginBottom: 24 },
  sectionActions: { flexDirection: 'row', alignItems: 'center', gap: 20, flexWrap: 'wrap' },
  inlineLink: { fontFamily: fonts.sansBold, fontSize: 14, color: colors.accent },

  comingSoonBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.accentSoft,
    borderRadius: radius.pill,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  comingSoonText: { fontFamily: fonts.sansSemiBold, fontSize: 12.5, color: colors.accent },

  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    maxWidth: 1160,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: 24,
    paddingVertical: 28,
  },
  footerText: { fontFamily: fonts.sans, fontSize: 12.5, color: colors.textSoft },
  adminLink: { fontFamily: fonts.sans, fontSize: 12, color: colors.textSoft, opacity: 0.55 },
});
