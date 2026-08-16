import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Link } from 'expo-router';
import { colors, fonts } from '@kicko/shared';
import { Logo } from './Logo';

// Public-facing top nav for web-only pages reached before signing in (see
// Kicko/docs/sign-in.html's <nav> — logo + a couple of top-level links).
// Mobile has no equivalent; there's no browser chrome to echo there.
export function WebNav() {
  return (
    <View style={styles.nav}>
      <Link href="/" asChild>
        <Pressable>
          <Logo />
        </Pressable>
      </Link>
      <View style={styles.links}>
        <Text style={styles.link}>Venues</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  nav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    maxWidth: 1160,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: 24,
    paddingTop: 28,
  },
  links: { flexDirection: 'row', gap: 28 },
  link: { fontFamily: fonts.sans, fontSize: 14, color: colors.textSoft },
});
