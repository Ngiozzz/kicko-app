import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Link } from 'expo-router';
import { colors, fonts } from '@kicko/shared';
import { Logo } from './Logo';

const SECTIONS: { id: string; label: string }[] = [
  { id: 'players', label: 'For players' },
  { id: 'owners', label: 'For owners' },
  { id: 'managers', label: 'For managers' },
];

function scrollToSection(id: string) {
  if (Platform.OS !== 'web') return;
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// Public nav for the landing page (see app/index.tsx) — logo, three
// anchor links (one per role section on that page), and a sign-in CTA.
// Deliberately no "sign up" here: only owners can self-register, and
// that CTA lives inside the owners section itself.
export function WebNav() {
  return (
    <View style={styles.nav}>
      <Link href="/" asChild>
        <Pressable>
          <Logo />
        </Pressable>
      </Link>
      <View style={styles.links}>
        {SECTIONS.map((s) => (
          <Pressable key={s.id} onPress={() => scrollToSection(s.id)}>
            <Text style={styles.link}>{s.label}</Text>
          </Pressable>
        ))}
      </View>
      <Link href="/sign-in" asChild>
        <Pressable style={styles.signInBtn}>
          <Text style={styles.signInText}>Sign in</Text>
        </Pressable>
      </Link>
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
    paddingVertical: 20,
  },
  links: { flexDirection: 'row', gap: 28 },
  link: { fontFamily: fonts.sansMedium, fontSize: 14, color: colors.textSoft },
  signInBtn: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 999,
    paddingVertical: 9,
    paddingHorizontal: 20,
  },
  signInText: { fontFamily: fonts.sansBold, fontSize: 13.5, color: colors.text },
});
