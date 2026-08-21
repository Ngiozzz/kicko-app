import { CSSProperties, ReactElement, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { colors, fonts, radius, supabase } from '@kicko/shared';
import { Field } from '../../../../src/components/ui';
import { emailTemplatesApi, EMAIL_TEMPLATE_LABELS, EmailTemplate, EmailTemplateKey } from '../../../../src/lib/emailTemplatesApi';

const MAX_IMAGE_BYTES = 4 * 1024 * 1024;
const PREVIEW_DEBOUNCE_MS = 500;

type IconProps = { size?: number; color: string };

function SaveIcon({ size = 14, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M5 3h11l4 4v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" />
      <Path d="M8 3v6h7V3" />
      <Rect x={7.5} y={13} width={9} height={7} />
    </Svg>
  );
}

function ImageIcon({ size = 14, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <Rect x={3} y={4} width={18} height={16} rx={2} />
      <Circle cx={8.5} cy={9.5} r={1.4} />
      <Path d="M21 16l-5.5-5.5L4 21" />
    </Svg>
  );
}

function SendIcon({ size = 14, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M22 2 11 13" />
      <Path d="M22 2 15 22l-4-9-9-4z" />
    </Svg>
  );
}

function ResetIcon({ size = 14, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M3 12a9 9 0 1 0 3-6.7" />
      <Path d="M3 4v5h5" />
    </Svg>
  );
}

function ExternalLinkIcon({ size = 14, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M18 13v6a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h6" />
      <Path d="M15 3h6v6" />
      <Path d="M10 14 21 3" />
    </Svg>
  );
}

// A small icon+label action bar, replacing the plain text buttons that
// used to sit here — Save reads as the one clearly primary action, Reset
// reads as the one clearly destructive one, and the rest sit between.
type ActionVariant = 'primary' | 'outline' | 'ghost';

function ActionButton({
  icon,
  label,
  onPress,
  disabled,
  variant = 'outline',
}: {
  icon: (p: IconProps) => ReactElement;
  label: string;
  onPress: () => void;
  disabled?: boolean;
  variant?: ActionVariant;
}) {
  const Icon = icon;
  const iconColor = variant === 'primary' ? colors.accentText : variant === 'ghost' ? colors.textSoft : colors.accent;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        actionStyles.btn,
        actionStyles[`btn_${variant}` as const],
        disabled && actionStyles.btnDisabled,
        pressed && !disabled && actionStyles.btnPressed,
      ]}
    >
      <Icon size={14} color={iconColor} />
      <Text style={[actionStyles.btnText, actionStyles[`btnText_${variant}` as const]]}>{label}</Text>
    </Pressable>
  );
}

const actionStyles = StyleSheet.create({
  btn: { flexDirection: 'row', alignItems: 'center', gap: 7, paddingVertical: 10, paddingHorizontal: 16, borderRadius: radius.pill, borderWidth: 1 },
  btn_primary: { backgroundColor: colors.accent, borderColor: colors.accent },
  btn_outline: { backgroundColor: colors.accentSoft, borderColor: colors.border },
  btn_ghost: { backgroundColor: 'transparent', borderColor: colors.border },
  btnDisabled: { opacity: 0.5 },
  btnPressed: { opacity: 0.82 },
  btnText: { fontFamily: fonts.sansSemiBold, fontSize: 13 },
  btnText_primary: { color: colors.accentText },
  btnText_outline: { color: colors.accent },
  btnText_ghost: { color: colors.textSoft },
});

