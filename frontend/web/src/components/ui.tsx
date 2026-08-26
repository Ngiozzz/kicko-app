import { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';
import { colors, fonts, radius } from '@kicko/shared';

export function Field({
  label,
  error,
  ...inputProps
}: { label: string; error?: string } & TextInputProps) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        placeholderTextColor={colors.textSoft}
        style={[styles.input, error ? styles.inputError : null]}
        {...inputProps}
      />
      {error ? <Text style={styles.fieldError}>{error}</Text> : null}
    </View>
  );
}

export function Button({
  title,
  onPress,
  variant = 'solid',
  disabled,
}: {
  title: string;
  onPress: () => void;
  variant?: 'solid' | 'outline';
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.btn,
        variant === 'outline' && styles.btnOutline,
        disabled && styles.btnDisabled,
        pressed && !disabled && styles.btnPressed,
      ]}
    >
      <Text style={[styles.btnText, variant === 'outline' && styles.btnTextOutline]}>{title}</Text>
    </Pressable>
  );
}

export function Card({ children }: { children: ReactNode }) {
  return <View style={styles.card}>{children}</View>;
}

export function Checkbox({
  checked,
  onToggle,
  children,
  error,
}: {
  checked: boolean;
  onToggle: () => void;
  children: ReactNode;
  error?: string;
}) {
  return (
    <View style={styles.field}>
      <Pressable onPress={onToggle} style={styles.checkboxRow}>
        <View style={[styles.checkboxBox, checked && styles.checkboxBoxChecked]}>
          {checked && <Text style={styles.checkboxMark}>✓</Text>}
        </View>
        <Text style={styles.checkboxLabel}>{children}</Text>
      </Pressable>
      {error ? <Text style={styles.fieldError}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: 24,
  },
  field: { marginBottom: 16 },
  fieldLabel: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 11,
    color: colors.textSoft,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bg,
    borderRadius: radius.md,
    paddingVertical: 13,
    paddingHorizontal: 16,
    fontFamily: fonts.sans,
    fontSize: 14,
    color: colors.text,
  },
  inputError: { borderColor: colors.danger },
  fieldError: {
    fontFamily: fonts.sans,
    fontSize: 12,
    color: colors.danger,
    marginTop: 6,
  },
  checkboxRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  checkboxBox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  checkboxBoxChecked: { backgroundColor: colors.accent, borderColor: colors.accent },
  checkboxMark: { fontSize: 13, lineHeight: 13, color: colors.accentText, fontFamily: fonts.sansBold },
  checkboxLabel: { flex: 1, fontFamily: fonts.sans, fontSize: 13, color: colors.textSoft, lineHeight: 19 },
  btn: {
    backgroundColor: colors.accent,
    borderRadius: radius.pill,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  btnOutline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  btnPressed: { opacity: 0.85 },
  btnDisabled: { opacity: 0.5 },
  btnText: {
    fontFamily: fonts.sansBold,
    fontSize: 15,
    color: colors.accentText,
  },
  btnTextOutline: { color: colors.text },
});
