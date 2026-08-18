import { useEffect } from 'react';
import { View, ActivityIndicator, Platform } from 'react-native';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import { Fraunces_500Medium, Fraunces_700Bold } from '@expo-google-fonts/fraunces';
import { colors } from '@kicko/shared';
import { injectThemeVars } from '../src/lib/theme';
import { markActivity } from '../src/lib/sessionActivity';

SplashScreen.preventAutoHideAsync().catch(() => {});

// Web only: defines the --bg/--text/etc CSS variables @kicko/shared's web
// theme (theme.web.ts) references, restores the persisted light/dark
// choice, and fights the two dark-mode rendering bugs documented in
// src/lib/theme.ts (RNW's own prefers-color-scheme rule, and Chrome's
// force-dark pass) — tried app/+html.tsx first but it wasn't taking effect
// even after a clean restart and a static export, so this runtime call is
// what's actually reliable here.
if (Platform.OS === 'web' && typeof document !== 'undefined') {
  injectThemeVars();
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

  // Feeds useRoleGate's inactivity timeout — discrete interaction events
  // only (not mousemove), so this doesn't fire constantly while idle with
  // the cursor merely resting over the page.
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;
    const events: (keyof DocumentEventMap)[] = ['mousedown', 'keydown', 'touchstart', 'scroll'];
    events.forEach((e) => document.addEventListener(e, markActivity, { passive: true }));
    return () => events.forEach((e) => document.removeEventListener(e, markActivity));
  }, []);

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
