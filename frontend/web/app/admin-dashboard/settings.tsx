import { useEffect, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { apiFetch, colors, fonts, radius } from '@kicko/shared';
import { Button, Field } from '../../src/components/ui';
import { isDarkMode, setDarkMode } from '../../src/lib/theme';

type Account = { name: string; email: string; phone: string | null };

function SettingsCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{title}</Text>
      {children}
    </View>
  );
}

export default function AdminSettings() {
  const [account, setAccount] = useState<Account | null>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dark, setDark] = useState(false);

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

  return (
    <View>
      <View style={styles.welcome}>
        <Text style={styles.welcomeTitle}>Settings</Text>
        <Text style={styles.welcomeSub}>Manage your admin account and preferences.</Text>
      </View>

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
  welcome: { marginBottom: 26 },
  welcomeTitle: { fontFamily: fonts.serif, fontSize: 26, color: colors.text, marginBottom: 4 },
  welcomeSub: { fontFamily: fonts.sans, fontSize: 14, color: colors.textSoft },

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
