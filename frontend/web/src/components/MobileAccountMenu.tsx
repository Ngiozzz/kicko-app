import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Link } from 'expo-router';
import { colors, fonts, radius } from '@kicko/shared';
import { useClickOutside } from '../lib/useClickOutside';
import { Avatar } from './Avatar';

export type AccountMenuItem = { label: string; href?: string };

// Mobile replacement for each shell's sidebar footer (Settings/Help
// Center/Documentation, plus — on OwnerShell — the Managers nav item that
// doesn't fit a 4-slot bottom tab bar). A tap on the avatar opens this
// panel; items with an `href` navigate, items without render as static
// text (matching each shell's existing non-navigable "Help Center" /
// "Documentation" footer rows).
export function MobileAccountMenu({
  userName,
  avatarUrl,
  roleLabel,
  items,
  onSignOut,
}: {
  userName: string;
  avatarUrl?: string | null;
  roleLabel: string;
  items: AccountMenuItem[];
  onSignOut: () => void;
}) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);
  const ref = useClickOutside<HTMLDivElement>(open, close);

  return (
    <View style={styles.wrap} ref={ref as any}>
      <Pressable onPress={() => setOpen((v) => !v)}>
        <Avatar name={userName} avatarUrl={avatarUrl} />
      </Pressable>

      {open && (
        <View style={styles.panel}>
          <View style={styles.panelHead}>
            <Text style={styles.panelName}>{userName}</Text>
            <Text style={styles.panelRole}>{roleLabel}</Text>
          </View>

          {items.map((item) =>
            item.href ? (
              <Link key={item.label} href={item.href} asChild>
                <Pressable style={styles.menuItem} onPress={close}>
                  <Text style={styles.menuItemText}>{item.label}</Text>
                </Pressable>
              </Link>
            ) : (
              <Text key={item.label} style={styles.menuItemStatic}>
                {item.label}
              </Text>
            )
          )}

          <Pressable
            style={styles.menuItem}
            onPress={() => {
              close();
              onSignOut();
            }}
          >
            <Text style={styles.menuItemText}>Sign out</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'relative' },
  avatar: { width: 30, height: 30, borderRadius: 15, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontFamily: fonts.serif, fontSize: 13, color: colors.accentText },
  panel: {
    position: 'absolute',
    top: 40,
    right: 0,
    minWidth: 190,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingVertical: 8,
    zIndex: 50,
    boxShadow: '0 12px 30px rgba(0,0,0,0.28)',
  } as any,
  panelHead: { paddingHorizontal: 14, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.border, marginBottom: 4 },
  panelName: { fontFamily: fonts.sansSemiBold, fontSize: 13, color: colors.text },
  panelRole: { fontFamily: fonts.sans, fontSize: 11.5, color: colors.textSoft, marginTop: 1 },
  menuItem: { paddingHorizontal: 14, paddingVertical: 9 },
  menuItemText: { fontFamily: fonts.sansSemiBold, fontSize: 13.5, color: colors.textSoft },
  menuItemStatic: { fontFamily: fonts.sansSemiBold, fontSize: 13.5, color: colors.textSoft, opacity: 0.6, paddingHorizontal: 14, paddingVertical: 9 },
});
