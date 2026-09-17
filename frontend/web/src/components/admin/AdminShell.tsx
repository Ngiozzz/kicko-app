import { ReactElement, ReactNode, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Link, router, usePathname } from 'expo-router';
import { colors, fonts, radius } from '@kicko/shared';
import { LogoMark } from '../Logo';
import { supabase } from '@kicko/shared';
import {
  ClockIcon,
  EmailIcon,
  FeesIcon,
  FinanceIcon,
  HomeIcon,
  LogsIcon,
  ManagersIcon,
  PaymentsIcon,
  ProfileIcon,
  RefundIcon,
  VenuesIcon,
} from '../owner/icons';
import { BreadcrumbProvider, useBreadcrumbOverride } from '../../lib/breadcrumbContext';
import { NotifBell } from '../NotifBell';
import { useIsMobile } from '../../lib/useIsMobile';
import { MobileTabBar, MOBILE_TAB_BAR_HEIGHT } from '../MobileTabBar';
import { MobileAccountMenu } from '../MobileAccountMenu';
import { Avatar } from '../Avatar';
import { useAdminRole } from '../../lib/adminRoleContext';

type NavItem = { label: string; href: string; icon: (p: { size?: number; color: string }) => ReactElement };

const OVERVIEW_ITEMS: NavItem[] = [{ label: 'Dashboard', href: '/admin-dashboard', icon: HomeIcon }];
const MANAGE_ITEMS: NavItem[] = [
  { label: 'Users', href: '/admin-dashboard/users', icon: ManagersIcon },
  { label: 'Venues', href: '/admin-dashboard/venues', icon: VenuesIcon },
  { label: 'Payments', href: '/admin-dashboard/payments', icon: PaymentsIcon },
];
// ceo-only — see admin.controller.ts#getFinanceOverview. Kept separate
// from MANAGE_ITEMS so a plain admin never sees the link at all, not just
// gets a 403 if they guess the URL (finance.tsx guards that case too).
const CEO_ITEMS: NavItem[] = [{ label: 'Finance', href: '/admin-dashboard/finance', icon: FinanceIcon }];
// Every /admin-dashboard/settings/* screen, promoted from the old single
// "Settings" footer link into its own sidebar group — settings/index.tsx
// (the "Go to" list these used to live behind) still exists as the
// landing page for /admin-dashboard/settings itself, and is still what
// the mobile account menu's Settings entry opens.
const SETTINGS_ITEMS: NavItem[] = [
  { label: 'Profile', href: '/admin-dashboard/settings/role', icon: ProfileIcon },
  { label: 'Service fees', href: '/admin-dashboard/settings/fees', icon: FeesIcon },
  { label: 'Cancellation refunds', href: '/admin-dashboard/settings/refunds', icon: RefundIcon },
  { label: 'Match windows', href: '/admin-dashboard/settings/windows', icon: ClockIcon },
  { label: 'Email templates', href: '/admin-dashboard/settings/emails', icon: EmailIcon },
  { label: 'Server logs', href: '/admin-dashboard/settings/logs', icon: LogsIcon },
];

// Same breadcrumb-as-real-links convention as OwnerShell — see
// Kicko/docs/admin.html / users.html / venues.html's chrome.
type Crumb = { label: string; href?: string };

const BREADCRUMBS: Record<string, Crumb[]> = {
  '/admin-dashboard': [{ label: 'Dashboard' }],
  '/admin-dashboard/users': [{ label: 'Dashboard', href: '/admin-dashboard' }, { label: 'Users' }],
  '/admin-dashboard/venues': [{ label: 'Dashboard', href: '/admin-dashboard' }, { label: 'Venues' }],
  '/admin-dashboard/payments': [{ label: 'Dashboard', href: '/admin-dashboard' }, { label: 'Payments' }],
  '/admin-dashboard/finance': [{ label: 'Dashboard', href: '/admin-dashboard' }, { label: 'Finance' }],
  '/admin-dashboard/finance/venues': [
    { label: 'Dashboard', href: '/admin-dashboard' },
    { label: 'Finance', href: '/admin-dashboard/finance' },
    { label: 'Revenue by venue' },
  ],
  '/admin-dashboard/payments/transactions': [
    { label: 'Dashboard', href: '/admin-dashboard' },
    { label: 'Payments', href: '/admin-dashboard/payments' },
    { label: 'Transactions' },
  ],
  '/admin-dashboard/payments/reliability': [
    { label: 'Dashboard', href: '/admin-dashboard' },
    { label: 'Payments', href: '/admin-dashboard/payments' },
    { label: 'M-Pesa STK push reliability' },
  ],
  '/admin-dashboard/payments/sessions': [
    { label: 'Dashboard', href: '/admin-dashboard' },
    { label: 'Payments', href: '/admin-dashboard/payments' },
    { label: 'Match sessions' },
  ],
  '/admin-dashboard/settings': [{ label: 'Dashboard', href: '/admin-dashboard' }, { label: 'Settings' }],
  '/admin-dashboard/settings/role': [
    { label: 'Dashboard', href: '/admin-dashboard' },
    { label: 'Settings', href: '/admin-dashboard/settings' },
    { label: 'Profile' },
  ],
  '/admin-dashboard/settings/fees': [
    { label: 'Dashboard', href: '/admin-dashboard' },
    { label: 'Settings', href: '/admin-dashboard/settings' },
    { label: 'Service fees' },
  ],
  '/admin-dashboard/settings/refunds': [
    { label: 'Dashboard', href: '/admin-dashboard' },
    { label: 'Settings', href: '/admin-dashboard/settings' },
    { label: 'Cancellation refunds' },
  ],
  '/admin-dashboard/settings/windows': [
    { label: 'Dashboard', href: '/admin-dashboard' },
    { label: 'Settings', href: '/admin-dashboard/settings' },
    { label: 'Match windows' },
  ],
  '/admin-dashboard/settings/emails': [
    { label: 'Dashboard', href: '/admin-dashboard' },
    { label: 'Settings', href: '/admin-dashboard/settings' },
    { label: 'Email templates' },
  ],
  '/admin-dashboard/settings/emails/guide': [
    { label: 'Dashboard', href: '/admin-dashboard' },
    { label: 'Settings', href: '/admin-dashboard/settings' },
    { label: 'Email templates', href: '/admin-dashboard/settings/emails' },
    { label: 'Design guide' },
  ],
};

