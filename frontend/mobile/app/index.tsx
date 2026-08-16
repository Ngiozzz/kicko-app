import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link, router } from 'expo-router';
import { colors, fonts } from '@kicko/shared';
import { Button, Field } from '../src/components/ui';
import { LogoMark } from '../src/components/Logo';
import { supabase, supabaseConfigured } from '@kicko/shared';

// Mobile is the player-facing app — a native full-bleed form, not the
// floating-card-on-a-nav-bar look web uses (see index.web.tsx). No browser
// chrome to sit inside here, so the screen itself carries the branding.
export default function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSignIn() {
    setError(null);

    if (!email || !password) {
      setError('Enter your email and password.');
      return;
    }
    if (!supabaseConfigured) {
      setError('Supabase isn’t connected yet — add your project URL and anon key to .env to sign in for real.');
      return;
    }

    setLoading(true);
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);

    if (signInError) {
      setError(signInError.message);
      return;
    }
    router.replace('/');
  }

  return (
    <SafeAreaView style={styles.flex} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.brand}>
            <LogoMark size={40} />
            <Text style={styles.title}>Welcome back</Text>
            <Text style={styles.subtitle}>Sign in to find a pitch and get playing.</Text>
          </View>

          <View style={styles.form}>
            <Field
              label="Email"
              placeholder="you@example.com"
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
            />
            <Field
              label="Password"
              placeholder="••••••••"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <Button title={loading ? 'Signing in…' : 'Sign in'} onPress={handleSignIn} disabled={loading} />
          </View>

          <Text style={styles.footNote}>
            New to Kicko?{' '}
            <Link href="/sign-up" style={styles.footLink}>
              Create an account
            </Link>
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 28 },
  brand: { alignItems: 'center', marginBottom: 40 },
  title: {
    fontFamily: fonts.serif,
    fontSize: 26,
    color: colors.text,
    marginTop: 18,
    marginBottom: 6,
  },
  subtitle: {
    fontFamily: fonts.sans,
    fontSize: 14,
    color: colors.textSoft,
    textAlign: 'center',
  },
  form: { gap: 2 },
  error: {
    fontFamily: fonts.sans,
    fontSize: 12.5,
    color: colors.danger,
    marginBottom: 4,
    lineHeight: 18,
  },
  footNote: {
    fontFamily: fonts.sans,
    fontSize: 13,
    color: colors.textSoft,
    textAlign: 'center',
    marginTop: 28,
  },
  footLink: {
    fontFamily: fonts.sansBold,
    color: colors.accent,
  },
});
