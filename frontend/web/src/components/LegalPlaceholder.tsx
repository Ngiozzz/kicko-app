import { StyleSheet, Text, View } from 'react-native';
import { Link } from 'expo-router';
import { colors, fonts } from '@kicko/shared';

// Honest "not written yet" placeholder — deliberately not fabricated
// legal text. Swap this out once real Privacy/Terms copy exists.
export function LegalPlaceholder({ title }: { title: string }) {
  return (
    <View style={styles.root}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.body}>This page hasn't been written yet — check back once Kicko is closer to launch.</Text>
      <Link href="/" style={styles.link}>
        Back to Kicko
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg, padding: 24 },
  title: { fontFamily: fonts.serif, fontSize: 28, color: colors.text, marginBottom: 10, textAlign: 'center' },
  body: {
    fontFamily: fonts.sans,
    fontSize: 14,
    color: colors.textSoft,
    marginBottom: 24,
    textAlign: 'center',
    maxWidth: 380,
  },
  link: { fontFamily: fonts.sansBold, fontSize: 13.5, color: colors.accent },
});
