import { useRef, useState } from 'react';
import { StyleSheet, Text, View, ScrollView, Pressable, useWindowDimensions } from 'react-native';
import { Link } from 'expo-router';
import Svg, { Circle } from 'react-native-svg';
import { colors, fonts, radius } from '@kicko/shared';
import { WebNav } from '../src/components/WebNav';
import { Footer } from '../src/components/Footer';
import { FaqAccordion } from '../src/components/FaqAccordion';
import { SportIcon, Sport } from '../src/components/SportIcon';
import { Role, roleContent } from '../src/content/roleContent';
import { useFade } from '../src/lib/useFade';
import { withRole } from '../src/lib/withRole';

const NARROW = 900;

// Loosely scattered, not a tidy row — each icon at its own size/rotation,
// like pins on a board rather than a logo lockup. Static across roles,
// same as Thurfa's pitch-graphic SVG doesn't change per role either —
// only the text/CTAs swap.
const COLLAGE: { sport: Sport; size: number; top: number; left: number; rotate: string }[] = [
  { sport: 'football', size: 92, top: 10, left: 130, rotate: '-8deg' },
  { sport: 'basketball', size: 58, top: 128, left: 8, rotate: '11deg' },
  { sport: 'tennis', size: 50, top: 30, left: 268, rotate: '16deg' },
  { sport: 'padel', size: 56, top: 226, left: 196, rotate: '-13deg' },
  { sport: 'volleyball', size: 46, top: 244, left: 44, rotate: '7deg' },
];

function IconCollage() {
  return (
    <View style={styles.collage}>
      <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
        <Circle cx={180} cy={165} r={168} fill="none" stroke="rgba(192,138,62,0.16)" strokeWidth={2} />
        <Circle cx={180} cy={165} r={130} fill="none" stroke="rgba(30,33,38,0.06)" strokeWidth={1} />
      </Svg>
      {COLLAGE.map(({ sport, size, top, left, rotate }) => (
        <View key={sport} style={[styles.collageIcon, { top, left, transform: [{ rotate }] }]}>
          <SportIcon sport={sport} size={size} />
        </View>
      ))}
    </View>
  );
}

function CtaButton({ role, kind }: { role: Role; kind: 'primary' | 'secondary' }) {
  const cta = roleContent[role][kind];
  const solid = kind === 'primary';

  if ('comingSoon' in cta) {
    return (
      <View style={[styles.btnBase, solid ? styles.comingSoonSolid : styles.comingSoonGhost]}>
        <Text style={solid ? styles.comingSoonSolidText : styles.comingSoonGhostText}>{cta.text}</Text>
      </View>
    );
  }

  // Carry the role forward so /sign-in or /sign-up shows the right copy.
  const href = withRole(cta.href, role);

  // expo-router's <Link asChild> forwards props through <Slot> onto its
  // direct child, which can't take an array of styles — flatten first.
  return (
    <Link href={href} asChild>
      <Pressable style={StyleSheet.flatten([styles.btnBase, solid ? styles.primaryBtn : styles.secondaryBtn])}>
        <Text style={solid ? styles.primaryBtnText : styles.secondaryBtnText}>{cta.text}</Text>
      </Pressable>
    </Link>
  );
}

