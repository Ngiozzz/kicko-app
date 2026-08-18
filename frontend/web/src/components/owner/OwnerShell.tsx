import { ReactElement, ReactNode, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Link, router, usePathname } from 'expo-router';
import { colors, fonts, radius } from '@kicko/shared';
import { LogoMark } from '../Logo';
import { supabase } from '@kicko/shared';
import { BookingsIcon, HomeIcon, ManagersIcon, PaymentsIcon, SearchIcon, VenuesIcon } from './icons';
import { BreadcrumbProvider, useBreadcrumbOverride } from '../../lib/breadcrumbContext';
import { NotifBell } from '../NotifBell';

type NavItem = { label: string; href: string; icon: (p: { size?: number; color: string }) => ReactElement };

const OVERVIEW_ITEMS: NavItem[] = [
  { label: 'Home', href: '/owner', icon: HomeIcon },
  { label: 'Venues', href: '/owner/venues', icon: VenuesIcon },
  { label: 'Bookings', href: '/owner/bookings', icon: BookingsIcon },
  { label: 'Payments', href: '/owner/payments', icon: PaymentsIcon },
];
const TEAM_ITEMS: NavItem[] = [{ label: 'Managers', href: '/owner/managers', icon: ManagersIcon }];

// Breadcrumb per route — mirrors Kicko/docs' per-page <div class="breadcrumb">,
// where every segment except the current page is a real <a href>, not just
// styled text.
type Crumb = { label: string; href?: string };

const BREADCRUMBS: Record<string, Crumb[]> = {
  '/owner': [{ label: 'Home' }],
  '/owner/venues': [{ label: 'Home', href: '/owner' }, { label: 'My Venues' }],
  '/owner/venues/new': [{ label: 'Home', href: '/owner' }, { label: 'My Venues', href: '/owner/venues' }, { label: 'Add venue' }],
  '/owner/bookings': [{ label: 'Home', href: '/owner' }, { label: 'Bookings' }],
  '/owner/payments': [{ label: 'Home', href: '/owner' }, { label: 'Payments' }],
  '/owner/managers': [{ label: 'Home', href: '/owner' }, { label: 'Managers' }],
  '/owner/settings': [{ label: 'Home', href: '/owner' }, { label: 'Settings' }],
};

// Static fallback — each venues/[id]/* page overrides its own crumb with
// the venue's actual name once it loads (see useBreadcrumb in
// venues/[id]/index.tsx, reviews.tsx, and edit.tsx).
function breadcrumbFor(pathname: string): Crumb[] {
  if (BREADCRUMBS[pathname]) return BREADCRUMBS[pathname];
  if (pathname.match(/^\/owner\/venues\/[^/]+\/reviews$/)) {
    return [{ label: 'Home', href: '/owner' }, { label: 'My Venues', href: '/owner/venues' }, { label: 'Venue' }, { label: 'Reviews' }];
  }
  if (pathname.match(/^\/owner\/venues\/[^/]+\/edit$/)) {
    return [{ label: 'Home', href: '/owner' }, { label: 'My Venues', href: '/owner/venues' }, { label: 'Venue' }, { label: 'Edit venue' }];
  }
  if (pathname.startsWith('/owner/venues/')) {
    return [{ label: 'Home', href: '/owner' }, { label: 'My Venues', href: '/owner/venues' }, { label: 'Venue' }];
  }
  return [{ label: 'Home' }];
}

function CrumbLink({ href, label }: { href: string; label: string }) {
  const [hovered, setHovered] = useState(false);
  return (
    <Link href={href} asChild>
      <Pressable onHoverIn={() => setHovered(true)} onHoverOut={() => setHovered(false)}>
        <Text style={[styles.crumbLink, hovered && styles.crumbLinkHovered]}>{label}</Text>
      </Pressable>
    </Link>
  );
}

function isActive(pathname: string, href: string) {
  return href === '/owner' ? pathname === '/owner' : pathname.startsWith(href);
}

