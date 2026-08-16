import { useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { Link } from 'expo-router';
import { colors, fonts } from '@kicko/shared';
import { Button, Field } from '../src/components/ui';
import { AuthLayout } from '../src/components/AuthLayout';
import { supabase, supabaseConfigured } from '@kicko/shared';

const BULLETS = [
  'Real-time bookings across every court you manage',
  'Clear payout tracking, no spreadsheets',
  'Add managers and staff without giving up control',
];

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState<string | undefined>();
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  function validateEmail(value: string) {
    if (!value) return 'Enter your email.';
    if (!/^\S+@\S+\.\S+$/.test(value)) return 'That email doesn’t look right.';
    return undefined;
  }

  async function handleSend() {
    setFormError(null);
    const error = validateEmail(email);
    setEmailError(error);
    if (error) return;

    if (!supabaseConfigured) {
      setFormError('Supabase isn’t connected yet — add your project URL and anon key to .env to send a reset email.');
      return;
    }

    setLoading(true);
    const redirectTo = typeof window !== 'undefined' ? `${window.location.origin}/reset-password` : undefined;
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
    setLoading(false);

    // Show the same confirmation regardless of whether the email exists —
    // don't let this screen be used to check which addresses have accounts.
    if (resetError && resetError.status && resetError.status >= 500) {
      setFormError('Something went wrong sending that email. Try again in a moment.');
      return;
    }
    setSent(true);
  }

  return (
    <AuthLayout headline="Good to have you back." subhead="Everything you need to run your venues, in one place." bullets={BULLETS}>
      {sent ? (
        <>
          <Text style={styles.title}>Check your email</Text>
          <Text style={styles.subtitle}>
            If an account exists for {email}, we’ve sent a link to reset your password.
          </Text>
        </>
      ) : (
        <>
          <Text style={styles.title}>Reset your password</Text>
          <Text style={styles.subtitle}>Enter the email on your account and we’ll send you a reset link.</Text>

          <Field
            label="Email"
            placeholder="you@example.com"
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
            onBlur={() => setEmailError(validateEmail(email))}
            error={emailError}
          />

          {formError ? <Text style={styles.formError}>{formError}</Text> : null}

          <Button title={loading ? 'Sending…' : 'Send reset link'} onPress={handleSend} disabled={loading} />
        </>
      )}

      <Text style={styles.footNote}>
        <Link href="/sign-in" style={styles.footLink}>
          Back to sign in
        </Link>
      </Text>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  title: { fontFamily: fonts.serif, fontSize: 27, color: colors.text, marginBottom: 6 },
  subtitle: { fontFamily: fonts.sans, fontSize: 14, color: colors.textSoft, lineHeight: 20, marginBottom: 28 },
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
