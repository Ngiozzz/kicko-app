import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Link, router } from 'expo-router';
import { colors, fonts, radius } from '../src/theme';
import { Button, Card, Field } from '../src/components/ui';
import { supabase, supabaseConfigured } from '../src/lib/supabase';

type Role = 'player' | 'owner';

export default function SignUp() {
  const [role, setRole] = useState<Role>('player');
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
      options: { data: { name, phone: phone || null, role } },
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
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.wrap}>
          <Text style={styles.eyebrow}>Join Kicko</Text>
          <Text style={styles.title}>Create your account</Text>
          <Text style={styles.subtitle}>Book pitches in minutes, or list your venue and start taking bookings.</Text>

          <Card>
            <Text style={styles.fieldLabel}>I'm signing up as</Text>
            <View style={styles.roleRow}>
              <RolePick label="Player" active={role === 'player'} onPress={() => setRole('player')} />
              <RolePick label="Venue owner" active={role === 'owner'} onPress={() => setRole('owner')} />
            </View>

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

function RolePick({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.rolePick, active && styles.rolePickActive]}>
      <Text style={[styles.rolePickText, active && styles.rolePickTextActive]}>{label}</Text>
    </Pressable>
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
  fieldLabel: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 11,
    color: colors.textSoft,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  roleRow: { flexDirection: 'row', gap: 10, marginBottom: 18 },
  rolePick: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bg,
    alignItems: 'center',
  },
  rolePickActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  rolePickText: { fontFamily: fonts.sansSemiBold, fontSize: 13, color: colors.text },
  rolePickTextActive: { color: colors.accentText },
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
