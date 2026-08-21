import { ReactElement, ReactNode, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Link, router, usePathname } from 'expo-router';
import { colors, fonts, radius } from '@kicko/shared';
import { LogoMark } from '../Logo';
import { supabase } from '@kicko/shared';
import { BookingsIcon, HomeIcon } from '../owner/icons';
import { NotifBell } from '../NotifBell';
import { useIsMobile } from '../../lib/useIsMobile';
import { MobileTabBar, MOBILE_TAB_BAR_HEIGHT } from '../MobileTabBar';
import { MobileAccountMenu } from '../MobileAccountMenu';
import { Avatar } from '../Avatar';

type NavItem = { label: string; href: string; icon: (p: { size?: number; color: string }) => ReactElement };

const NAV_ITEMS: NavItem[] = [
  { label: 'Home', href: '/manager', icon: HomeIcon },
  { label: 'Bookings', href: '/manager/bookings', icon: BookingsIcon },
];

type Crumb = { label: string; href?: string };
const BREADCRUMBS: Record<string, Crumb[]> = {
  '/manager': [{ label: 'Home' }],
  '/manager/bookings': [{ label: 'Home', href: '/manager' }, { label: 'Bookings' }],
  '/manager/settings': [{ label: 'Home', href: '/manager' }, { label: 'Settings' }],
};

function isActive(pathname: string, href: string) {
  return href === '/manager' ? pathname === '/manager' : pathname.startsWith(href);
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

// Shared sidebar shell for every /manager/* screen — deliberately a
// scaled-down sibling of OwnerShell (a manager runs exactly one venue in
// this app's data model, so there's no venue switcher, no "Venues" or
// "Managers" nav section, and no venue search box).
export function ManagerShell({
  userName,
  avatarUrl,
  children,
}: {
  userName: string;
  avatarUrl?: string | null;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const crumbs = BREADCRUMBS[pathname] ?? [{ label: 'Home' }];
  const settingsActive = isActive(pathname, '/manager/settings');
  const isMobile = useIsMobile();

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.replace('/sign-in?role=manager');
  }

  return (
    <View style={styles.root}>
      {!isMobile && (
      <View style={styles.sidebar}>
        <Link href="/" asChild>
          <Pressable style={styles.logoBlock}>
            <View style={styles.logoRow}>
              <LogoMark size={20} />
              <Text style={styles.logoText}>
                Kick<Text style={{ color: colors.accent }}>o</Text>
              </Text>
            </View>
            <Text style={styles.roleTag}>Manager access</Text>
          </Pressable>
        </Link>

        <ScrollView style={styles.navScroll} showsVerticalScrollIndicator={false}>
          <Text style={styles.navLabel}>Overview</Text>
          <View style={styles.navList}>
            {NAV_ITEMS.map((item) => (
              <NavLink key={item.href} item={item} active={isActive(pathname, item.href)} />
            ))}
          </View>
        </ScrollView>

        <View style={styles.sidebarFoot}>
          <Link href="/manager/settings" asChild>
            <Pressable>
              <View style={[styles.footLink, settingsActive && styles.navItemActive]}>
                <Text style={[styles.footLinkText, settingsActive && styles.navTextActive]}>Settings</Text>
              </View>
            </Pressable>
          </Link>
        </View>
      </View>
      )}

      <View style={styles.mainContent}>
        <View style={styles.topbar}>
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

          <View style={styles.topbarActions}>
            <NotifBell />
            {isMobile ? (
              <MobileAccountMenu
                userName={userName}
                avatarUrl={avatarUrl}
                roleLabel="Manager"
                items={[{ label: 'Settings', href: '/manager/settings' }]}
                onSignOut={handleSignOut}
              />
            ) : (
              <>
                <Link href="/manager/settings" asChild>
                  <Pressable style={styles.userChip}>
                    <Avatar name={userName} avatarUrl={avatarUrl} />
                    <View>
                      <Text style={styles.userName}>{userName.split(' ')[0]}</Text>
                      <Text style={styles.userRole}>Manager</Text>
                    </View>
                  </Pressable>
                </Link>
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

      {isMobile && <MobileTabBar items={NAV_ITEMS} isActive={(href) => isActive(pathname, href)} />}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, flexDirection: 'row', minHeight: '100%', backgroundColor: colors.bg },

  sidebar: {
    width: 228,
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
  contentInnerMobile: { padding: 18, paddingBottom: 90 + MOBILE_TAB_BAR_HEIGHT },
});
