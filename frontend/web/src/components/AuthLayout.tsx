import { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { Link } from 'expo-router';
import { colors, fonts } from '@kicko/shared';
import { LogoMark } from './Logo';
import { Sport, SportIcon } from './SportIcon';

const NARROW_BREAKPOINT = 880;

const SPORTS: { sport: Sport; label: string }[] = [
  { sport: 'football', label: 'Football' },
  { sport: 'basketball', label: 'Basketball' },
  { sport: 'tennis', label: 'Tennis' },
  { sport: 'padel', label: 'Padel' },
  { sport: 'volleyball', label: 'Volleyball' },
];

// The same ring mark that's on each sport's own icon (Kicko/docs/Images/
// kicko-icon-*.svg), shown as a strip — makes "every sport, one dashboard"
// a thing you can see rather than just a line of bullet copy.
function SportStrip() {
  return (
    <View style={styles.sportStrip}>
      <View style={styles.sportRow}>
        {SPORTS.map(({ sport }) => (
          <SportIcon key={sport} sport={sport} size={34} />
        ))}
      </View>
      <Text style={styles.sportCaption}>{SPORTS.map((s) => s.label).join('   ·   ')}</Text>
    </View>
  );
}

function BrandPanel({ headline, subhead, bullets }: { headline: string; subhead: string; bullets: string[] }) {
  return (
    <View style={styles.brandPanel}>
      <View style={styles.brandContent}>
        <Link href="/" asChild>
          <Pressable style={styles.brandLogoRow}>
            <LogoMark size={24} />
            <Text style={styles.brandWordmark}>
              Kick<Text style={{ color: colors.accent }}>o</Text>
            </Text>
          </Pressable>
        </Link>

        <View>
          <Text style={styles.brandHeadline}>{headline}</Text>
          <Text style={styles.brandSubhead}>{subhead}</Text>
          <SportStrip />
        </View>

        <View style={styles.bulletList}>
          {bullets.map((bullet) => (
            <View key={bullet} style={styles.bulletRow}>
              <View style={styles.checkBadge}>
                <Text style={styles.checkMark}>✓</Text>
              </View>
              <Text style={styles.bulletText}>{bullet}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

export function AuthLayout({
  headline,
  subhead,
  bullets,
  children,
}: {
  headline: string;
  subhead: string;
  bullets: string[];
  children: ReactNode;
}) {
  const { width } = useWindowDimensions();
  const narrow = width < NARROW_BREAKPOINT;

  return (
    <View style={[styles.root, narrow && styles.rootNarrow]}>
      {!narrow && <BrandPanel headline={headline} subhead={subhead} bullets={bullets} />}
      <View style={styles.formPanel}>
        {narrow && (
          <View style={styles.narrowLogoRow}>
            <LogoMark size={22} />
            <Text style={styles.narrowWordmark}>
              Kick<Text style={{ color: colors.accent }}>o</Text>
            </Text>
          </View>
        )}
        <View style={styles.formInner}>
          <Link href="/" style={styles.backLink}>
            ← Back to Kicko
          </Link>
          {children}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, flexDirection: 'row', minHeight: '100%', backgroundColor: colors.bg },
  rootNarrow: { flexDirection: 'column' },

  brandPanel: {
    flex: 1,
    maxWidth: 480,
    backgroundColor: colors.text,
    padding: 48,
    justifyContent: 'space-between',
    overflow: 'hidden',
  },
  brandContent: { flex: 1, justifyContent: 'space-between' },
  brandLogoRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  brandWordmark: { fontFamily: fonts.serif, fontSize: 20, color: colors.bg, letterSpacing: -0.5 },
  brandHeadline: {
    fontFamily: fonts.serif,
    fontSize: 38,
    lineHeight: 44,
    color: colors.bg,
    marginBottom: 16,
    maxWidth: 380,
  },
  brandSubhead: {
    fontFamily: fonts.sans,
    fontSize: 15,
    lineHeight: 23,
    color: 'rgba(247,244,239,0.7)',
    maxWidth: 340,
  },
  sportStrip: { marginTop: 28 },
  sportRow: { flexDirection: 'row', gap: 10 },
  sportCaption: {
    fontFamily: fonts.sansMedium,
    fontSize: 10.5,
    letterSpacing: 0.5,
    color: 'rgba(247,244,239,0.45)',
    textTransform: 'uppercase',
    marginTop: 10,
  },
  bulletList: { gap: 14, marginTop: 40 },
  bulletRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  checkBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(192,138,62,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: 1,
  },
  checkMark: { fontSize: 11, color: colors.accent, fontFamily: fonts.sansBold },
  bulletText: { flex: 1, fontFamily: fonts.sans, fontSize: 14, lineHeight: 21, color: 'rgba(247,244,239,0.85)' },

  formPanel: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 48 },
  formInner: { width: '100%', maxWidth: 380 },
  backLink: {
    fontFamily: fonts.sansMedium,
    fontSize: 13,
    color: colors.textSoft,
    marginBottom: 24,
  },

  narrowLogoRow: {
    position: 'absolute',
    top: 28,
    left: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  narrowWordmark: { fontFamily: fonts.serif, fontSize: 18, color: colors.text, letterSpacing: -0.5 },
});
