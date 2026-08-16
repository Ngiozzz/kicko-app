import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Link, router } from 'expo-router';
import { colors, fonts } from '../src/theme';
import { Button, Card, Field } from '../src/components/ui';
import { supabase, supabaseConfigured } from '../src/lib/supabase';

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
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.wrap}>
          <Text style={styles.eyebrow}>Welcome back</Text>
          <Text style={styles.title}>Sign in to Kicko</Text>
          <Text style={styles.subtitle}>
            Book pitches, manage venues, or run the platform — pick up right where you left off.
          </Text>

          <Card>
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
          </Card>

          <Text style={styles.footNote}>
            New to Kicko?{' '}
            <Link href="/sign-up" style={styles.footLink}>
              Create an account
            </Link>
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  scroll: { flexGrow: 1, justifyContent: 'center', paddingVertical: 48 },
  wrap: { width: '100%', maxWidth: 420, alignSelf: 'center', paddingHorizontal: 24 },
  eyebrow: {
    fontFamily: fonts.sansBold,
    fontSize: 12,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: colors.accent,
    textAlign: 'center',
    marginBottom: 10,
  },
  title: {
    fontFamily: fonts.serif,
    fontSize: 30,
    color: colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: fonts.sans,
    fontSize: 14,
    color: colors.textSoft,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 32,
  },
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
    marginTop: 26,
  },
  footLink: {
    fontFamily: fonts.sansBold,
    color: colors.accent,
  },
});
