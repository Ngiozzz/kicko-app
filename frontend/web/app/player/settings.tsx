import { useEffect, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { apiFetch, colors, fonts, radius } from '@kicko/shared';
import { Button, Field } from '../../src/components/ui';
import { SportIcon, Sport } from '../../src/components/SportIcon';
import { getSportContent } from '../../src/content/sportContent';
import { isDarkMode, setDarkMode } from '../../src/lib/theme';

type Account = { name: string; email: string; phone: string | null; sport: string | null; position: string | null };

const SPORTS: { sport: Sport; label: string }[] = [
  { sport: 'football', label: 'Football' },
  { sport: 'basketball', label: 'Basketball' },
  { sport: 'tennis', label: 'Tennis' },
  { sport: 'padel', label: 'Padel' },
  { sport: 'volleyball', label: 'Volleyball' },
  { sport: 'rugby', label: 'Rugby' },
];

function SettingsCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{title}</Text>
      {children}
    </View>
  );
}

function ToggleRow({
  title,
  sub,
  value,
  onValueChange,
  last,
}: {
  title: string;
  sub: string;
  value: boolean;
  onValueChange: (v: boolean) => void;
  last?: boolean;
}) {
  return (
    <View style={[styles.toggleRow, last && styles.toggleRowLast]}>
      <View style={styles.toggleText}>
        <Text style={styles.toggleTitle}>{title}</Text>
        <Text style={styles.toggleSub}>{sub}</Text>
      </View>
      <Switch value={value} onValueChange={onValueChange} trackColor={{ true: colors.accent, false: colors.border }} />
    </View>
  );
}

export default function PlayerSettings() {
  const [account, setAccount] = useState<Account | null>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [sport, setSport] = useState<string | null>(null);
  const [position, setPosition] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [prefSaving, setPrefSaving] = useState(false);
  const [prefSaved, setPrefSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [notifyBookings, setNotifyBookings] = useState(true);
  const [notifyPriceDrops, setNotifyPriceDrops] = useState(true);
  const [notifyMarketing, setNotifyMarketing] = useState(false);

  const [dark, setDark] = useState(false);

  useEffect(() => {
    if (Platform.OS === 'web') setDark(isDarkMode());
    (async () => {
      try {
        const { user } = await apiFetch<{ user: Account }>('/api/account/me');
        setAccount(user);
        setName(user.name);
        setPhone(user.phone ?? '');
        setSport(user.sport);
        setPosition(user.position);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Could not load your account.');
      }
    })();
  }, []);

  async function handleSaveProfile() {
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

  async function handleSavePreferences() {
    setPrefSaving(true);
    setError(null);
    setPrefSaved(false);
    try {
      const { user } = await apiFetch<{ user: Account }>('/api/account/me', {
        method: 'PATCH',
        body: JSON.stringify({ name, phone: phone || null, sport, position }),
      });
      setAccount(user);
      setPrefSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save your preferences.');
    } finally {
      setPrefSaving(false);
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
        <Text style={styles.welcomeSub}>Manage your account, notifications, and preferences.</Text>
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
            <Button title={saving ? 'Saving…' : 'Save changes'} onPress={handleSaveProfile} disabled={saving} />
          </>
        )}
      </SettingsCard>

      {account && (
        <SettingsCard title="Playing preferences">
          <Text style={styles.prefSub}>Let venues and teammates know what you play and where.</Text>
          <Text style={styles.pickerLabel}>Sport</Text>
          <View style={styles.sportRow}>
            {SPORTS.map(({ sport: s, label }) => {
              const active = sport === s;
              return (
                <Pressable key={s} onPress={() => setSport(s)} style={[styles.sportChip, active && styles.sportChipActive]}>
                  <SportIcon sport={s} size={18} />
                  <Text style={[styles.sportChipText, active && styles.sportChipTextActive]}>{label}</Text>
                </Pressable>
              );
            })}
          </View>
          {getSportContent(sport).positions.length > 0 && (
            <>
              <Text style={[styles.pickerLabel, { marginTop: 14 }]}>Position</Text>
              <View style={styles.sportRow}>
                {getSportContent(sport).positions.map((p) => {
                  const active = position === p;
                  return (
                    <Pressable key={p} onPress={() => setPosition(p)} style={[styles.pill, active && styles.pillActive]}>
                      <Text style={[styles.pillText, active && styles.pillTextActive]}>{p}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </>
          )}
          {prefSaved ? <Text style={[styles.saved, { marginTop: 14 }]}>Saved.</Text> : null}
          <Button title={prefSaving ? 'Saving…' : 'Save preferences'} onPress={handleSavePreferences} disabled={prefSaving} />
        </SettingsCard>
      )}

      <SettingsCard title="Notifications">
        <ToggleRow
          title="Booking confirmations"
          sub="Get notified when a booking is confirmed"
          value={notifyBookings}
          onValueChange={setNotifyBookings}
        />
        <ToggleRow
          title="Price drops"
          sub="Alerts when a saved venue lowers pricing"
          value={notifyPriceDrops}
          onValueChange={setNotifyPriceDrops}
        />
        <ToggleRow
          title="Marketing emails"
          sub="Occasional offers and updates"
          value={notifyMarketing}
          onValueChange={setNotifyMarketing}
          last
        />
      </SettingsCard>

      <SettingsCard title="Appearance">
        <View style={[styles.toggleRow, styles.toggleRowLast]}>
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
  prefSub: { fontFamily: fonts.sans, fontSize: 13, color: colors.textSoft, marginTop: -10, marginBottom: 16 },

  pickerLabel: { fontFamily: fonts.sansSemiBold, fontSize: 11, color: colors.textSoft, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },
  sportRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  sportChip: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderColor: colors.border, borderRadius: radius.pill, paddingVertical: 9, paddingHorizontal: 14 },
  sportChipActive: { backgroundColor: colors.accentSoft, borderColor: colors.accent },
  sportChipText: { fontFamily: fonts.sansSemiBold, fontSize: 13, color: colors.textSoft },
  sportChipTextActive: { color: colors.accent },
  pill: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.pill, paddingVertical: 9, paddingHorizontal: 16 },
  pillActive: { backgroundColor: colors.accentSoft, borderColor: colors.accent },
  pillText: { fontFamily: fonts.sansSemiBold, fontSize: 13, color: colors.textSoft },
  pillTextActive: { color: colors.accent },

  toggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border, gap: 16 },
  toggleRowLast: { borderBottomWidth: 0 },
  toggleText: { flex: 1 },
  toggleTitle: { fontFamily: fonts.sansSemiBold, fontSize: 13.5, color: colors.text },
  toggleSub: { fontFamily: fonts.sans, fontSize: 12, color: colors.textSoft, marginTop: 2 },

  outlineBtnSm: { borderWidth: 1.5, borderColor: colors.border, borderRadius: radius.pill, paddingVertical: 8, paddingHorizontal: 16 },
  outlineBtnSmText: { fontFamily: fonts.sansSemiBold, fontSize: 12.5, color: colors.text },

  error: { fontFamily: fonts.sans, fontSize: 12.5, color: colors.danger, marginBottom: 8 },
  saved: { fontFamily: fonts.sans, fontSize: 12.5, color: colors.good, marginBottom: 8 },
});
