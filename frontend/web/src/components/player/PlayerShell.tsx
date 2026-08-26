import { ReactElement, ReactNode, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Link, router, usePathname } from 'expo-router';
import { colors, fonts, radius } from '@kicko/shared';
import { LogoMark } from '../Logo';
import { supabase } from '@kicko/shared';
import { BookingsIcon, HomeIcon, ManagersIcon, OpenSessionsIcon, SearchIcon, SettingsIcon, SidebarToggleIcon } from '../owner/icons';
import { BreadcrumbProvider, useBreadcrumbOverride } from '../../lib/breadcrumbContext';
import { NotifBell } from '../NotifBell';
import { useIsMobile } from '../../lib/useIsMobile';
import { MobileTabBar, MOBILE_TAB_BAR_HEIGHT } from '../MobileTabBar';
import { MobileAccountMenu } from '../MobileAccountMenu';
import { Avatar } from '../Avatar';

type NavItem = { label: string; href: string; icon: (p: { size?: number; color: string }) => ReactElement };

const OVERVIEW_ITEMS: NavItem[] = [
  { label: 'Home', href: '/player', icon: HomeIcon },
  { label: 'Explore', href: '/player/explore', icon: SearchIcon },
];
const ACTIVITY_ITEMS: NavItem[] = [
  { label: 'Bookings', href: '/player/bookings', icon: BookingsIcon },
  { label: 'Open Sessions', href: '/player/sessions', icon: OpenSessionsIcon },
  { label: 'Teams', href: '/player/teams', icon: ManagersIcon },
];

type Crumb = { label: string; href?: string };

const BREADCRUMBS: Record<string, Crumb[]> = {
  '/player': [{ label: 'Home' }],
  '/player/explore': [{ label: 'Home', href: '/player' }, { label: 'Explore' }],
  '/player/bookings': [{ label: 'Home', href: '/player' }, { label: 'Bookings' }],
  '/player/sessions': [{ label: 'Home', href: '/player' }, { label: 'Open Sessions' }],
  '/player/teams': [{ label: 'Home', href: '/player' }, { label: 'Teams' }],
  '/player/settings': [{ label: 'Home', href: '/player' }, { label: 'Settings' }],
};