// Static fallback — the venue detail page overrides its own crumb with the
// venue's actual name once it loads (see useBreadcrumb in venues/[id].tsx).
function breadcrumbFor(pathname: string): Crumb[] {
  if (BREADCRUMBS[pathname]) return BREADCRUMBS[pathname];
  if (pathname.startsWith('/admin-dashboard/venues/')) {
    return [{ label: 'Dashboard', href: '/admin-dashboard' }, { label: 'Venues', href: '/admin-dashboard/venues' }, { label: 'Venue' }];
  }
  if (pathname.startsWith('/admin-dashboard/settings/emails/')) {
    return [
      { label: 'Dashboard', href: '/admin-dashboard' },
      { label: 'Settings', href: '/admin-dashboard/settings' },
      { label: 'Email templates', href: '/admin-dashboard/settings/emails' },
      { label: 'Edit template' },
    ];
  }
  return [{ label: 'Dashboard' }];
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
  return href === '/admin-dashboard' ? pathname === '/admin-dashboard' : pathname.startsWith(href);
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

// Shared sidebar shell for every /admin-dashboard/* screen — see
// app/admin-dashboard/_layout.tsx. Ported from Kicko/docs' admin.html /
// users.html / venues.html chrome, same structure as OwnerShell.
export function AdminShell({
  userName,
  avatarUrl,
  roleLabel = 'Admin',
  children,
}: {
  userName: string;
  avatarUrl?: string | null;
  // 'CEO' for a ceo-role account, 'Admin' otherwise — see
  // admin-dashboard/_layout.tsx. Purely a display label; access is
  // identical either way (see admin.controller.ts#requireAdmin).
  roleLabel?: string;
  children: ReactNode;
}) {
  return (
    <BreadcrumbProvider>
      <AdminShellInner userName={userName} avatarUrl={avatarUrl} roleLabel={roleLabel}>
        {children}
      </AdminShellInner>
    </BreadcrumbProvider>
  );
}

// Split out so it can consume the BreadcrumbProvider its own parent renders
// above it — a component can't read a context it provides in the same pass.
function AdminShellInner({
  userName,
  avatarUrl,
  roleLabel,
  children,
}: {
  userName: string;
  avatarUrl?: string | null;
  roleLabel: string;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const crumbs = useBreadcrumbOverride(pathname) ?? breadcrumbFor(pathname);
  const isMobile = useIsMobile();
  const role = useAdminRole();
  const isCeo = role === 'ceo';

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.replace('/admin');
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
            <Text style={styles.roleTag}>{roleLabel} access</Text>
          </Pressable>
        </Link>

        <ScrollView style={styles.navScroll} showsVerticalScrollIndicator={false}>
          <Text style={styles.navLabel}>Overview</Text>
          <View style={styles.navList}>
            {OVERVIEW_ITEMS.map((item) => (
              <NavLink key={item.href} item={item} active={isActive(pathname, item.href)} />
            ))}
          </View>

          <Text style={[styles.navLabel, { marginTop: 14 }]}>Manage</Text>
          <View style={styles.navList}>
            {MANAGE_ITEMS.map((item) => (
              <NavLink key={item.href} item={item} active={isActive(pathname, item.href)} />
            ))}
          </View>

          {isCeo && (
            <>
              <Text style={[styles.navLabel, { marginTop: 14 }]}>Business</Text>
              <View style={styles.navList}>
                {CEO_ITEMS.map((item) => (
                  <NavLink key={item.href} item={item} active={isActive(pathname, item.href)} />
                ))}
              </View>
            </>
          )}

          <Text style={[styles.navLabel, { marginTop: 14 }]}>Settings</Text>
          <View style={styles.navList}>
            {SETTINGS_ITEMS.map((item) => (
              <NavLink key={item.href} item={item} active={isActive(pathname, item.href)} />
            ))}
          </View>
        </ScrollView>

        <View style={styles.sidebarFoot}>
          <Text style={styles.footLinkStatic}>Help Center</Text>
          <Text style={styles.footLinkStatic}>Documentation</Text>
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
                roleLabel={roleLabel}
                items={[{ label: 'Settings', href: '/admin-dashboard/settings' }, { label: 'Help Center' }, { label: 'Documentation' }]}
                onSignOut={handleSignOut}
              />
            ) : (
              <>
                <Link href="/admin-dashboard/settings" asChild>
                  <Pressable style={styles.userChip}>
                    <Avatar name={userName} avatarUrl={avatarUrl} />
                    <View>
                      <Text style={styles.userName}>{userName.split(' ')[0]}</Text>
                      <Text style={styles.userRole}>{roleLabel}</Text>
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

      {isMobile && (
        <MobileTabBar items={[...OVERVIEW_ITEMS, ...MANAGE_ITEMS, ...(isCeo ? CEO_ITEMS : [])]} isActive={(href) => isActive(pathname, href)} />
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
  contentInnerMobile: { padding: 18, paddingBottom: 90 + MOBILE_TAB_BAR_HEIGHT },
});
