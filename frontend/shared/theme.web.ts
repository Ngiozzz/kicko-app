// Web-only override of theme.ts — Metro picks this file automatically for
// web bundles (the .web.ts convention), so every existing `import {
// colors } from '@kicko/shared'` across the app keeps working unchanged.
//
// Values are CSS var() references instead of literal hex — the actual
// light/dark values are injected as real CSS custom properties by
// frontend/web/src/lib/theme.ts (see injectThemeVars/setDarkMode), toggled
// via a `dark` class on <html>. Since react-native-web ultimately renders
// real DOM nodes, the browser resolves these variables at paint time, so
// dark mode applies everywhere without each screen needing to know about
// it. Native (theme.ts) stays hardcoded hex — CSS variables don't exist
// there.
export const colors = {
  bg: 'var(--bg)',
  surface: 'var(--surface)',
  surface2: 'var(--surface-2)',
  text: 'var(--text)',
  textSoft: 'var(--text-soft)',
  accent: 'var(--accent)',
  accentSoft: 'var(--accent-soft)',
  accentText: 'var(--accent-text)',
  border: 'var(--border)',
  shadow: 'var(--shadow)',
  good: 'var(--good)',
  // No dark-mode override in the design reference — stays literal in both themes.
  danger: '#C4453F',
} as const;

export const fonts = {
  serif: 'Fraunces_700Bold',
  serifMedium: 'Fraunces_500Medium',
  sans: 'Inter_400Regular',
  sansMedium: 'Inter_500Medium',
  sansSemiBold: 'Inter_600SemiBold',
  sansBold: 'Inter_700Bold',
} as const;

export const radius = {
  sm: 10,
  md: 12,
  lg: 18,
  pill: 999,
} as const;

export const spacing = (n: number) => n * 4;
