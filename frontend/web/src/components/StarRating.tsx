import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '@kicko/shared';

const STAR_KEYS = [1, 2, 3, 4, 5] as const;

/** Read-only stars, rounded to the nearest whole star. */
export function StarRating({ value, size = 13 }: { value: number; size?: number }) {
  const rounded = Math.round(value);
  return (
    <View style={styles.row}>
      {STAR_KEYS.map((n) => (
        <Text key={n} style={[styles.star, { fontSize: size, color: n <= rounded ? colors.accent : colors.border }]}>
          ★
        </Text>
      ))}
    </View>
  );
}

/** Five pressable stars for picking a 1–5 rating. */
export function StarRatingInput({ value, onChange, size = 22 }: { value: number; onChange: (v: number) => void; size?: number }) {
  return (
    <View style={styles.row}>
      {STAR_KEYS.map((n) => (
        <Pressable key={n} onPress={() => onChange(n)} hitSlop={4}>
          <Text style={[styles.star, { fontSize: size, color: n <= value ? colors.accent : colors.border }]}>★</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 2 },
  star: {},
});
