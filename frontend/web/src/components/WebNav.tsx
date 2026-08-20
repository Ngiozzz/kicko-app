import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Link } from 'expo-router';
import { colors, fonts, radius } from '@kicko/shared';
import { Logo } from './Logo';
import { Role, roleContent } from '../content/roleContent';
import { useFade } from '../lib/useFade';
import { withRole } from '../lib/withRole';

const ROLES: Role[] = ['player', 'owner', 'manager'];

const TRANSITION = { transitionProperty: 'all', transitionDuration: '160ms', transitionTimingFunction: 'ease' } as const;

function RoleTab({ role, active, onPress }: { role: Role; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      role="tab"
      aria-selected={active}
      style={[styles.roleTab, active && styles.roleTabActive]}
    >
      <Text style={[styles.roleTabText, active && styles.roleTabTextActive]}>{roleContent[role].tabLabel}</Text>
    </Pressable>
  );
}

function LogoLink() {
  const [hovered, setHovered] = useState(false);
  return (
    <Link href="/" asChild>
      <Pressable onHoverIn={() => setHovered(true)} onHoverOut={() => setHovered(false)}>
        <View style={[styles.logoWrap, hovered && styles.logoWrapHovered]}>
          <Logo />
        </View>
      </Pressable>
    </Link>
  );
}

function SignInLink({ role }: { role: Role }) {
  const [hovered, setHovered] = useState(false);
  return (
    <Link href={withRole('/sign-in', role)} asChild>
      <Pressable onHoverIn={() => setHovered(true)} onHoverOut={() => setHovered(false)}>
        <Text style={[styles.signInText, hovered && styles.signInTextHovered]}>Sign in</Text>
      </Pressable>
    </Link>
  );
}

function NavCta({ role }: { role: Role }) {
  const [hovered, setHovered] = useState(false);
  const { primary } = roleContent[role];
  const fade = useFade(role);

  if ('comingSoon' in primary) {
    return (
      <View style={[styles.comingSoonPill, fade]}>
        <Text style={styles.comingSoonText}>{primary.text}</Text>
      </View>
    );
  }

  // Carry the role forward so /sign-in or /sign-up shows the right copy.
  const href = withRole(primary.href, role);

  return (
    <Link href={href} asChild>
      <Pressable onHoverIn={() => setHovered(true)} onHoverOut={() => setHovered(false)}>
        <View style={StyleSheet.flatten([styles.ctaBtn, hovered && styles.ctaBtnHovered, fade])}>
          <Text style={styles.ctaText}>{primary.text}</Text>
        </View>
      </Pressable>
    </Link>
  );
}

// Public nav for the landing page (see app/index.tsx). Sticky (position:
// sticky, web-only) so it's always reachable — never scrolls out of view.
// The role tabs don't scroll anywhere: picking one swaps the hero copy
// and FAQ below in place (see roleContent.ts), same interaction as
// thurfa-platform/frontend/web_V2's role switcher, rebuilt in Kicko's
// own design language rather than Thurfa's.
export function WebNav({ activeRole, onSelectRole }: { activeRole: Role; onSelectRole: (role: Role) => void }) {
  return (
    <View style={styles.stickyBar}>
      <View style={styles.nav}>
        <LogoLink />

        <View style={styles.roleSwitch} role="tablist" aria-label="Choose your role">
          {ROLES.map((role) => (
            <RoleTab key={role} role={role} active={activeRole === role} onPress={() => onSelectRole(role)} />
          ))}
        </View>

        <View style={styles.navActions}>
          <Link href="/venues" style={styles.browseLink}>
            Browse venues
          </Link>
          <SignInLink role={activeRole} />
          <NavCta role={activeRole} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  stickyBar: {
    position: 'sticky' as any,
    top: 0,
    zIndex: 30,
    width: '100%',
    backgroundColor: colors.bg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  nav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    maxWidth: 1160,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
    gap: 16,
    flexWrap: 'wrap',
  },

  logoWrap: { opacity: 1, ...TRANSITION },
  logoWrapHovered: { opacity: 0.75 },

  roleSwitch: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    padding: 4,
    gap: 2,
  },
  roleTab: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: radius.pill, ...TRANSITION },
  roleTabActive: { backgroundColor: colors.bg },
  roleTabText: { fontFamily: fonts.sansMedium, fontSize: 13.5, color: colors.textSoft, ...TRANSITION },
  roleTabTextActive: { color: colors.text, fontFamily: fonts.sansSemiBold },

  navActions: { flexDirection: 'row', alignItems: 'center', gap: 20 },
  browseLink: { fontFamily: fonts.sansMedium, fontSize: 13.5, color: colors.textSoft },
  signInText: { fontFamily: fonts.sansBold, fontSize: 13.5, color: colors.text, ...TRANSITION },
  signInTextHovered: { color: colors.accent },

  // Fixed minWidth so the button doesn't resize with the label — "Create
  // your account" is much longer than "Get the app" or "Sign in", and
  // without this the whole nav row (justify-content: space-between)
  // shifted the role tabs sideways every time the role changed.
  ctaBtn: {
    backgroundColor: colors.accent,
    borderRadius: radius.pill,
    paddingVertical: 10,
    paddingHorizontal: 20,
    minWidth: 190,
    alignItems: 'center',
    ...TRANSITION,
  },
  ctaBtnHovered: { opacity: 0.85 },
  ctaText: { fontFamily: fonts.sansBold, fontSize: 13.5, color: colors.accentText },

  comingSoonPill: {
    backgroundColor: colors.accentSoft,
    borderRadius: radius.pill,
    paddingVertical: 10,
    paddingHorizontal: 18,
    minWidth: 190,
    alignItems: 'center',
  },
  comingSoonText: { fontFamily: fonts.sansSemiBold, fontSize: 13, color: colors.accent },
});
