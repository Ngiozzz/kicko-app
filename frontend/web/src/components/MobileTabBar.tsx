import { ReactElement } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Link } from 'expo-router';
import { colors, fonts } from '@kicko/shared';

export type MobileNavItem = { label: string; href: string; icon: (p: { size?: number; color: string }) => ReactElement };

// Height of the bar itself (excludes safe-area padding) — shells add this
// much bottom padding to their content so nothing sits underneath it.
export const MOBILE_TAB_BAR_HEIGHT = 60;

// Sidebar replacement below MOBILE_BREAKPOINT (see useIsMobile.ts). Each
// shell keeps owning its own primary nav-item list and isActive logic and
// just passes them in here.
export function MobileTabBar({ items, isActive }: { items: MobileNavItem[]; isActive: (href: string) => boolean }) {
  return (
    <View style={styles.bar}>
      {items.map((item) => {
        const active = isActive(item.href);
        const Icon = item.icon;
        return (
          <Link key={item.href} href={item.href} asChild>
            <Pressable style={styles.item}>
              <Icon size={20} color={active ? colors.accent : colors.textSoft} />
              <Text style={[styles.label, active && styles.labelActive]}>{item.label}</Text>
            </Pressable>
          </Link>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    position: 'fixed' as any,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 40,
    height: MOBILE_TAB_BAR_HEIGHT,
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  item: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 3 },
  label: { fontFamily: fonts.sansSemiBold, fontSize: 10.5, color: colors.textSoft },
  labelActive: { color: colors.accent },
});
