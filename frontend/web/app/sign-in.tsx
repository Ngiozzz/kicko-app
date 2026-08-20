import { useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { Link, router, useLocalSearchParams } from 'expo-router';
import { apiFetch, colors, fonts } from '@kicko/shared';
import { Button, Field } from '../src/components/ui';
import { AuthLayout } from '../src/components/AuthLayout';
import { supabase, supabaseConfigured } from '@kicko/shared';
import { resolveNext } from '../src/lib/roleRoute';
import { Role } from '../src/content/roleContent';
import { signInContent } from '../src/content/signInContent';

const ROLES: Role[] = ['player', 'owner', 'manager'];

function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

// Supabase's Phone auth provider needs a real SMS provider (Twilio, etc.)
// configured just to be turned on, even for a password-only login that
// never sends an OTP — not worth setting up for that. So managers sign
// in through the already-working Email provider with a deterministic,
// never-shown placeholder address computed from their phone. Must match
// managerPhoneToEmail in backend/src/controllers/managers.controller.ts
// exactly, or a manager's real password stops matching their account.
function managerPhoneToEmail(phone: string): string {
  return `${phone.replace(/\D/g, '')}@manager.kicko.internal`;
}

function parseRole(value: string | string[] | undefined): Role {
  const candidate = Array.isArray(value) ? value[0] : value;
  return (ROLES as string[]).includes(candidate ?? '') ? (candidate as Role) : 'owner';
}

function SignUpFootNote({ role, next }: { role: Role; next?: string }) {
  if (role === 'manager') {
    return <Text style={styles.footNote}>Managers don't sign up directly — ask your venue owner to add you.</Text>;
  }
  return (
    <Text style={styles.footNote}>
      New to Kicko?{' '}
      <Link href={`/sign-up?role=${role}${next ? `&next=${encodeURIComponent(next)}` : ''}`} style={styles.footLink}>
        Create an account
      </Link>
    </Text>
  );
}

type FieldErrors = { identifier?: string; password?: string };

export default function SignIn() {
  // /sign-in?role=player|owner|manager — only picks which copy shows on
  // the brand panel and the page title, so it's always clear whose
  // sign-in this is. Defaults to owner when reached with no context
  // (e.g. a bare /sign-in link, or forgot/reset-password's "back" link).
  const { role: roleParam, next: nextParam } = useLocalSearchParams<{ role?: string; next?: string }>();
  const role = parseRole(roleParam);
  const next = firstParam(nextParam);
  const copy = signInContent[role];
  // Managers are invited by phone, not email (see owner/managers.tsx) —
  // many don't have one — so they're the one role that signs in with
  // phone + password instead (see managerPhoneToEmail above for how).
  const usesPhone = role === 'manager';

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function validateIdentifier(value: string) {
    if (!value) return usesPhone ? 'Enter your phone number.' : 'Enter your email.';
    if (usesPhone ? !/^\+?[0-9]{7,15}$/.test(value.trim()) : !/^\S+@\S+\.\S+$/.test(value)) {
      return usesPhone ? 'That phone number doesn’t look right.' : 'That email doesn’t look right.';
    }
    return undefined;
  }

  function validatePassword(value: string) {
    if (!value) return 'Enter your password.';
    return undefined;
  }

  async function handleSignIn() {
    setFormError(null);
    const errors: FieldErrors = { identifier: validateIdentifier(identifier), password: validatePassword(password) };
    setFieldErrors(errors);
    if (errors.identifier || errors.password) return;

    if (!supabaseConfigured) {
      setFormError('Supabase isn’t connected yet — add your project URL and anon key to .env to sign in for real.');
      return;
    }

    setLoading(true);
    const { error: signInError } = usesPhone
      ? await supabase.auth.signInWithPassword({ email: managerPhoneToEmail(identifier.trim()), password })
      : await supabase.auth.signInWithPassword({ email: identifier, password });
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
      router.replace(resolveNext(next, user.role));
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
        label={usesPhone ? 'Phone number' : 'Email'}
        placeholder={usesPhone ? '+254 700 000 000' : 'you@example.com'}
        autoCapitalize="none"
        autoComplete={usesPhone ? 'tel' : 'email'}
        keyboardType={usesPhone ? 'phone-pad' : 'email-address'}
        value={identifier}
        onChangeText={setIdentifier}
        onBlur={() => setFieldErrors((e) => ({ ...e, identifier: validateIdentifier(identifier) }))}
        error={fieldErrors.identifier}
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

      {!usesPhone && (
        <Link href="/forgot-password" style={styles.forgotLink}>
          Forgot password?
        </Link>
      )}
      {usesPhone && <Text style={styles.forgotNote}>Forgot your password? Ask your venue owner to set a new one.</Text>}

      {formError ? <Text style={styles.formError}>{formError}</Text> : null}

      <Button title={loading ? 'Signing in…' : 'Sign in'} onPress={handleSignIn} disabled={loading} />

      <SignUpFootNote role={role} next={next} />
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
  forgotNote: {
    fontFamily: fonts.sans,
    fontSize: 12,
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
