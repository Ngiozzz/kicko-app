// Light-mode palette, ported 1:1 from the design reference at
// thurfa-platform/Kicko/docs/shared.css (:root tokens). Dark mode isn't
// wired up yet — fast follow once the light-mode screens are settled.
export const colors = {
  bg: '#F7F4EF',
  surface: '#EAE3D7',
  surface2: '#E0D7C8',
  text: '#1E2126',
  textSoft: '#5A5F66',
  accent: '#C08A3E',
  accentSoft: 'rgba(192,138,62,0.14)',
  accentText: '#1E2126',
  border: 'rgba(30,33,38,0.17)',
  shadow: 'rgba(30,33,38,0.12)',
  good: '#3C7A5C',
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
