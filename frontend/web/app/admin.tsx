import { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, Text, View } from 'react-native';
import { Link, router } from 'expo-router';
import { colors, fonts } from '@kicko/shared';
import { Button, Card, Field } from '../src/components/ui';
import { supabase, supabaseConfigured } from '@kicko/shared';

// Deliberately not part of the public nav or the owner/manager auth flow —
// only reachable via the small "Admin" link in the landing page footer.
// Admins are provisioned by hand (never self-registered, see
// backend/supabase/migrations/..._auth_signup_trigger.sql), so there's no
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
    setLoading(false);

    if (error) {
      setFormError(error.message);
      return;
    }
    router.replace('/');
  }

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.wrap}>
        <Text style={styles.title}>Admin sign in</Text>
        <Text style={styles.subtitle}>Internal access only.</Text>

        <Card>
          <Field
            label="Email"
            placeholder="you@example.com"
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />
          <Field label="Password" placeholder="••••••••" secureTextEntry autoComplete="current-password" value={password} onChangeText={setPassword} />

          {formError ? <Text style={styles.formError}>{formError}</Text> : null}

          <Button title={loading ? 'Signing in…' : 'Sign in'} onPress={handleSignIn} disabled={loading} />
        </Card>

        <Link href="/" style={styles.backLink}>
          Back to Kicko
        </Link>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.text, alignItems: 'center', justifyContent: 'center', padding: 24 },
  wrap: { width: '100%', maxWidth: 340 },
  title: { fontFamily: fonts.serifMedium, fontSize: 22, color: colors.bg, marginBottom: 4, textAlign: 'center' },
  subtitle: {
    fontFamily: fonts.sans,
    fontSize: 13,
    color: 'rgba(247,244,239,0.5)',
    marginBottom: 24,
    textAlign: 'center',
  },
  formError: { fontFamily: fonts.sans, fontSize: 12.5, color: colors.danger, marginBottom: 4, lineHeight: 18 },
  backLink: {
    fontFamily: fonts.sans,
    fontSize: 12.5,
    color: 'rgba(247,244,239,0.45)',
    textAlign: 'center',
    marginTop: 20,
  },
});
