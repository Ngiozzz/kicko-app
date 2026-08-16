import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Link, router } from 'expo-router';
import Svg, { Circle, Polygon } from 'react-native-svg';
import { apiFetch, fonts } from '@kicko/shared';
import { supabase, supabaseConfigured } from '@kicko/shared';
import { resolveHomeRoute } from '../src/lib/roleRoute';

// Fixed dark palette, independent of the app-wide light/dark toggle — this
// screen is a distinct "internal tool" identity, not a themed public page.
// Values match Kicko/docs/shared.css's html.dark block exactly (see
// frontend/web/src/lib/theme.ts) so it still reads as the same product,
// just always in its dark register.
const dark = {
  bg: '#1E2126',
  surface: '#262A31',
  surface2: '#2D323A',
  text: '#F3EFE6',
  textSoft: '#9B9E9F',
  accent: '#D9A857',
  accentText: '#1E2126',
  border: 'rgba(255,255,255,0.10)',
  danger: '#E0736C',
};

// Same mark as LogoMark, but with the accent hardcoded to this page's fixed
// dark palette instead of following the app-wide toggle (LogoMark's stroke
// resolves colors.accent, which would drift between light/dark gold here).
function AdminLogoMark({ size = 26 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="175 150 260 260" fill="none" stroke={dark.accent} strokeWidth={18} strokeLinejoin="round">
      <Circle cx={305} cy={280} r={120} />
      <Polygon points="305,168 397,224 397,336 305,392 213,336 213,224" />
      <Circle cx={305} cy={280} r={42} />
    </Svg>
  );
}

function DarkField({
  label,
  ...inputProps
}: { label: string } & React.ComponentProps<typeof TextInput>) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput placeholderTextColor={dark.textSoft} style={styles.input} {...inputProps} />
    </View>
  );
}

// Deliberately not part of the public nav or the owner/manager auth flow —
// only reachable via the small "Admin" link in the landing page footer.
// Admins are provisioned by hand (never self-registered, see
// backend/supabase/migrations/..._harden_signup_role.sql), so there's no
// sign-up here, just sign-in.
export default function AdminSignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSignIn() {
    setFormError(null);
    if (!email || !password) {
      setFormError('Enter your email and password.');
      return;
    }
    if (!supabaseConfigured) {
      setFormError('Supabase isn’t connected yet.');
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setLoading(false);
      setFormError(error.message);
      return;
    }

    // Route by real role even here — a non-admin account that somehow
    // lands on this page shouldn't end up at the admin dashboard.
    try {
      const { user } = await apiFetch<{ user: { role: string } }>('/api/account/me');
      router.replace(resolveHomeRoute(user.role));
    } catch {
      router.replace('/');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.wrap}>
        <View style={styles.brandBlock}>
          <View style={styles.logoRow}>
            <AdminLogoMark size={26} />
            <Text style={styles.wordmark}>
              Kick<Text style={{ color: dark.accent }}>o</Text>
            </Text>
          </View>
          <Text style={styles.roleTag}>Admin access</Text>
        </View>

        <Text style={styles.title}>Admin sign in</Text>
        <Text style={styles.subtitle}>Internal access only — sign in with your provisioned admin account.</Text>

        <View style={styles.card}>
          <DarkField
            label="Email"
            placeholder="you@kicko.app"
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />
          <DarkField label="Password" placeholder="••••••••" secureTextEntry autoComplete="current-password" value={password} onChangeText={setPassword} />

          {formError ? <Text style={styles.formError}>{formError}</Text> : null}

          <Pressable
            onPress={handleSignIn}
            disabled={loading}
            style={({ pressed }) => [styles.submitBtn, (pressed || loading) && styles.submitBtnPressed]}
          >
            <Text style={styles.submitBtnText}>{loading ? 'Signing in…' : 'Sign in'}</Text>
          </Pressable>
        </View>

        <Link href="/" style={styles.backLink}>
          ← Back to Kicko
        </Link>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: dark.bg, alignItems: 'center', justifyContent: 'center', padding: 24 },
  wrap: { width: '100%', maxWidth: 360 },

  brandBlock: { alignItems: 'center', marginBottom: 32 },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  wordmark: { fontFamily: fonts.serif, fontSize: 22, color: dark.text, letterSpacing: -0.5 },
  roleTag: { fontFamily: fonts.sansBold, fontSize: 11, color: dark.textSoft, letterSpacing: 0.5, marginTop: 6 },

  title: { fontFamily: fonts.serifMedium, fontSize: 23, color: dark.text, marginBottom: 6, textAlign: 'center' },
  subtitle: {
    fontFamily: fonts.sans,
    fontSize: 13.5,
    lineHeight: 19,
    color: dark.textSoft,
    marginBottom: 28,
    textAlign: 'center',
  },

  card: {
    backgroundColor: dark.surface,
    borderWidth: 1,
    borderColor: dark.border,
    borderRadius: 18,
    padding: 24,
  },

  field: { marginBottom: 16 },
  fieldLabel: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 11,
    color: dark.textSoft,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: dark.border,
    backgroundColor: dark.bg,
    borderRadius: 10,
    paddingVertical: 13,
    paddingHorizontal: 16,
    fontFamily: fonts.sans,
    fontSize: 14,
    color: dark.text,
  },

  formError: { fontFamily: fonts.sans, fontSize: 12.5, color: dark.danger, marginBottom: 4, lineHeight: 18 },

  submitBtn: {
    backgroundColor: dark.accent,
    borderRadius: 999,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  submitBtnPressed: { opacity: 0.85 },
  submitBtnText: { fontFamily: fonts.sansBold, fontSize: 15, color: dark.accentText },

  backLink: {
    fontFamily: fonts.sansMedium,
    fontSize: 12.5,
    color: dark.textSoft,
    textAlign: 'center',
    marginTop: 24,
  },
});
