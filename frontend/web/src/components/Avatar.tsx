import { Image, StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '@kicko/shared';

// Shows the account's OAuth profile photo (Google, etc.) when there is
// one, falling back to an initial-letter circle for email/password
// accounts and any provider that doesn't supply a picture.
export function Avatar({ name, avatarUrl, size = 30 }: { name: string; avatarUrl?: string | null; size?: number }) {
  const dimension = { width: size, height: size, borderRadius: size / 2 };

  if (avatarUrl) {
    return <Image source={{ uri: avatarUrl }} style={[styles.image, dimension]} />;
  }

  return (
    <View style={[styles.fallback, dimension]}>
      <Text style={[styles.fallbackText, { fontSize: size * 0.43 }]}>{name.charAt(0).toUpperCase()}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  image: { backgroundColor: colors.accentSoft },
  fallback: { backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
  fallbackText: { fontFamily: fonts.serif, color: colors.accentText },
});
