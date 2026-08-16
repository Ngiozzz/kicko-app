import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { Link } from 'expo-router';
import { colors, fonts } from '@kicko/shared';
import { Logo } from './Logo';
import { Role, roleContent } from '../content/roleContent';

const ROLES: Role[] = ['player', 'owner', 'manager'];

// Privacy/Terms don't have real content yet (see app/privacy.tsx and
// app/terms.tsx — honest placeholders, not fabricated legal text), but
// the links are here now so the footer's shape doesn't need to change
// again once that copy exists.
const LEGAL_LINKS: { href: '/privacy' | '/terms'; label: string }[] = [
  { href: '/privacy', label: 'Privacy Policy' },
  { href: '/terms', label: 'Terms of Service' },
];

export function Footer({ onSelectRole }: { onSelectRole: (role: Role) => void }) {
  const { width } = useWindowDimensions();
  const narrow = width < 700;

  return (
    <View style={styles.root}>
      <View style={[styles.topRow, narrow && styles.topRowNarrow]}>
        <View style={styles.brandCol}>
          <Logo />
          <Text style={styles.tagline}>Multi-sport venue booking, one dashboard.</Text>
        </View>

        <View style={styles.linkCols}>
          <View style={styles.linkCol}>
            <Text style={styles.colHeading}>Product</Text>
            {ROLES.map((role) => (
              <Pressable key={role} onPress={() => onSelectRole(role)}>
                <Text style={styles.link}>{roleContent[role].tabLabel}</Text>
              </Pressable>
            ))}
          </View>

          <View style={styles.linkCol}>
            <Text style={styles.colHeading}>Legal</Text>
            {LEGAL_LINKS.map((l) => (
              <Link key={l.href} href={l.href} style={styles.link}>
                {l.label}
              </Link>
            ))}
          </View>
        </View>
      </View>

      <View style={styles.bottomBar}>
        <Text style={styles.footerText}>© {new Date().getFullYear()} Kicko</Text>
        <Link href="/admin" style={styles.adminLink}>
          Admin
        </Link>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { borderTopWidth: 1, borderTopColor: colors.border, marginTop: 8 },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    maxWidth: 1160,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: 24,
    paddingTop: 48,
    paddingBottom: 32,
    gap: 40,
  },
  topRowNarrow: { flexDirection: 'column' },

  brandCol: { maxWidth: 260, gap: 10 },
  tagline: { fontFamily: fonts.sans, fontSize: 13, lineHeight: 19, color: colors.textSoft },

  linkCols: { flexDirection: 'row', gap: 56 },
  linkCol: { gap: 12 },
  colHeading: {
    fontFamily: fonts.sansBold,
    fontSize: 11.5,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: colors.textSoft,
    marginBottom: 4,
  },
  link: { fontFamily: fonts.sans, fontSize: 13.5, color: colors.text },

  bottomBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    maxWidth: 1160,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  footerText: { fontFamily: fonts.sans, fontSize: 12.5, color: colors.textSoft },
  adminLink: { fontFamily: fonts.sans, fontSize: 12, color: colors.textSoft, opacity: 0.55 },
});
