import { useEffect } from 'react';
import { View, ActivityIndicator, Platform } from 'react-native';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import { Fraunces_500Medium, Fraunces_700Bold } from '@expo-google-fonts/fraunces';
import { colors } from '@kicko/shared';

SplashScreen.preventAutoHideAsync().catch(() => {});

// Web only — two separate dark-mode problems, both need fixing:
//
// 1. react-native-web's reset stylesheet ships a
//    `@media (prefers-color-scheme: dark) { body { background: ... !important } }`
//    rule that wins over a plain inline style; matched with !important of
//    our own below.
// 2. Chrome's own "force dark" rendering pass can repaint an entire
//    light-only page as dark *after* layout — getComputedStyle kept
//    reporting the correct authored colors while the actual pixels stayed
//    dark, which is the signature of that feature, not a CSS bug. Chrome
//    skips auto-inverting any page that explicitly declares its
//    color-scheme, so the meta tag below opts out of it.
//
// Tried app/+html.tsx first (the usual Expo Router mechanism for both of
// these) but it wasn't taking effect even after a clean restart and a
// static export — this runtime fallback is what's actually reliable here.
// No dark mode support yet (see theme.ts), so pin light for now.
if (Platform.OS === 'web' && typeof document !== 'undefined') {
  document.documentElement.style.setProperty('background-color', colors.bg, 'important');
  document.body.style.setProperty('background-color', colors.bg, 'important');
  document.documentElement.style.colorScheme = 'light';
  if (!document.querySelector('meta[name="color-scheme"]')) {
    const meta = document.createElement('meta');
    meta.name = 'color-scheme';
    meta.content = 'light';
    document.head.appendChild(meta);
  }
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Fraunces_500Medium,
    Fraunces_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync().catch(() => {});
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg }}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.bg },
      }}
    />
  );
}
