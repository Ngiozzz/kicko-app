import { useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { Link, router, useLocalSearchParams } from 'expo-router';
import { apiFetch, colors, fonts } from '@kicko/shared';
import { Button, Field } from '../src/components/ui';
import { AuthLayout } from '../src/components/AuthLayout';
import { supabase, supabaseConfigured } from '@kicko/shared';
import { resolveHomeRoute } from '../src/lib/roleRoute';
import { Role } from '../src/content/roleContent';
import { signInContent } from '../src/content/signInContent';

const ROLES: Role[] = ['player', 'owner', 'manager'];

function parseRole(value: string | string[] | undefined): Role {
  const candidate = Array.isArray(value) ? value[0] : value;
  return (ROLES as string[]).includes(candidate ?? '') ? (candidate as Role) : 'owner';
}

function SignUpFootNote({ role }: { role: Role }) {
  if (role === 'manager') {
    return <Text style={styles.footNote}>Managers don't sign up directly — ask your venue owner to add you.</Text>;
  }
  return (
    <Text style={styles.footNote}>
      New to Kicko?{' '}
      <Link href={`/sign-up?role=${role}`} style={styles.footLink}>
        Create an account
      </Link>
    </Text>
  );
}

type FieldErrors = { email?: string; password?: string };

export default function SignIn() {
  // /sign-in?role=player|owner|manager — only picks which copy shows on
  // the brand panel and the page title, so it's always clear whose
  // sign-in this is. Defaults to owner when reached with no context
  // (e.g. a bare /sign-in link, or forgot/reset-password's "back" link).
  const { role: roleParam } = useLocalSearchParams<{ role?: string }>();
  const role = parseRole(roleParam);
  const copy = signInContent[role];

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
    if (signInError) {
      setLoading(false);
      setFormError(signInError.message);
      return;
    }

    // Route by the account's real role, not by the ?role= this page was
    // opened with — that's just which copy to show, not a guarantee of
    // who's actually signing in.
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
    <AuthLayout headline={copy.headline} subhead={copy.subhead} bullets={copy.bullets}>
      <Text style={styles.title}>{copy.roleLabel} sign in</Text>
      <Text style={styles.subtitle}>Enter your details to get back to your account.</Text>

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

      <SignUpFootNote role={role} />
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
