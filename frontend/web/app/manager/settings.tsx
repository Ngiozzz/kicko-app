import { useEffect, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { apiFetch, colors, fonts, radius } from '@kicko/shared';
import { Button, Field } from '../../src/components/ui';
import { isDarkMode, setDarkMode } from '../../src/lib/theme';

type Account = { name: string; phone: string | null };

function SettingsCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{title}</Text>
      {children}
    </View>
  );
}

export default function ManagerSettings() {
  const [account, setAccount] = useState<Account | null>(null);
  const [name, setName] = useState('');
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
      // Phone isn't sent — it's not editable here at all, see account.controller.ts.
      const { user } = await apiFetch<{ user: Account }>('/api/account/me', { method: 'PATCH', body: JSON.stringify({ name }) });
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
      <Text style={styles.title}>Settings</Text>
      <Text style={styles.subtitle}>Your manager profile and appearance preferences.</Text>

      <SettingsCard title="Profile">
        {account === null && !error ? (
          <ActivityIndicator color={colors.accent} />
        ) : (
          <>
            <Field label="Full name" value={name} onChangeText={setName} />
            <Field label="Phone" value={account?.phone ?? ''} editable={false} />
            <Text style={styles.hint}>Your phone number is how you sign in — ask your venue owner if it needs to change.</Text>
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
  title: { fontFamily: fonts.serif, fontSize: 26, color: colors.text, marginBottom: 4 },
  subtitle: { fontFamily: fonts.sans, fontSize: 13.5, color: colors.textSoft, marginBottom: 26 },

  card: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, padding: 24, marginBottom: 20, maxWidth: 560 },
  cardTitle: { fontFamily: fonts.serifMedium, fontSize: 16, color: colors.text, marginBottom: 18 },

  hint: { fontFamily: fonts.sans, fontSize: 11.5, color: colors.textSoft, marginTop: -10, marginBottom: 16, lineHeight: 16 },

  toggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 16 },
  toggleText: { flex: 1 },
  toggleTitle: { fontFamily: fonts.sansSemiBold, fontSize: 13.5, color: colors.text },
  toggleSub: { fontFamily: fonts.sans, fontSize: 12, color: colors.textSoft, marginTop: 2 },

  outlineBtnSm: { borderWidth: 1.5, borderColor: colors.border, borderRadius: radius.pill, paddingVertical: 8, paddingHorizontal: 16 },
  outlineBtnSmText: { fontFamily: fonts.sansSemiBold, fontSize: 12.5, color: colors.text },

  error: { fontFamily: fonts.sans, fontSize: 12.5, color: colors.danger, marginBottom: 8 },
  saved: { fontFamily: fonts.sans, fontSize: 12.5, color: colors.good, marginBottom: 8 },
});
