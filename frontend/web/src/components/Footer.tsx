import { ReactElement } from 'react';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { Link } from 'expo-router';
import { colors, fonts, radius } from '@kicko/shared';
import { Logo } from './Logo';
import { Role, roleContent } from '../content/roleContent';
import { FacebookIcon, InstagramIcon, XIcon } from './SocialIcons';

const ROLES: Role[] = ['player', 'owner', 'manager'];

// Privacy/Terms don't have real content yet (see app/privacy.tsx and
// app/terms.tsx — honest placeholders, not fabricated legal text), but
// the links are here now so the footer's shape doesn't need to change
// again once that copy exists.
const LEGAL_LINKS: { href: '/privacy' | '/terms'; label: string }[] = [
  { href: '/privacy', label: 'Privacy Policy' },
  { href: '/terms', label: 'Terms of Service' },
];

// Real profile URLs aren't live yet — same reasoning as LEGAL_LINKS above:
// ship the row now so it doesn't need rebuilding once the accounts exist,
// just filled in here. An empty href renders inert (see SocialLink) rather
// than a dead link out to nowhere.
const SOCIAL_LINKS: { key: string; label: string; href: string; Icon: (p: { size?: number; color: string }) => ReactElement }[] = [
  { key: 'instagram', label: 'Instagram', href: '', Icon: InstagramIcon },
  { key: 'x', label: 'X (Twitter)', href: '', Icon: XIcon },
  { key: 'facebook', label: 'Facebook', href: '', Icon: FacebookIcon },
];

function SocialLink({ href, label, Icon }: { href: string; label: string; Icon: (p: { size?: number; color: string }) => ReactElement }) {
  const icon = (
    <View style={styles.socialIconWrap}>
      <Icon size={16} color={colors.textSoft} />
    </View>
  );
  if (!href) return icon;
  return (
    <Link href={href} target="_blank" accessibilityLabel={label}>
      {icon}
    </Link>
  );
}

export function Footer({ onSelectRole }: { onSelectRole: (role: Role) => void }) {
  const { width } = useWindowDimensions();
  const narrow = width < 700;

  return (
    <View style={styles.root}>
      <View style={[styles.topRow, narrow && styles.topRowNarrow]}>
        <View style={styles.brandCol}>
          <Logo />
          <Text style={styles.tagline}>Multi-sport venue booking, one dashboard.</Text>
          <View style={styles.socialRow}>
            {SOCIAL_LINKS.map((s) => (
              <SocialLink key={s.key} href={s.href} label={s.label} Icon={s.Icon} />
            ))}
          </View>
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
  socialRow: { flexDirection: 'row', gap: 10, marginTop: 4 },
  socialIconWrap: {
    width: 32,
    height: 32,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },

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