function NavLink({ item, active }: { item: NavItem; active: boolean }) {
  const [hovered, setHovered] = useState(false);
  const Icon = item.icon;
  const iconColor = active ? colors.accentText : hovered ? colors.text : colors.textSoft;
  return (
    <Link href={item.href} asChild>
      <Pressable onHoverIn={() => setHovered(true)} onHoverOut={() => setHovered(false)}>
        <View style={[styles.navItem, active && styles.navItemActive]}>
          {active && <View style={styles.activeBar} />}
          <View style={[styles.navIconWrap, active && styles.navIconWrapActive]}>
            <Icon size={17} color={iconColor} />
          </View>
          <Text style={[styles.navText, (active || hovered) && styles.navTextHot, active && styles.navTextActive]}>{item.label}</Text>
        </View>
      </Pressable>
    </Link>
  );
}

// Shared sidebar shell for every /owner/* screen — see app/owner/_layout.tsx,
// which handles the auth/role gate once and wraps all children in this.
// Ported to match Kicko/docs/owner*.html's chrome (sidebar + topbar) —
// same structure, honest data where the mockup used placeholder numbers.
export function OwnerShell({ userName, children }: { userName: string; children: ReactNode }) {
  return (
    <BreadcrumbProvider>
      <OwnerShellInner userName={userName}>{children}</OwnerShellInner>
    </BreadcrumbProvider>
  );
}

