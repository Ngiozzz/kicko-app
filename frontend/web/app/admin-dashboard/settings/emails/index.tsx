import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Link } from 'expo-router';
import { colors, fonts, radius } from '@kicko/shared';
import { emailTemplatesApi, EMAIL_TEMPLATE_LABELS, EmailTemplate } from '../../../../src/lib/emailTemplatesApi';

export default function AdminEmailTemplates() {
  const [templates, setTemplates] = useState<EmailTemplate[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    emailTemplatesApi
      .list()
      .then((res) => setTemplates(res.templates))
      .catch((err) => setError(err instanceof Error ? err.message : 'Could not load email templates.'));
  }, []);

  return (
    <View>
      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Email templates</Text>
          <Text style={styles.subtitle}>
            The transactional emails Kicko sends automatically — booking, payout, venue, and review notices. Edit
            the subject and body of each; a template you haven't touched still uses its built-in default.
          </Text>
        </View>
        <Link href="/admin-dashboard/settings/emails/guide" asChild>
          <Pressable style={styles.guideBtn}>
            <Text style={styles.guideBtnText}>Design guide</Text>
          </Pressable>
        </Link>
      </View>

      {error ? (
        <Text style={styles.error}>{error}</Text>
      ) : !templates ? (
        <ActivityIndicator color={colors.accent} style={{ marginTop: 20 }} />
      ) : (
        <View style={styles.list}>
          {templates.map((t) => (
            <Link key={t.key} href={`/admin-dashboard/settings/emails/${t.key}`} asChild>
              <Pressable style={styles.row}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.rowTitle}>{EMAIL_TEMPLATE_LABELS[t.key]}</Text>
                  <Text style={styles.rowSubject}>{t.subject}</Text>
                </View>
                {t.isDefault ? <Text style={styles.badgeDefault}>Default</Text> : <Text style={styles.badgeEdited}>Edited</Text>}
                <Text style={styles.rowArrow}>→</Text>
              </Pressable>
            </Link>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 16, marginBottom: 26, flexWrap: 'wrap' },
  title: { fontFamily: fonts.serif, fontSize: 26, color: colors.text, marginBottom: 4 },
  subtitle: { fontFamily: fonts.sans, fontSize: 13.5, color: colors.textSoft, maxWidth: 640, lineHeight: 19 },
  error: { fontFamily: fonts.sans, fontSize: 13.5, color: colors.danger },

  guideBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.accentSoft,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingVertical: 10,
    paddingHorizontal: 18,
    flexShrink: 0,
  },
  guideBtnText: { fontFamily: fonts.sansSemiBold, fontSize: 13, color: colors.accent },

  list: { maxWidth: 720, gap: 10 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingVertical: 16,
    paddingHorizontal: 20,
    gap: 14,
  },
  rowTitle: { fontFamily: fonts.serifMedium, fontSize: 15, color: colors.text, marginBottom: 3 },
  rowSubject: { fontFamily: fonts.sans, fontSize: 12.5, color: colors.textSoft },
  badgeDefault: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 10.5,
    color: colors.textSoft,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  badgeEdited: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 10.5,
    color: colors.accent,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  rowArrow: { color: colors.accent, fontSize: 18, flexShrink: 0 },
});
