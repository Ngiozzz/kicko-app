import { useEffect, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { apiFetch, colors, fonts, radius, supabase } from '@kicko/shared';
import { Button, Field } from '../../../src/components/ui';
import { isDarkMode, setDarkMode } from '../../../src/lib/theme';

type Account = { name: string; email: string; phone: string | null };

function SettingsCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{title}</Text>
      {children}
    </View>
  );
}

export default function AdminRoleSettings() {
  const [account, setAccount] = useState<Account | null>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dark, setDark] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordSaved, setPasswordSaved] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  useEffect(() => {
    if (Platform.OS === 'web') setDark(isDarkMode());
    (async () => {
      try {
        const { user } = await apiFetch<{ user: Account }>('/api/account/me');
        setAccount(user);
        setName(user.name);
        setPhone(user.phone ?? '');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Could not load your account.');
      }
    })();
  }, []);

  async function handleSave() {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const { user } = await apiFetch<{ user: Account }>('/api/account/me', {
        method: 'PATCH',
        body: JSON.stringify({ name, phone: phone || null }),
      });
      setAccount(user);
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save changes.');
    } finally {
      setSaving(false);
    }
  }

  function handleToggleDark() {
    const next = !dark;
    setDark(next);
    setDarkMode(next);
  }

  // Changes the password directly via Supabase's own client-side auth —
  // same "auth stays client-side" split the rest of the app follows (no
  // backend endpoint needed; the active session is proof enough of who's
  // asking, same as how Supabase treats it everywhere else).
  async function handleChangePassword() {
    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords don't match.");
      return;
    }
    setPasswordSaving(true);
    setPasswordError(null);
    setPasswordSaved(false);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      setNewPassword('');
      setConfirmPassword('');
      setPasswordSaved(true);
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : 'Could not change your password.');
    } finally {
      setPasswordSaving(false);
    }
  }

  return (
    <View>
      <Text style={styles.title}>Role settings</Text>
      <Text style={styles.subtitle}>Your admin profile and appearance preferences.</Text>

      <SettingsCard title="Profile">
        {account === null && !error ? (
          <ActivityIndicator color={colors.accent} />
        ) : (
          <>
            <Field label="Full name" value={name} onChangeText={setName} />
            <Field label="Email" value={account?.email ?? ''} editable={false} />
            <Field label="Phone" value={phone} onChangeText={setPhone} placeholder="+254 700 000 000" keyboardType="phone-pad" />
            {error ? <Text style={styles.error}>{error}</Text> : null}
            {saved ? <Text style={styles.saved}>Saved.</Text> : null}
            <Button title={saving ? 'Saving…' : 'Save changes'} onPress={handleSave} disabled={saving} />
          </>
        )}
      </SettingsCard>

      <SettingsCard title="Password">
        <Field label="New password" placeholder="At least 8 characters" secureTextEntry value={newPassword} onChangeText={setNewPassword} />
        <Field label="Confirm new password" placeholder="Re-enter it" secureTextEntry value={confirmPassword} onChangeText={setConfirmPassword} />
        {passwordError ? <Text style={styles.error}>{passwordError}</Text> : null}
        {passwordSaved ? <Text style={styles.saved}>Password changed.</Text> : null}
        <Button title={passwordSaving ? 'Saving…' : 'Change password'} onPress={handleChangePassword} disabled={passwordSaving} />
      </SettingsCard>

      <SettingsCard title="Appearance">
        <View style={styles.toggleRow}>
          <View style={styles.toggleText}>
            <Text style={styles.toggleTitle}>Dark mode</Text>
            <Text style={styles.toggleSub}>Switch between light and dark themes</Text>
          </View>
          <Pressable onPress={handleToggleDark} style={styles.outlineBtnSm}>
            <Text style={styles.outlineBtnSmText}>Toggle</Text>
          </Pressable>
        </View>
      </SettingsCard>
    </View>
  );
}

const styles = StyleSheet.create({
  title: { fontFamily: fonts.serif, fontSize: 26, color: colors.text, marginBottom: 4 },
  subtitle: { fontFamily: fonts.sans, fontSize: 13.5, color: colors.textSoft, marginBottom: 26 },

  card: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, padding: 24, marginBottom: 20, maxWidth: 560 },
  cardTitle: { fontFamily: fonts.serifMedium, fontSize: 16, color: colors.text, marginBottom: 18 },

  toggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 16 },
  toggleText: { flex: 1 },
  toggleTitle: { fontFamily: fonts.sansSemiBold, fontSize: 13.5, color: colors.text },
  toggleSub: { fontFamily: fonts.sans, fontSize: 12, color: colors.textSoft, marginTop: 2 },

  outlineBtnSm: { borderWidth: 1.5, borderColor: colors.border, borderRadius: radius.pill, paddingVertical: 8, paddingHorizontal: 16 },
  outlineBtnSmText: { fontFamily: fonts.sansSemiBold, fontSize: 12.5, color: colors.text },

  error: { fontFamily: fonts.sans, fontSize: 12.5, color: colors.danger, marginBottom: 8 },
  saved: { fontFamily: fonts.sans, fontSize: 12.5, color: colors.good, marginBottom: 8 },
});
