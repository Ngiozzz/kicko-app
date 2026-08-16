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

type FieldErrors = { name?: string; email?: string; password?: string };

// Web sign-up is owner-only — players sign up on mobile, and
// managers/admins are never self-registered (an owner adds managers
// directly; admins are provisioned by hand), matching Thurfa's own
// signup-trigger convention.
export default function SignUp() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function validateName(value: string) {
    return value ? undefined : 'Enter your name.';
  }
  function validateEmail(value: string) {
    if (!value) return 'Enter your email.';
    if (!/^\S+@\S+\.\S+$/.test(value)) return 'That email doesn’t look right.';
    return undefined;
  }
  function validatePassword(value: string) {
    if (!value) return 'Choose a password.';
    if (value.length < 8) return 'At least 8 characters.';
    return undefined;
  }

  async function handleSignUp() {
    setFormError(null);
    const errors: FieldErrors = {
      name: validateName(name),
      email: validateEmail(email),
      password: validatePassword(password),
    };
    setFieldErrors(errors);
    if (errors.name || errors.email || errors.password) return;

    if (!supabaseConfigured) {
      setFormError('Supabase isn’t connected yet — add your project URL and anon key to .env to create an account for real.');
      return;
    }

    setLoading(true);
    // Everything Supabase needs to create the profile row goes in
    // options.data — a database trigger reads it and inserts into
    // public.users automatically (see backend/supabase/migrations/
    // ..._auth_signup_trigger.sql). No separate insert call from the
    // client: the backend owns public.users, this is the one exception
    // baked into the trigger itself, same pattern Thurfa uses.
    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name, phone: phone || null, role: 'owner' } },
    });
    setLoading(false);

    if (signUpError) {
      setFormError(signUpError.message);
      return;
    }
    router.replace('/');
  }

  return (
    <AuthLayout headline="Turn your pitch into a business." subhead="List your venue, take bookings automatically, and get paid on time." bullets={BULLETS}>
      <Text style={styles.title}>Create your owner account</Text>
      <Text style={styles.subtitle}>Manage your venues, review bookings, and get paid — all from one dashboard.</Text>

      <Field
        label="Full name"
        placeholder="Jane Doe"
        autoComplete="name"
        value={name}
        onChangeText={setName}
        onBlur={() => setFieldErrors((e) => ({ ...e, name: validateName(name) }))}
        error={fieldErrors.name}
      />
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
        label="Phone (optional)"
        placeholder="+254 700 000 000"
        autoComplete="tel"
        keyboardType="phone-pad"
        value={phone}
        onChangeText={setPhone}
      />
      <Field
        label="Password"
        placeholder="At least 8 characters"
        secureTextEntry
        autoComplete="new-password"
        value={password}
        onChangeText={setPassword}
        onBlur={() => setFieldErrors((e) => ({ ...e, password: validatePassword(password) }))}
        error={fieldErrors.password}
      />

      {formError ? <Text style={styles.formError}>{formError}</Text> : null}

      <Button title={loading ? 'Creating account…' : 'Create account'} onPress={handleSignUp} disabled={loading} />

      <Text style={styles.footNote}>
        Already have an account?{' '}
        <Link href="/sign-in" style={styles.footLink}>
          Sign in
        </Link>
      </Text>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  title: { fontFamily: fonts.serif, fontSize: 24, color: colors.text, marginBottom: 6 },
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
