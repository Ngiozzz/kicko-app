import { Link } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts, radius } from '@kicko/shared';
import { Logo } from './Logo';
import { withRole } from '../lib/withRole';

// Lightweight header for the public (no-login) venue pages
// (app/venues/index.tsx, app/venues/[id].tsx) — WebNav (used on the
// landing page) carries a stateful role-switcher tied to that page's own
// hero/FAQ content, which doesn't fit here, so this is its own small
// component rather than forcing WebNav's props to fit an unrelated page.
// `next` (an in-app path, e.g. the venue detail page the visitor came
// from) is forwarded to sign-in so that after auth they land back
// where they were instead of their role's generic home — see
// resolveNext in roleRoute.ts.
export function PublicVenuesNav({ next }: { next?: string } = {}) {
  return (
    <View style={styles.bar}>
      <View style={styles.row}>
        <Link href="/" asChild>
          <Pressable>
            <Logo />
          </Pressable>
        </Link>
        <View style={styles.actions}>
          <Link href="/venues" style={styles.link}>
            Browse venues
          </Link>
          <Link href={withRole('/sign-in', 'player', next)} asChild>
            <Pressable style={styles.signInBtn}>
              <Text style={styles.signInText}>Sign in</Text>
            </Pressable>
          </Link>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    position: 'sticky' as any,
    top: 0,
    zIndex: 30,
    width: '100%',
    backgroundColor: colors.bg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  row: {
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
  actions: { flexDirection: 'row', alignItems: 'center', gap: 20 },
  link: { fontFamily: fonts.sansBold, fontSize: 13.5, color: colors.text },
  signInBtn: { backgroundColor: colors.accent, borderRadius: radius.pill, paddingVertical: 10, paddingHorizontal: 20 },
  signInText: { fontFamily: fonts.sansBold, fontSize: 13.5, color: colors.accentText },
});