export default function Landing() {
  const { width } = useWindowDimensions();
  const narrow = width < NARROW;
  const [activeRole, setActiveRole] = useState<Role>('owner');
  const scrollRef = useRef<ScrollView>(null);
  const data = roleContent[activeRole];
  const fade = useFade(activeRole);

  function handleSelectRole(role: Role) {
    setActiveRole(role);
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  }

  return (
    <ScrollView ref={scrollRef} style={styles.root} contentContainerStyle={styles.rootContent}>
      <WebNav activeRole={activeRole} onSelectRole={handleSelectRole} />

      {/* Hero: content swaps per role tab (see roleContent.ts) instead of
          scrolling to a different section — same interaction Thurfa's
          role switcher uses, rebuilt in Kicko's own design language. */}
      <View style={[styles.hero, narrow && styles.heroNarrow]}>
        <View style={[styles.heroCopy, narrow && styles.heroCopyNarrow, fade]}>
          <Text style={styles.eyebrow}>{data.eyebrow}</Text>
          <Text style={[styles.heroTitle, narrow && styles.heroTitleNarrow]}>
            {data.headlineLines[0]}
            {'\n'}
            {data.headlineLines[1]}
            {'\n'}
            <Text style={styles.heroTitleAccent}>{data.headlineLines[2]}</Text>
          </Text>
          <Text style={styles.heroSubtitle}>{data.sub}</Text>
          <View style={styles.heroActions}>
            <CtaButton role={activeRole} kind="primary" />
            <CtaButton role={activeRole} kind="secondary" />
          </View>
        </View>
        {!narrow && <IconCollage />}
      </View>

      {/* FAQ: kicker + intro swap per role, heading stays put */}
      <View style={[styles.faqWrap, fade]}>
        <Text style={styles.faqKicker}>{data.faqKicker}</Text>
        <Text style={styles.faqTitle}>What people ask</Text>
        <Text style={styles.faqSubtitle}>{data.faqIntro}</Text>
        <FaqAccordion faqs={data.faqs} />
      </View>

      <Footer onSelectRole={handleSelectRole} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  rootContent: { flexGrow: 1 },

  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    maxWidth: 1160,
    alignSelf: 'center',
    width: '100%',
    paddingHorizontal: 24,
    paddingTop: 56,
    paddingBottom: 72,
    gap: 40,
  },
  heroNarrow: { flexDirection: 'column' },
  heroCopy: { flex: 1, maxWidth: 520 },
  heroCopyNarrow: { maxWidth: '100%' },
  eyebrow: {
    fontFamily: fonts.sansBold,
    fontSize: 12,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: colors.accent,
    marginBottom: 14,
  },
  heroTitle: { fontFamily: fonts.serif, fontSize: 52, lineHeight: 57, color: colors.text, marginBottom: 16 },
  heroTitleNarrow: { fontSize: 38, lineHeight: 43 },
  heroTitleAccent: { color: colors.accent },
  heroSubtitle: { fontFamily: fonts.sans, fontSize: 16, lineHeight: 24, color: colors.textSoft, marginBottom: 28 },
  heroActions: { flexDirection: 'row', gap: 14, flexWrap: 'wrap' },

  collage: { width: 360, height: 330 },
  collageIcon: { position: 'absolute' },

  btnBase: { borderRadius: radius.pill, paddingVertical: 13, paddingHorizontal: 24, alignSelf: 'flex-start' },
  primaryBtn: { backgroundColor: colors.accent },
  primaryBtnText: { fontFamily: fonts.sansBold, fontSize: 14.5, color: colors.accentText },
  secondaryBtn: { borderWidth: 1.5, borderColor: colors.border, backgroundColor: 'transparent' },
  secondaryBtnText: { fontFamily: fonts.sansBold, fontSize: 14.5, color: colors.text },
  comingSoonSolid: { backgroundColor: colors.accentSoft },
  comingSoonSolidText: { fontFamily: fonts.sansSemiBold, fontSize: 14.5, color: colors.accent },
  comingSoonGhost: { borderWidth: 1.5, borderColor: colors.border },
  comingSoonGhostText: { fontFamily: fonts.sansBold, fontSize: 14.5, color: colors.text },

  faqWrap: { maxWidth: 880, alignSelf: 'center', width: '100%', paddingHorizontal: 24, paddingBottom: 72 },
  faqKicker: {
    fontFamily: fonts.sansBold,
    fontSize: 12,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: colors.accent,
    marginBottom: 10,
  },
  faqTitle: { fontFamily: fonts.serif, fontSize: 28, lineHeight: 33, color: colors.text, marginBottom: 8 },
  faqSubtitle: { fontFamily: fonts.sans, fontSize: 14.5, lineHeight: 22, color: colors.textSoft, marginBottom: 12 },
});
