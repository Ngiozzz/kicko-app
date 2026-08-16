import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts, radius } from '@kicko/shared';

export function OwnerComingSoon({ title, description }: { title: string; description: string }) {
  return (
    <View style={styles.root}>
      <View style={styles.badge}>
        <Text style={styles.badgeText}>Coming soon</Text>
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.desc}>{description}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { minHeight: 420, alignItems: 'center', justifyContent: 'center', paddingVertical: 60, paddingHorizontal: 20 },
  badge: {
    backgroundColor: colors.accentSoft,
    borderRadius: radius.pill,
    paddingVertical: 7,
    paddingHorizontal: 16,
    marginBottom: 22,
  },
  badgeText: { fontFamily: fonts.sansBold, fontSize: 11.5, color: colors.accent, textTransform: 'uppercase', letterSpacing: 0.5 },
  title: { fontFamily: fonts.serif, fontSize: 28, color: colors.text, marginBottom: 14, textAlign: 'center' },
  desc: { fontFamily: fonts.sans, fontSize: 14, color: colors.textSoft, lineHeight: 22, maxWidth: 460, textAlign: 'center' },
});
