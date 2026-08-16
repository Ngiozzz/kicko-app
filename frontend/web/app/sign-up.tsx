import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Link, router } from 'expo-router';
import { colors, fonts } from '@kicko/shared';
import { Button, Card, Field } from '../src/components/ui';
import { WebNav } from '../src/components/WebNav';
import { supabase, supabaseConfigured } from '@kicko/shared';

// Web sign-up is owner-only — players sign up on mobile, and
// managers/admins are never self-registered (an owner adds managers
// directly; admins are provisioned by hand), matching Thurfa's own
// signup-trigger convention.
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
      setError(signUpError.message);
      return;
    }
    router.replace('/');
  }

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <WebNav />
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.wrap}>
          <Text style={styles.eyebrow}>List your venue</Text>
          <Text style={styles.title}>Create your owner account</Text>
          <Text style={styles.subtitle}>Manage your venues, review bookings, and get paid — all from one dashboard.</Text>

          <Card>
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
          </Card>

          <Text style={styles.footNote}>
            Already have an account?{' '}
            <Link href="/" style={styles.footLink}>
              Sign in
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