// A match session detail page isn't itself a nav item — its breadcrumb
// falls back to whichever list would have led you there (Open Sessions if
// you got there by browsing, Bookings otherwise); either is a reasonable
// "back" target so this doesn't need to track which one you actually used.
function breadcrumbFor(pathname: string): Crumb[] {
  if (BREADCRUMBS[pathname]) return BREADCRUMBS[pathname];
  if (pathname.startsWith('/player/explore/')) {
    return [{ label: 'Home', href: '/player' }, { label: 'Explore', href: '/player/explore' }, { label: 'Venue' }];
  }
  if (pathname.startsWith('/player/sessions/')) {
    return [{ label: 'Home', href: '/player' }, { label: 'Open Sessions', href: '/player/sessions' }, { label: 'Match session' }];
  }
  if (pathname.startsWith('/player/bookings/')) {
    return [{ label: 'Home', href: '/player' }, { label: 'Bookings', href: '/player/bookings' }, { label: 'Booking' }];
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
  if (href === '/player') return pathname === '/player';
  // A session detail page (/player/sessions/:id) naturally highlights
  // "Open Sessions" via the startsWith('/player/sessions') prefix match
  // below — no special-casing needed now that it's a real nav item.
  return pathname.startsWith(href);
}

function NavLink({ item, active, collapsed }: { item: NavItem; active: boolean; collapsed: boolean }) {
  const [hovered, setHovered] = useState(false);
  const Icon = item.icon;
  const iconColor = active ? colors.accentText : hovered ? colors.text : colors.textSoft;
  return (
    <Link href={item.href} asChild>
      <Pressable onHoverIn={() => setHovered(true)} onHoverOut={() => setHovered(false)}>
        <View style={[styles.navItem, active && styles.navItemActive, collapsed && styles.navItemCollapsed]}>
          {active && !collapsed && <View style={styles.activeBar} />}
          <View style={[styles.navIconWrap, active && styles.navIconWrapActive]}>
            <Icon size={17} color={iconColor} />
          </View>
          {!collapsed && (
            <Text style={[styles.navText, (active || hovered) && styles.navTextHot, active && styles.navTextActive]}>{item.label}</Text>
          )}
        </View>
      </Pressable>
    </Link>
  );
}


// Shared sidebar shell for every /player/* screen. Ported to match
// Kicko/docs/player.html + explore*.html's chrome — Home/Explore/Bookings
// nav, search box, notif bell, user chip.
const SIDEBAR_STORAGE_KEY = 'kicko-sidebar';

export function PlayerShell({
  userName,
  avatarUrl,
  children,
}: {
  userName: string;
  avatarUrl?: string | null;
  children: ReactNode;
}) {
  return (
    <BreadcrumbProvider>
      <PlayerShellInner userName={userName} avatarUrl={avatarUrl}>
        {children}
      </PlayerShellInner>
    </BreadcrumbProvider>
  );
}

// Split out so it can consume the BreadcrumbProvider its own parent renders
// above it — a component can't read a context it provides in the same pass.
function PlayerShellInner({
  userName,
  avatarUrl,
  children,
}: {
  userName: string;
  avatarUrl?: string | null;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const crumbs = useBreadcrumbOverride(pathname) ?? breadcrumbFor(pathname);
  const settingsActive = isActive(pathname, '/player/settings');
  const isMobile = useIsMobile();
  const [collapsed, setCollapsed] = useState(
    () => typeof window !== 'undefined' && localStorage.getItem(SIDEBAR_STORAGE_KEY) === 'collapsed'
  );

  function toggleSidebar() {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem(SIDEBAR_STORAGE_KEY, next ? 'collapsed' : 'expanded');
      return next;
    });
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.replace('/sign-in?role=player');
  }

  return (
    <View style={styles.root}>
      {!isMobile && (
      <View style={[styles.sidebar, collapsed && styles.sidebarCollapsed]}>
        <Link href="/" asChild>
          <Pressable style={collapsed ? { ...styles.logoBlock, ...styles.logoBlockCollapsed } : styles.logoBlock}>
            <View style={styles.logoRow}>
              <LogoMark size={20} />
              {!collapsed && (
                <Text style={styles.logoText}>
                  Kick<Text style={{ color: colors.accent }}>o</Text>
                </Text>
              )}
            </View>
            {!collapsed && <Text style={styles.roleTag}>Player access</Text>}
          </Pressable>
        </Link>

        <ScrollView style={styles.navScroll} showsVerticalScrollIndicator={false}>
          {!collapsed && <Text style={styles.navLabel}>Overview</Text>}
          <View style={styles.navList}>
            {OVERVIEW_ITEMS.map((item) => (
              <NavLink key={item.href} item={item} active={isActive(pathname, item.href)} collapsed={collapsed} />
            ))}
          </View>

          {!collapsed && <Text style={[styles.navLabel, { marginTop: 14 }]}>Activity</Text>}
          <View style={styles.navList}>
            {ACTIVITY_ITEMS.map((item) => (
              <NavLink key={item.href} item={item} active={isActive(pathname, item.href)} collapsed={collapsed} />
            ))}
          </View>
        </ScrollView>

        {!collapsed && (
          <View style={styles.sidebarFoot}>
            <Link href="/player/settings" asChild>
              <Pressable>
                <View style={[styles.footLink, settingsActive && styles.navItemActive]}>
                  <Text style={[styles.footLinkText, settingsActive && styles.navTextActive]}>Settings</Text>
                </View>
              </Pressable>
            </Link>
            <Text style={styles.footLinkStatic}>Help Center</Text>
            <Text style={styles.footLinkStatic}>Documentation</Text>
          </View>
        )}
      </View>
      )}

      <View style={styles.mainContent}>
        <View style={styles.topbar}>
          <View style={styles.topbarLeft}>
            {!isMobile && (
              <Pressable onPress={toggleSidebar} style={styles.sidebarToggleBtn}>
                <View style={collapsed ? styles.sidebarToggleIconRotated : undefined}>
                  <SidebarToggleIcon size={16} color={colors.textSoft} />
                </View>
              </Pressable>
            )}
            {isMobile ? (
              <Text style={styles.crumbCurrent}>{crumbs[crumbs.length - 1]?.label}</Text>
            ) : (
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
            )}
          </View>

          <View style={styles.topbarActions}>
            <NotifBell />
            {isMobile ? (
              <MobileAccountMenu
                userName={userName}
                avatarUrl={avatarUrl}
                roleLabel="Player"
                items={[{ label: 'Settings', href: '/player/settings' }, { label: 'Help Center' }, { label: 'Documentation' }]}
                onSignOut={handleSignOut}
              />
            ) : (
              <>
                <View style={styles.userChip}>
                  <Avatar name={userName} avatarUrl={avatarUrl} />
                  <View>
                    <Text style={styles.userName}>{userName.split(' ')[0]}</Text>
                    <Text style={styles.userRole}>Player</Text>
                  </View>
                </View>
                <Pressable onPress={handleSignOut}>
                  <Text style={styles.signOutText}>Sign out</Text>
                </Pressable>
              </>
            )}
          </View>
        </View>

        <ScrollView
          style={styles.content}
          contentContainerStyle={isMobile ? [styles.contentInner, styles.contentInnerMobile] : styles.contentInner}
        >
          {children}
        </ScrollView>
      </View>

      {isMobile && (
        <MobileTabBar
          items={[...OVERVIEW_ITEMS, ...ACTIVITY_ITEMS]}
          isActive={(href) => isActive(pathname, href)}
        />
      )}
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
  sidebarCollapsed: { width: 76, paddingHorizontal: 10 },
  logoBlock: { paddingHorizontal: 10, paddingVertical: 9, marginBottom: 18, borderBottomWidth: 1, borderBottomColor: colors.border },
  logoBlockCollapsed: { alignItems: 'center', paddingHorizontal: 2 },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  logoText: { fontFamily: fonts.serif, fontSize: 18, color: colors.text, letterSpacing: -0.5 },
  roleTag: { fontFamily: fonts.sansBold, fontSize: 11, color: colors.textSoft, letterSpacing: 0.5, marginTop: 3 },

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
  navItemCollapsed: { justifyContent: 'center', paddingVertical: 10, paddingHorizontal: 8, gap: 0 },
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
  topbarLeft: { flexDirection: 'row', alignItems: 'center', gap: 14, minWidth: 0 },
  sidebarToggleBtn: {
    width: 32,
    height: 32,
    borderRadius: 9,
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sidebarToggleIconRotated: { transform: [{ rotate: '180deg' }] },
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
  contentInnerMobile: { padding: 18, paddingBottom: 90 + MOBILE_TAB_BAR_HEIGHT },
});
