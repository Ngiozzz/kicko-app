import { Link } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts, radius } from '@kicko/shared';

// Team wallets don't exist yet — this mirrors Kicko/docs/teams.html's own
// "Coming soon" state exactly, since that's the real, honest state of the
// feature right now, not a placeholder invented for this build.
export default function PlayerTeams() {
  return (
    <View style={styles.root}>
      <View style={styles.badge}>
        <Text style={styles.badgeText}>⚡ Coming soon</Text>
      </View>
      <Text style={styles.title}>Team management is on the way</Text>
      <Text style={styles.desc}>
        Soon you'll be able to create a team, build your roster, pool money into a shared team wallet, and book venues
        together as a group — with every teammate seeing the booking on their own dashboard.
      </Text>
      <Text style={styles.desc}>For now, keep booking as an individual from the Explore tab.</Text>
      <Link href="/player/explore" asChild>
        <Pressable style={styles.btn}>
          <Text style={styles.btnText}>Explore venues</Text>
        </Pressable>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { minHeight: 420, alignItems: 'center', justifyContent: 'center', paddingVertical: 60, paddingHorizontal: 20 },
  badge: { backgroundColor: colors.accentSoft, borderRadius: radius.pill, paddingVertical: 7, paddingHorizontal: 16, marginBottom: 22 },
  badgeText: { fontFamily: fonts.sansBold, fontSize: 11.5, color: colors.accent, textTransform: 'uppercase', letterSpacing: 0.5 },
  title: { fontFamily: fonts.serif, fontSize: 28, color: colors.text, marginBottom: 14, textAlign: 'center' },
  desc: { fontFamily: fonts.sans, fontSize: 14, color: colors.textSoft, lineHeight: 22, maxWidth: 460, textAlign: 'center', marginBottom: 8 },
  btn: { marginTop: 16, backgroundColor: colors.accent, borderRadius: radius.pill, paddingVertical: 13, paddingHorizontal: 24 },
  btnText: { fontFamily: fonts.sansBold, fontSize: 14, color: colors.accentText },
});
