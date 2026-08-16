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

// Reached via the link in the password-reset email. Supabase's client SDK
// picks the recovery token up from the URL automatically (detectSessionInUrl,
// on by default) and turns it into a session — updateUser() below just
// changes the password on that session, no token handling needed here.
export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [passwordError, setPasswordError] = useState<string | undefined>();
  const [confirmError, setConfirmError] = useState<string | undefined>();
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  function validatePassword(value: string) {
    if (!value) return 'Choose a new password.';
    if (value.length < 8) return 'At least 8 characters.';
    return undefined;
  }
  function validateConfirm(value: string, pw: string) {
    if (!value) return 'Confirm your new password.';
    if (value !== pw) return 'Passwords don’t match.';
    return undefined;
  }

  async function handleSave() {
    setFormError(null);
    const pwErr = validatePassword(password);
    const cfErr = validateConfirm(confirm, password);
    setPasswordError(pwErr);
    setConfirmError(cfErr);
    if (pwErr || cfErr) return;

    if (!supabaseConfigured) {
      setFormError('Supabase isn’t connected yet — add your project URL and anon key to .env.');
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (error) {
      setFormError(
        error.message.includes('session')
          ? 'This reset link has expired. Request a new one from the sign-in page.'
          : error.message
      );
      return;
    }
    setDone(true);
  }

  return (
    <AuthLayout headline="Good to have you back." subhead="Everything you need to run your venues, in one place." bullets={BULLETS}>
      {done ? (
        <>
          <Text style={styles.title}>Password updated</Text>
          <Text style={styles.subtitle}>You're all set — sign in with your new password.</Text>
          <Button title="Go to sign in" onPress={() => router.replace('/sign-in')} />
        </>
      ) : (
        <>
          <Text style={styles.title}>Choose a new password</Text>
          <Text style={styles.subtitle}>At least 8 characters.</Text>

          <Field
            label="New password"
            placeholder="At least 8 characters"
            secureTextEntry
            autoComplete="new-password"
            value={password}
            onChangeText={setPassword}
            onBlur={() => setPasswordError(validatePassword(password))}
            error={passwordError}
          />
          <Field
            label="Confirm password"
            placeholder="Re-enter your password"
            secureTextEntry
            autoComplete="new-password"
            value={confirm}
            onChangeText={setConfirm}
            onBlur={() => setConfirmError(validateConfirm(confirm, password))}
            error={confirmError}
          />

          {formError ? <Text style={styles.formError}>{formError}</Text> : null}

          <Button title={loading ? 'Saving…' : 'Save new password'} onPress={handleSave} disabled={loading} />
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
