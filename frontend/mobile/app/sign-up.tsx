import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link, router } from 'expo-router';
import { colors, fonts } from '@kicko/shared';
import { Button, Field } from '../src/components/ui';
import { LogoMark } from '../src/components/Logo';
import { supabase, supabaseConfigured } from '@kicko/shared';

// Mobile sign-up is player-only — venue owners register on the web
// dashboard instead (see sign-up.web.tsx).
export default function SignUp() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSignUp() {
    setError(null);

    if (!name || !email || !password) {
      setError('Name, email, and password are all required.');
      return;
    }
    if (password.length < 8) {
      setError('Password needs to be at least 8 characters.');
      return;
    }
    if (!supabaseConfigured) {
      setError('Supabase isn’t connected yet — add your project URL and anon key to .env to create an account for real.');
      return;
    }

    setLoading(true);
    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name, phone: phone || null, role: 'player' } },
    });
    setLoading(false);

    if (signUpError) {
      setError(signUpError.message);
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
            <Text style={styles.title}>Join Kicko</Text>
            <Text style={styles.subtitle}>Book pitches in minutes and get playing.</Text>
          </View>

          <View style={styles.form}>
            <Field label="Full name" placeholder="Jane Doe" value={name} onChangeText={setName} />
            <Field
              label="Email"
              placeholder="you@example.com"
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
            />
            <Field
              label="Phone (optional)"
              placeholder="+254 700 000 000"
              keyboardType="phone-pad"
              value={phone}
              onChangeText={setPhone}
            />
            <Field label="Password" placeholder="At least 8 characters" secureTextEntry value={password} onChangeText={setPassword} />

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <Button title={loading ? 'Creating account…' : 'Create account'} onPress={handleSignUp} disabled={loading} />
          </View>

          <Text style={styles.footNote}>
            Already have an account?{' '}
            <Link href="/" style={styles.footLink}>
              Sign in
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
  brand: { alignItems: 'center', marginBottom: 32 },
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
    marginTop: 24,
  },
  footLink: {
    fontFamily: fonts.sansBold,
    color: colors.accent,
  },
});