// Split out so it can consume the BreadcrumbProvider its own parent renders
// above it — a component can't read a context it provides in the same pass.
function OwnerShellInner({ userName, children }: { userName: string; children: ReactNode }) {
  const pathname = usePathname();
  const crumbs = useBreadcrumbOverride(pathname) ?? breadcrumbFor(pathname);
  const settingsActive = isActive(pathname, '/owner/settings');

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.replace('/sign-in?role=owner');
  }

  return (
    <View style={styles.root}>
      <View style={styles.sidebar}>
        <Link href="/" asChild>
          <Pressable style={styles.logoBlock}>
            <View style={styles.logoRow}>
              <LogoMark size={20} />
              <Text style={styles.logoText}>
                Kick<Text style={{ color: colors.accent }}>o</Text>
              </Text>
            </View>
            <Text style={styles.roleTag}>Owner access</Text>
          </Pressable>
        </Link>

        <View style={styles.searchBox}>
          <SearchIcon size={15} color={colors.textSoft} />
          <TextInput placeholder="Search your venues…" placeholderTextColor={colors.textSoft} style={styles.searchInput} />
        </View>

        <ScrollView style={styles.navScroll} showsVerticalScrollIndicator={false}>
          <Text style={styles.navLabel}>Overview</Text>
          <View style={styles.navList}>
            {OVERVIEW_ITEMS.map((item) => (
              <NavLink key={item.href} item={item} active={isActive(pathname, item.href)} />
            ))}
          </View>

          <Text style={[styles.navLabel, { marginTop: 14 }]}>Team</Text>
          <View style={styles.navList}>
            {TEAM_ITEMS.map((item) => (
              <NavLink key={item.href} item={item} active={isActive(pathname, item.href)} />
            ))}
          </View>
        </ScrollView>

        <View style={styles.sidebarFoot}>
          <Link href="/owner/settings" asChild>
            <Pressable>
              <View style={[styles.footLink, settingsActive && styles.navItemActive]}>
                <Text style={[styles.footLinkText, settingsActive && styles.navTextActive]}>Settings</Text>
              </View>
            </Pressable>
          </Link>
          <Text style={styles.footLinkStatic}>Help Center</Text>
          <Text style={styles.footLinkStatic}>Documentation</Text>
        </View>
      </View>

      <View style={styles.mainContent}>
        <View style={styles.topbar}>
          <View style={styles.breadcrumb}>
            {crumbs.map((c, i) => {
              const isCurrent = i === crumbs.length - 1;
              return (
                <View key={c.label + i} style={styles.crumbGroup}>
                  {i > 0 && <Text style={styles.crumbSep}>/</Text>}
                  {isCurrent || !c.href ? (
                    <Text style={isCurrent ? styles.crumbCurrent : styles.crumbLink}>{c.label}</Text>
                  ) : (
                    <CrumbLink href={c.href} label={c.label} />
                  )}
                </View>
              );
            })}
          </View>

          <View style={styles.topbarActions}>
            <NotifBell />
            <Link href="/owner/settings" asChild>
              <Pressable style={styles.userChip}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{userName.charAt(0).toUpperCase()}</Text>
                </View>
                <View>
                  <Text style={styles.userName}>{userName.split(' ')[0]}</Text>
                  <Text style={styles.userRole}>Owner</Text>
                </View>
              </Pressable>
            </Link>
            <Pressable onPress={handleSignOut}>
              <Text style={styles.signOutText}>Sign out</Text>
            </Pressable>
          </View>
        </View>

        <ScrollView style={styles.content} contentContainerStyle={styles.contentInner}>
          {children}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, flexDirection: 'row', minHeight: '100%', backgroundColor: colors.bg },

  sidebar: {
    width: 248,
    borderRightWidth: 1,
    borderRightColor: colors.border,
    backgroundColor: colors.surface,
    paddingVertical: 20,
    paddingHorizontal: 14,
  },
  logoBlock: { paddingHorizontal: 10, paddingVertical: 9, marginBottom: 18, borderBottomWidth: 1, borderBottomColor: colors.border },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  logoText: { fontFamily: fonts.serif, fontSize: 18, color: colors.text, letterSpacing: -0.5 },
  roleTag: { fontFamily: fonts.sansBold, fontSize: 11, color: colors.textSoft, letterSpacing: 0.5, marginTop: 3 },

  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 18,
  },
  searchInput: { flex: 1, fontFamily: fonts.sans, fontSize: 13, color: colors.text, outlineStyle: 'none' } as any,

  navScroll: { flex: 1 },
  navLabel: {
    fontFamily: fonts.sansBold,
    fontSize: 10.5,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    color: colors.textSoft,
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  navList: { gap: 3 },
  navItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8, paddingHorizontal: 12, borderRadius: radius.md, position: 'relative' },
  navItemActive: { backgroundColor: colors.accentSoft },
  activeBar: { position: 'absolute', left: -14, top: '50%', marginTop: -9, width: 3, height: 18, borderRadius: 4, backgroundColor: colors.accent },
  navIconWrap: {
    width: 30,
    height: 30,
    borderRadius: radius.sm,
    backgroundColor: colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navIconWrapActive: { backgroundColor: colors.accent },
  navText: { fontFamily: fonts.sansSemiBold, fontSize: 14, color: colors.textSoft },
  navTextHot: { color: colors.text },
  navTextActive: { color: colors.accent, fontFamily: fonts.sansBold },

  sidebarFoot: { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 14, gap: 2 },
  footLink: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: radius.md },
  footLinkText: { fontFamily: fonts.sansSemiBold, fontSize: 13.5, color: colors.textSoft },
  footLinkStatic: { fontFamily: fonts.sansSemiBold, fontSize: 13.5, color: colors.textSoft, opacity: 0.6, paddingVertical: 8, paddingHorizontal: 12 },

  mainContent: { flex: 1, minWidth: 0 },
  topbar: {
    position: 'sticky' as any,
    top: 0,
    zIndex: 30,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingVertical: 16,
    paddingHorizontal: 28,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },
  breadcrumb: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  crumbGroup: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  crumbSep: { fontSize: 13, color: colors.textSoft, opacity: 0.5 },
  crumbLink: { fontFamily: fonts.sansMedium, fontSize: 13.5, color: colors.textSoft },
  crumbLinkHovered: { color: colors.accent },
  crumbCurrent: { fontFamily: fonts.serifMedium, fontSize: 15, color: colors.text },

  topbarActions: { flexDirection: 'row', alignItems: 'center', gap: 14 },

  userChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 6,
    paddingRight: 12,
    paddingLeft: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  avatar: { width: 30, height: 30, borderRadius: 15, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontFamily: fonts.serif, fontSize: 13, color: colors.accentText },
  userName: { fontFamily: fonts.sansSemiBold, fontSize: 13, color: colors.text, lineHeight: 16 },
  userRole: { fontFamily: fonts.sans, fontSize: 11, color: colors.textSoft, lineHeight: 14 },
  signOutText: { fontFamily: fonts.sansMedium, fontSize: 13, color: colors.textSoft },

  content: { flex: 1 },
  contentInner: { maxWidth: 1280, width: '100%', alignSelf: 'center', padding: 32, paddingBottom: 90, flexGrow: 1 },
});
