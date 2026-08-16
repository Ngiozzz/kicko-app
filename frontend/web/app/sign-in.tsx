import { useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { Link, router } from 'expo-router';
import { colors, fonts } from '@kicko/shared';
import { Button, Field } from '../src/components/ui';
import { AuthLayout } from '../src/components/AuthLayout';
import { supabase, supabaseConfigured } from '@kicko/shared';

const BULLETS = [
  'Real-time bookings across every court you manage',
  'Clear payout tracking, no spreadsheets',
  'Add managers and staff without giving up control',
];

type FieldErrors = { email?: string; password?: string };

export default function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function validateEmail(value: string) {
    if (!value) return 'Enter your email.';
    if (!/^\S+@\S+\.\S+$/.test(value)) return 'That email doesn’t look right.';
    return undefined;
  }

  function validatePassword(value: string) {
    if (!value) return 'Enter your password.';
    return undefined;
  }

  async function handleSignIn() {
    setFormError(null);
    const errors: FieldErrors = { email: validateEmail(email), password: validatePassword(password) };
    setFieldErrors(errors);
    if (errors.email || errors.password) return;

    if (!supabaseConfigured) {
      setFormError('Supabase isn’t connected yet — add your project URL and anon key to .env to sign in for real.');
      return;
    }

    setLoading(true);
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);

    if (signInError) {
      setFormError(signInError.message);
      return;
    }
    router.replace('/');
  }

  return (
    <AuthLayout headline="Good to have you back." subhead="Everything you need to run your venues, in one place." bullets={BULLETS}>
      <Text style={styles.title}>Sign in</Text>
      <Text style={styles.subtitle}>Enter your details to get back to your dashboard.</Text>

      <Field
        label="Email"
        placeholder="you@example.com"
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
        onBlur={() => setFieldErrors((e) => ({ ...e, email: validateEmail(email) }))}
        error={fieldErrors.email}
      />
      <Field
        label="Password"
        placeholder="••••••••"
        secureTextEntry
        autoComplete="current-password"
        value={password}
        onChangeText={setPassword}
        onBlur={() => setFieldErrors((e) => ({ ...e, password: validatePassword(password) }))}
        error={fieldErrors.password}
      />

      <Link href="/forgot-password" style={styles.forgotLink}>
        Forgot password?
      </Link>

      {formError ? <Text style={styles.formError}>{formError}</Text> : null}

      <Button title={loading ? 'Signing in…' : 'Sign in'} onPress={handleSignIn} disabled={loading} />

      <Text style={styles.footNote}>
        New to Kicko?{' '}
        <Link href="/sign-up" style={styles.footLink}>
          Create an account
        </Link>
      </Text>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  title: { fontFamily: fonts.serif, fontSize: 27, color: colors.text, marginBottom: 6 },
  subtitle: { fontFamily: fonts.sans, fontSize: 14, color: colors.textSoft, lineHeight: 20, marginBottom: 28 },
  forgotLink: {
    fontFamily: fonts.sansMedium,
    fontSize: 12.5,
    color: colors.textSoft,
    textAlign: 'right',
    marginTop: -8,
    marginBottom: 8,
  },
  formError: {
    fontFamily: fonts.sans,
    fontSize: 12.5,
    color: colors.danger,
    marginBottom: 4,
    lineHeight: 18,
  },
  footNote: { fontFamily: fonts.sans, fontSize: 13, color: colors.textSoft, marginTop: 24 },
  footLink: { fontFamily: fonts.sansBold, color: colors.accent },
});
