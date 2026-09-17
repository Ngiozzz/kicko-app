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
  const narrow = width < 720;

  return (
    <View style={styles.root}>
      <View style={styles.inner}>
        <View style={[styles.topRow, narrow && styles.topRowNarrow]}>
          <View style={[styles.brandCol, narrow && styles.brandColNarrow]}>
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
          <Text style={styles.footerText}>© {new Date().getFullYear()} Kicko. All rights reserved.</Text>
          {/* Unlabeled on purpose — staff already know it's here; nobody else needs to. */}
          <Link href="/admin" asChild>
            <Pressable style={styles.adminDot} accessibilityLabel="Staff sign in">
              <View style={styles.adminDotMark} />
            </Pressable>
          </Link>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border, marginTop: 8 },
  inner: { maxWidth: 1040, width: '100%', alignSelf: 'center', paddingHorizontal: 24 },

  topRow: { flexDirection: 'row', paddingTop: 56, paddingBottom: 40, gap: 56 },
  topRowNarrow: { flexDirection: 'column', gap: 36 },

  brandCol: { flex: 1.1, maxWidth: 300, gap: 12 },
  brandColNarrow: { maxWidth: '100%' },
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

  linkCols: { flex: 1, flexDirection: 'row', gap: 40 },
  linkCol: { flex: 1, gap: 12 },
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
    paddingVertical: 18,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  footerText: { fontFamily: fonts.sans, fontSize: 12.5, color: colors.textSoft },
  adminDot: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
  adminDotMark: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: colors.border },
});
