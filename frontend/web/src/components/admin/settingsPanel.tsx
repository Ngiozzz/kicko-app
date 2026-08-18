import { ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { colors, fonts, radius } from '@kicko/shared';
import { Button } from '../ui';

export function refundColor(pct: number): string {
  if (pct >= 90) return colors.good;
  if (pct >= 75) return colors.accent;
  return colors.danger;
}

// Shared chrome for every /admin-dashboard/settings/* editor page (fees,
// refunds, windows) — a top-accented card so each reads as the featured
// card of its page (it governs real business logic).
//
// Deliberately takes `children` as plain ReactNode, not a loading flag: the
// caller's JSX is built (and any expressions inside it evaluated) before
// this component ever runs, so a `loading ? <Spinner/> : children` ternary
// *here* can't stop the caller's tier-preview math from running against
// still-empty state on the first render. Callers must early-return their
// own loading view instead — see PanelLoading below.
export function PanelCard({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>
      {children}
    </View>
  );
}

export function PanelLoading({ title }: { title: string }) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{title}</Text>
      <ActivityIndicator color={colors.accent} />
    </View>
  );
}

export function SaveRow({ error, saved, saving, label, onPress }: { error: string | null; saved: boolean; saving: boolean; label: string; onPress: () => void }) {
  return (
    <>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {saved ? <Text style={styles.saved}>Saved.</Text> : null}
      <Button title={saving ? 'Saving…' : label} onPress={onPress} disabled={saving} />
    </>
  );
}

export function TileGrid({ children }: { children: ReactNode }) {
  return <View style={styles.grid}>{children}</View>;
}

export function ChipRemove({ onPress }: { onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.chipRemove} hitSlop={6}>
      <Text style={styles.chipRemoveText}>×</Text>
    </Pressable>
  );
}

// A single bordered tile — used both for a fee/refund tier (with a remove
// button and an optional colored left accent) and a plain match-window
// stat (neither).
export function StatTile({ title, accentColor, onRemove, hint, children }: { title: string; accentColor?: string; onRemove?: () => void; hint?: string; children: ReactNode }) {
  return (
    <View style={[styles.tile, accentColor ? { borderLeftWidth: 3, borderLeftColor: accentColor } : null]}>
      {onRemove ? <ChipRemove onPress={onRemove} /> : null}
      <Text style={styles.tileTitle}>{title}</Text>
      {children}
      {hint ? <Text style={styles.tileHint}>{hint}</Text> : null}
    </View>
  );
}

// One editable number within a tile — `subLabel` is used when a tile packs
// more than one stat (a fee tier's "up to" + "fee"); omit it for a
// single-stat tile (a match window's own value).
export function TileStat({
  subLabel,
  spaced,
  value,
  onChangeText,
  unit,
  placeholder,
  valueColor,
}: {
  subLabel?: string;
  spaced?: boolean;
  value: string;
  onChangeText: (t: string) => void;
  unit: string;
  placeholder?: string;
  valueColor?: string;
}) {
  return (
    <>
      {subLabel ? <Text style={[styles.tileSubLabel, spaced && { marginTop: 10 }]}>{subLabel}</Text> : null}
      <View style={styles.tileValueRow}>
        <TextInput
          style={[styles.tileInput, valueColor ? { color: valueColor } : null]}
          value={value}
          placeholder={placeholder}
          placeholderTextColor={colors.textSoft}
          onChangeText={onChangeText}
          keyboardType="numeric"
        />
        <Text style={styles.tileUnit}>{unit}</Text>
      </View>
    </>
  );
}

export function AddTile({ onPress }: { onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.addTile}>
      <Text style={styles.addTileText}>+ Add tier</Text>
    </Pressable>
  );
}

export function PreviewBox({ children }: { children: ReactNode }) {
  return (
    <View style={styles.previewBox}>
      <Text style={styles.previewLabel}>Preview</Text>
      <View style={styles.previewRow}>{children}</View>
    </View>
  );
}

// Composes one "KES 100 → +20" / "48h left → 100%" line — `strong` is the
// colored, emphasized half of the sentence.
export function PreviewLine({ prefix, strong, strongColor }: { prefix: string; strong: string; strongColor?: string }) {
  return (
    <Text style={styles.previewItem}>
      {prefix} <Text style={styles.previewArrow}>→</Text> <Text style={[styles.previewStrong, strongColor ? { color: strongColor } : null]}>{strong}</Text>
    </Text>
  );
}

export function InlineNumberSentence({ before, value, onChangeText, after }: { before: string; value: string; onChangeText: (t: string) => void; after: string }) {
  return (
    <View style={styles.sentenceRow}>
      <Text style={styles.sentenceText}>{before}</Text>
      <TextInput style={styles.sentenceInput} value={value} onChangeText={onChangeText} keyboardType="numeric" />
      <Text style={styles.sentenceText}>{after}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderTopWidth: 3,
    borderTopColor: colors.accent,
    borderRadius: radius.lg,
    padding: 24,
    marginBottom: 20,
    maxWidth: 820,
  },
  headerRow: { marginBottom: 20 },
  title: { fontFamily: fonts.serifMedium, fontSize: 16, color: colors.text, marginBottom: 4 },
  subtitle: { fontFamily: fonts.sans, fontSize: 12.5, color: colors.textSoft },

  error: { fontFamily: fonts.sans, fontSize: 12.5, color: colors.danger, marginBottom: 8 },
  saved: { fontFamily: fonts.sans, fontSize: 12.5, color: colors.good, marginBottom: 8 },

  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 12, marginBottom: 22 } as any,

  tile: { backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: 14, position: 'relative' },
  tileTitle: { fontFamily: fonts.sansSemiBold, fontSize: 10.5, color: colors.textSoft, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 8 },
  tileSubLabel: { fontFamily: fonts.sans, fontSize: 11, color: colors.textSoft, marginBottom: 2 },
  tileValueRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  tileInput: { borderWidth: 0, fontFamily: fonts.serifMedium, fontSize: 22, color: colors.text, minWidth: 40, paddingVertical: 0 },
  tileUnit: { fontFamily: fonts.sans, fontSize: 12, color: colors.textSoft },
  tileHint: { fontFamily: fonts.sans, fontSize: 11, color: colors.textSoft, marginTop: 8, lineHeight: 15 },

  chipRemove: {
    position: 'absolute',
    top: -7,
    right: -7,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipRemoveText: { color: '#fff', fontSize: 12, fontFamily: fonts.sansBold, lineHeight: 13 },

  addTile: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderStyle: 'dashed',
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 90,
  },
  addTileText: { fontFamily: fonts.sansSemiBold, fontSize: 12.5, color: colors.accent },

  previewBox: { backgroundColor: colors.accentSoft, borderRadius: radius.md, padding: 12, marginBottom: 18 },
  previewLabel: { fontFamily: fonts.sansSemiBold, fontSize: 10, color: colors.accent, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 6 },
  previewRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  previewItem: { fontFamily: fonts.sans, fontSize: 12.5, color: colors.text },
  previewArrow: { color: colors.textSoft },
  previewStrong: { fontFamily: fonts.sansSemiBold, color: colors.accent },

  sentenceRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6, marginBottom: 18 },
  sentenceText: { fontFamily: fonts.sans, fontSize: 13, color: colors.text },
  sentenceInput: {
    borderWidth: 0,
    borderBottomWidth: 1.5,
    borderBottomColor: colors.border,
    minWidth: 32,
    textAlign: 'center',
    paddingVertical: 2,
    fontFamily: fonts.sansSemiBold,
    fontSize: 13,
    color: colors.text,
  },
});