export default function AdminEmailTemplateEditor() {
  const { key } = useLocalSearchParams<{ key: EmailTemplateKey }>();

  const [template, setTemplate] = useState<EmailTemplate | null>(null);
  const [subject, setSubject] = useState('');
  const [html, setHtml] = useState('');
  const [loadError, setLoadError] = useState<string | null>(null);

  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [previewSubject, setPreviewSubject] = useState<string | null>(null);
  const previewTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [testSentTo, setTestSentTo] = useState<string | null>(null);
  const [sendingTest, setSendingTest] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    if (!key) return;
    emailTemplatesApi
      .list()
      .then((res) => {
        const t = res.templates.find((x) => x.key === key);
        if (!t) return setLoadError('Unknown email template.');
        setTemplate(t);
        setSubject(t.subject);
        setHtml(t.html);
      })
      .catch((err) => setLoadError(err instanceof Error ? err.message : 'Could not load this template.'));
  }, [key]);

  // Live preview — re-renders the draft (through the same path a real send
  // uses) a short beat after the admin stops typing, so the pane always
  // shows what saving/sending would actually produce.
  useEffect(() => {
    if (!key || !template) return;
    if (previewTimer.current) clearTimeout(previewTimer.current);
    previewTimer.current = setTimeout(() => {
      emailTemplatesApi
        .previewDraft(key, subject, html)
        .then((res) => {
          setPreviewSubject(res.subject);
          setPreviewHtml(res.html);
        })
        .catch(() => {
          // A broken draft (e.g. mid-edit unbalanced HTML) just leaves the
          // last good preview on screen rather than clearing it.
        });
    }, PREVIEW_DEBOUNCE_MS);
    return () => {
      if (previewTimer.current) clearTimeout(previewTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, template, subject, html]);

  async function handleSave() {
    if (!key) return;
    setSaving(true);
    setActionError(null);
    setSaved(false);
    try {
      const res = await emailTemplatesApi.update(key, subject, html);
      setTemplate((t) => (t ? { ...t, subject: res.template.subject, html: res.template.html, updated_at: res.template.updated_at, isDefault: false } : t));
      setSaved(true);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Could not save this template.');
    } finally {
      setSaving(false);
    }
  }

  async function handleReset() {
    if (!key) return;
    setResetting(true);
    setActionError(null);
    setSaved(false);
    try {
      const res = await emailTemplatesApi.reset(key);
      setTemplate((t) => (t ? { ...t, subject: res.template.subject, html: res.template.html, updated_at: res.template.updated_at, isDefault: true } : t));
      setSubject(res.template.subject);
      setHtml(res.template.html);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Could not reset this template.');
    } finally {
      setResetting(false);
    }
  }

  async function handleSendTest() {
    if (!key) return;
    setSendingTest(true);
    setActionError(null);
    setTestSentTo(null);
    try {
      const res = await emailTemplatesApi.sendTest(key, { subject, html });
      setTestSentTo(res.sentTo);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Could not send a test email.');
    } finally {
      setSendingTest(false);
    }
  }

  function openPreviewInNewTab() {
    if (!previewHtml) return;
    const blob = new Blob([previewHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  }

  function pickImage() {
    if (typeof document === 'undefined') return;
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      if (file.size > MAX_IMAGE_BYTES) {
        setActionError('Image must be under 4MB.');
        return;
      }
      setActionError(null);
      setUploadingImage(true);
      try {
        const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
        const path = `${key}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
        const { error: uploadError } = await supabase.storage.from('email-assets').upload(path, file);
        if (uploadError) throw uploadError;
        const { data } = supabase.storage.from('email-assets').getPublicUrl(path);
        setHtml((h) => `${h}\n<img src="${data.publicUrl}" alt="" style="max-width:100%;display:block;margin:12px 0;" />`);
      } catch (err) {
        setActionError(err instanceof Error ? err.message : 'Could not upload this image.');
      } finally {
        setUploadingImage(false);
      }
    };
    input.click();
  }

  if (loadError) {
    return (
      <View>
        <Text style={styles.title}>Email template</Text>
        <Text style={styles.error}>{loadError}</Text>
      </View>
    );
  }
  if (!template) {
    return <ActivityIndicator color={colors.accent} style={{ marginTop: 20 }} />;
  }

  return (
    <View>
      <Text style={styles.title}>{EMAIL_TEMPLATE_LABELS[template.key]}</Text>
      <Text style={styles.subtitle}>
        {template.isDefault ? "Using the built-in default — edit and save to customize it." : 'Customized.'} Sent to whoever
        triggers this event; no login required to receive it.
      </Text>

      <View style={styles.columns}>
        <View style={styles.editorCard}>
          <Field label="Subject" value={subject} onChangeText={setSubject} placeholder="Email subject line" />
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Body (HTML)</Text>
            <TextInput
              value={html}
              onChangeText={setHtml}
              placeholder="<h2>...</h2><p>...</p>"
              placeholderTextColor={colors.textSoft}
              multiline
              numberOfLines={14}
              style={[styles.input, styles.htmlInput]}
            />
          </View>

          <View style={styles.varsBox}>
            <Text style={styles.varsLabel}>Placeholders available in this email</Text>
            <Text style={styles.varsList}>{template.vars.map((v) => `{{${v}}}`).join('   ')}</Text>
          </View>

          {actionError ? <Text style={styles.error}>{actionError}</Text> : null}
          {saved ? <Text style={styles.saved}>Saved.</Text> : null}
          {testSentTo ? <Text style={styles.saved}>Test sent to {testSentTo}.</Text> : null}

          <View style={styles.actions}>
            <ActionButton icon={SaveIcon} label={saving ? 'Saving…' : 'Save changes'} onPress={handleSave} disabled={saving} variant="primary" />
            <ActionButton icon={ImageIcon} label={uploadingImage ? 'Uploading…' : 'Add image'} onPress={pickImage} disabled={uploadingImage} />
            <ActionButton icon={SendIcon} label={sendingTest ? 'Sending…' : 'Send me a test'} onPress={handleSendTest} disabled={sendingTest} />
            {!template.isDefault && (
              <ActionButton icon={ResetIcon} label={resetting ? 'Resetting…' : 'Reset to default'} onPress={handleReset} disabled={resetting} variant="ghost" />
            )}
          </View>
        </View>

        <View style={styles.previewCard}>
          <View style={styles.previewHead}>
            <Text style={styles.previewFrom}>Kicko &lt;no-reply@kicko-app.co.ke&gt;</Text>
            <Text style={styles.previewSubject}>{previewSubject ?? subject}</Text>
          </View>
          <View style={styles.previewBody}>
            {previewHtml ? (
              // Sandboxed, styles-isolated — the only reliable way to show
              // this app's dark UI next to genuine, white-background email
              // markup without the two bleeding into each other.
              <iframe srcDoc={previewHtml} style={iframeStyle} sandbox="" title="Email preview" />
            ) : (
              <ActivityIndicator color={colors.accent} style={{ marginTop: 40 }} />
            )}
          </View>
          <ActionButton icon={ExternalLinkIcon} label="Open in new tab" onPress={openPreviewInNewTab} disabled={!previewHtml} />
        </View>
      </View>
    </View>
  );
}

const iframeStyle: CSSProperties = { width: '100%', height: '100%', border: 0, backgroundColor: '#fff' };

const styles = StyleSheet.create({
  title: { fontFamily: fonts.serif, fontSize: 26, color: colors.text, marginBottom: 4 },
  subtitle: { fontFamily: fonts.sans, fontSize: 13.5, color: colors.textSoft, maxWidth: 900, lineHeight: 19, marginBottom: 26 },
  error: { fontFamily: fonts.sans, fontSize: 13.5, color: colors.danger, marginBottom: 12 },
  saved: { fontFamily: fonts.sans, fontSize: 13.5, color: colors.good, marginBottom: 12 },

  field: { marginBottom: 16 },
  fieldLabel: { fontFamily: fonts.sansSemiBold, fontSize: 11, color: colors.textSoft, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bg,
    borderRadius: radius.md,
    paddingVertical: 13,
    paddingHorizontal: 16,
    fontFamily: fonts.sans,
    fontSize: 14,
    color: colors.text,
  },

  columns: { flexDirection: 'row', gap: 20, alignItems: 'flex-start', flexWrap: 'wrap' },

  editorCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderTopWidth: 3,
    borderTopColor: colors.accent,
    borderRadius: radius.lg,
    padding: 24,
    flexGrow: 1,
    flexBasis: 460,
    maxWidth: 560,
  },
  htmlInput: { minHeight: 260, textAlignVertical: 'top', fontFamily: 'monospace' as any, fontSize: 12.5 },

  varsBox: { backgroundColor: colors.accentSoft, borderRadius: radius.md, padding: 12, marginBottom: 18 },
  varsLabel: { fontFamily: fonts.sansSemiBold, fontSize: 10, color: colors.accent, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 6 },
  varsList: { fontFamily: 'monospace' as any, fontSize: 12, color: colors.text },

  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },

  previewCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: 16,
    flexGrow: 1,
    flexBasis: 420,
    maxWidth: 520,
    gap: 12,
  },
  previewHead: { paddingHorizontal: 4 },
  previewFrom: { fontFamily: fonts.sans, fontSize: 11.5, color: colors.textSoft, marginBottom: 4 },
  previewSubject: { fontFamily: fonts.serifMedium, fontSize: 15, color: colors.text },
  previewBody: {
    height: 460,
    borderRadius: radius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: '#fff',
    alignItems: 'center',
  },
});
