import { CSSProperties } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts, radius } from '@kicko/shared';

// react-native-web's <TextInput keyboardType="numeric"> only ever renders
// <input type="text" inputmode="numeric"> — no native spinner, no browser
// number validation. These render the real HTML input types directly since
// this app is web-only.

const baseInputStyle: CSSProperties = {
  width: '100%',
  boxSizing: 'border-box',
  borderWidth: 1,
  borderStyle: 'solid',
  borderColor: colors.border as unknown as string,
  backgroundColor: colors.bg as unknown as string,
  borderRadius: radius.md,
  paddingTop: 13,
  paddingBottom: 13,
  paddingLeft: 16,
  paddingRight: 16,
  fontFamily: fonts.sans,
  fontSize: 14,
  color: colors.text as unknown as string,
  outline: 'none',
};

export function NumberField({
  label,
  placeholder,
  value,
  onChangeText,
}: {
  label: string;
  placeholder?: string;
  value: string;
  onChangeText: (value: string) => void;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <input
        type="number"
        min="0"
        step="1"
        inputMode="numeric"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChangeText(e.target.value)}
        style={baseInputStyle}
      />
    </View>
  );
}

export function DateTimeField({
  label,
  value,
  onChangeText,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <input type="datetime-local" value={value} onChange={(e) => onChangeText(e.target.value)} style={baseInputStyle} />
    </View>
  );
}

export function TimeField({
  label,
  value,
  onChangeText,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <input type="time" value={value} onChange={(e) => onChangeText(e.target.value)} style={baseInputStyle} />
    </View>
  );
}

const styles = StyleSheet.create({
  field: { marginBottom: 16 },
  label: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 11,
    color: colors.textSoft,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
});
