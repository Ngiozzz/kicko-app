import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle, Polygon } from 'react-native-svg';
import { colors, fonts } from '@kicko/shared';

// Ported from the design reference's inline SVG mark (Kicko/docs/*.html
// `.logo-mark`) — same viewBox/points, just React Native SVG components
// instead of raw <svg>.
export function LogoMark({ size = 22 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="175 150 260 260" fill="none" stroke={colors.accent} strokeWidth={18} strokeLinejoin="round">
      <Circle cx={305} cy={280} r={120} />
      <Polygon points="305,168 397,224 397,336 305,392 213,336 213,224" />
      <Circle cx={305} cy={280} r={42} />
    </Svg>
  );
}

export function Logo({ size = 22, textSize = 20 }: { size?: number; textSize?: number }) {
  return (
    <View style={styles.row}>
      <LogoMark size={size} />
      <Text style={[styles.word, { fontSize: textSize }]}>
        Kick<Text style={styles.o}>o</Text>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  word: { fontFamily: fonts.serif, color: colors.text, letterSpacing: -0.5 },
  o: { color: colors.accent },
});
