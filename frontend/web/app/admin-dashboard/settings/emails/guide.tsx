import { ReactNode, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts, radius } from '@kicko/shared';

// Static reference content for whoever's designing Kicko's email templates
// (Canva → HTML) — lives in-app (not just a one-off doc) so it's always
// one click from the editor it's about. See app/admin-dashboard/settings/
// emails/[key].tsx for the editor this refers to throughout.
const PROMPT_TEXT = `You are an expert in HTML email development. I'm going to describe (or show you a screenshot of) a design I made in Canva, and I need you to convert it into clean, email-client-safe HTML I can paste straight into a template editor.

Rules you must follow:
1. Output ONLY the inner body markup — no <html>, <head>, <body>, or <!DOCTYPE> tags. My system wraps this in its own logo banner and footer automatically.
2. Inline CSS only (style="..." on every element). No <style> blocks, no CSS classes, no external stylesheets.
3. Use plain block elements — <h2>, <h3>, <p>, <strong>, <a>, <img>. If you genuinely need a multi-column layout, use an HTML <table role="presentation"> — never CSS flexbox or grid, which most inboxes (especially Outlook) silently ignore.
4. Keep the whole thing at or under 480px wide.
5. Web-safe fonts only, e.g. font-family:Georgia,'Times New Roman',serif or font-family:-apple-system,'Segoe UI',Roboto,sans-serif. No @font-face, no Google Fonts — they don't load in most inboxes.
6. Every <img> needs a real width/height or style="max-width:100%;display:block;", plus descriptive alt text.
7. Keep these placeholder tokens in your output exactly as written, wherever that content belongs: [ list your {{placeholders}} here, e.g. {{venueName}}, {{when}}, {{amount}} ]
8. Palette: accent gold #C08A3E (or #e8a33d for a brighter highlight), body text #1a1a1a, muted text #888888, background white.
9. If I've given you an image URL below, use it directly in an <img src="..."> — don't invent a placeholder image.

Here's the design: [ describe your Canva layout, or attach the export/screenshot ]
Image URL to use, if any: [ paste the URL from Kicko's "Add image" upload ]
Placeholders this email needs: [ list them, from the editor's "Placeholders available" box ]`;

function SectionHead({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <View style={{ marginBottom: 18 }}>
      <Text style={styles.h2}>{title}</Text>
      <Text style={styles.sectionSub}>{subtitle}</Text>
    </View>
  );
}

function Fact({ label, children }: { label: string; children: string }) {
  return (
    <View style={styles.fact}>
      <Text style={styles.factLabel}>{label}</Text>
      <Text style={styles.factBody}>{children}</Text>
    </View>
  );
}

function PathCard({
  tag,
  recommended,
  title,
  desc,
  steps,
}: {
  tag: string;
  recommended?: boolean;
  title: string;
  desc: string;
  steps: string[];
}) {
  return (
    <View style={[styles.path, recommended && styles.pathRecommended]}>
      <View style={[styles.pathTag, recommended && styles.pathTagRecommended]}>
        <Text style={[styles.pathTagText, recommended && styles.pathTagTextRecommended]}>{tag}</Text>
      </View>
      <Text style={styles.pathTitle}>{title}</Text>
      <Text style={styles.pathDesc}>{desc}</Text>
      {steps.map((s, i) => (
        <View key={i} style={styles.pathStep}>
          <Text style={styles.pathStepNum}>{i + 1}</Text>
          <Text style={styles.pathStepText}>{s}</Text>
        </View>
      ))}
    </View>
  );
}

function Tip({ num, children }: { num: string; children: string }) {
  return (
    <View style={styles.tip}>
      <Text style={styles.tipNum}>{num}</Text>
      <Text style={styles.tipText}>{children}</Text>
    </View>
  );
}

function RuleRow({ dont, doo }: { dont: string; doo: string }) {
  return (
    <View style={styles.ruleRow}>
      <Text style={styles.ruleDont}>✕ {dont}</Text>
      <Text style={styles.ruleArrow}>→</Text>
      <Text style={styles.ruleDo}>✓ {doo}</Text>
    </View>
  );
}

function CheckItem({ children }: { children: ReactNode }) {
  return (
    <View style={styles.checkItem}>
      <View style={styles.checkBox} />
      <Text style={styles.checkText}>{children}</Text>
    </View>
  );
}

export default function EmailTemplateGuide() {
  const [copied, setCopied] = useState(false);

  async function copyPrompt() {
    try {
      await navigator.clipboard.writeText(PROMPT_TEXT);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard permission denied or unavailable — the prompt is still
      // fully readable/selectable on screen, so this fails silently rather
      // than surfacing an error for a non-critical convenience feature.
    }
  }

  return (
    <View>
      <Text style={styles.title}>Designing Kicko's emails</Text>
      <Text style={styles.lede}>
        A working reference for turning a Canva design into something Kicko can actually send — plus a
        ready-to-use prompt that gets any AI to write clean, email-safe HTML for you. No HTML experience
        assumed.
      </Text>

      <View style={styles.section}>
        <SectionHead title="How the template system works" subtitle="Three things worth knowing before you open Canva." />
        <View style={styles.factRow}>
          <Fact label="Where you edit">
            Settings → Email templates. Eight templates, one per event (booking confirmed, payout sent, etc.), with a live preview beside the editor.
          </Fact>
          <Fact label="What you fill in">
            {'Each template has its own placeholders, like {{venueName}} or {{amount}} — shown right in the editor. Real data drops in when the email actually sends.'}
          </Fact>
          <Fact label="What's automatic">
            The logo banner, outer spacing, and "Kicko · Nairobi, Kenya" footer wrap around every email on their own. You only ever design what goes in between.
          </Fact>
        </View>
      </View>

      <View style={styles.section}>
        <SectionHead title="Two ways to bring your design in" subtitle="Pick based on how much of the email your Canva design covers." />
        <View style={styles.pathRow}>
          <PathCard
            tag="Simplest · zero HTML risk"
            recommended
            title="Design it as one image"
            desc="Best when your design is a self-contained graphic — a promo banner, a seasonal header, a graphic with your own layout and fonts baked in."
            steps={[
              'Design at 1200×400px in Canva (2× a 600px display width, so it stays sharp)',
              'Download → PNG',
              "In the template editor, click Add image — it uploads and drops the tag in for you",
            ]}
          />
          <PathCard
            tag="More flexible"
            title="Rebuild it as real HTML"
            desc="Best when you need live text — placeholders, prices, dates — mixed into the layout, not just a static picture."
            steps={[
              'Design and finish your layout in Canva as normal',
              "Don't export Canva's own HTML — see below for why",
              'Feed the design + the prompt below to an AI, paste its output into the HTML box',
            ]}
          />
        </View>
      </View>

      <View style={styles.section}>
        <SectionHead
          title="Designing in Canva"
          subtitle="Email inboxes are a much narrower canvas than a web page — a few habits keep the design from breaking once it's out of Canva."
        />
        <View style={styles.tipList}>
          <Tip num="01">
            Design at 1200px wide, single column. Every template renders at 480px — Canva work at 2× that scales down crisply. Side-by-side columns just stack awkwardly on phones, which is most of Kicko's traffic.
          </Tip>
          <Tip num="02">
            Keep text at 14px+ (28px+ at 2×). Fine print gets illegible fast once Gmail or Outlook compresses it into a phone-width preview.
          </Tip>
          <Tip num="03">
            {"Stick to system fonts if any text stays \"live.\" A fancy Canva font only survives as a flattened image — fine for a banner, useless for a placeholder like {{venueName}} that has to stay real, editable text."}
          </Tip>
          <Tip num="04">
            Export PNG for graphics/logos, JPG for photos. PNG keeps transparency and sharp edges; JPG is a fraction of the file size for a photo, which matters — inboxes cap how large an email can be.
          </Tip>
          <Tip num="05">
            Preview it small. Zoom Canva's preview to roughly phone width before exporting — anything you can't read there won't read in an inbox either.
          </Tip>
        </View>
      </View>

      <View style={styles.section}>
        <SectionHead
          title="The AI prompt"
          subtitle='Paste this into Claude, ChatGPT, or anything similar, fill the three bracketed lines at the bottom, and attach a screenshot or export of your Canva design if you have one.'
        />
        <View style={styles.promptCard}>
          <View style={styles.promptHead}>
            <Text style={styles.promptLabel}>email-html-prompt.txt</Text>
            <Pressable onPress={copyPrompt} style={[styles.copyBtn, copied && styles.copyBtnCopied]}>
              <Text style={[styles.copyBtnText, copied && styles.copyBtnTextCopied]}>{copied ? 'Copied!' : 'Copy prompt'}</Text>
            </Pressable>
          </View>
          <Text style={styles.promptBody} selectable>
            {PROMPT_TEXT}
          </Text>
        </View>
      </View>

      <View style={styles.section}>
        <SectionHead
          title="Why not just export Canva's HTML?"
          subtitle="Canva's own “Download → HTML” is built for web pages, not inboxes — the two use almost entirely different rules."
        />
        <View style={styles.rulesTable}>
          <RuleRow dont="CSS Grid / Flexbox" doo="HTML tables" />
          <RuleRow dont="<style> blocks, classes" doo='Inline style="..." on every tag' />
          <RuleRow dont="Custom / Google fonts" doo="Georgia, Arial-style stacks" />
          <RuleRow dont="Background images via CSS" doo="Real <img> tags" />
          <RuleRow dont="JavaScript, animation" doo="Static markup only" />
        </View>
      </View>

      <View style={styles.section}>
        <SectionHead title="Before you paste it in" subtitle="" />
        <View style={styles.checkList}>
          <CheckItem>No {'<html>'}, {'<head>'}, or {'<body>'} tags in what you're pasting — just the inner content</CheckItem>
          <CheckItem>Every placeholder the "Placeholders available" box lists is used somewhere</CheckItem>
          <CheckItem>No placeholder was renamed or misspelled — they must match exactly</CheckItem>
          <CheckItem>Any image URL is the real one from Kicko's upload, not a placeholder</CheckItem>
          <CheckItem>You've hit "Send me a test" and checked it lands looking right</CheckItem>
        </View>
      </View>

      <View style={styles.bannerNote}>
        <Text style={styles.bannerNoteText}>
          The logo banner at the top of every email is set centrally, once, for the whole platform — not per
          template. It's already live. If you want to replace it with a new version, that's a one-line code
          change, not something to redo per template. Images you add via each template's own{' '}
          <Text style={{ fontFamily: fonts.sansSemiBold }}>Add image</Text> button are separate — those are for
          one specific email, like a one-off promo graphic.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  title: { fontFamily: fonts.serif, fontSize: 26, color: colors.text, marginBottom: 4 },
  lede: { fontFamily: fonts.sans, fontSize: 14, color: colors.textSoft, maxWidth: 720, lineHeight: 20, marginBottom: 32 },

  section: { marginBottom: 36, maxWidth: 900 },
  h2: { fontFamily: fonts.serifMedium, fontSize: 19, color: colors.text, marginBottom: 4 },
  sectionSub: { fontFamily: fonts.sans, fontSize: 12.5, color: colors.textSoft, maxWidth: 640, lineHeight: 17 },

  factRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  fact: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: 16, flexGrow: 1, flexBasis: 220, maxWidth: 300 },
  factLabel: { fontFamily: fonts.sansSemiBold, fontSize: 10, color: colors.accent, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
  factBody: { fontFamily: fonts.sans, fontSize: 12.5, color: colors.text, lineHeight: 18 },

  pathRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 14 },
  path: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, padding: 20, flexGrow: 1, flexBasis: 320, maxWidth: 420 },
  pathRecommended: { borderColor: colors.accent },
  pathTag: { alignSelf: 'flex-start', backgroundColor: colors.surface2, borderRadius: radius.pill, paddingVertical: 3, paddingHorizontal: 9, marginBottom: 12 },
  pathTagRecommended: { backgroundColor: colors.accent },
  pathTagText: { fontFamily: fonts.sansBold, fontSize: 9.5, color: colors.textSoft, textTransform: 'uppercase', letterSpacing: 0.5 },
  pathTagTextRecommended: { color: colors.accentText },
  pathTitle: { fontFamily: fonts.serifMedium, fontSize: 16, color: colors.text, marginBottom: 6 },
  pathDesc: { fontFamily: fonts.sans, fontSize: 12.5, color: colors.textSoft, lineHeight: 18, marginBottom: 12 },
  pathStep: { flexDirection: 'row', gap: 8, marginBottom: 6 },
  pathStepNum: { fontFamily: fonts.sansBold, fontSize: 12, color: colors.accent, width: 14 },
  pathStepText: { fontFamily: fonts.sans, fontSize: 12.5, color: colors.text, flex: 1, lineHeight: 18 },

  tipList: { gap: 8 },
  tip: { flexDirection: 'row', gap: 12, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: 13, maxWidth: 780 },
  tipNum: { fontFamily: 'monospace' as any, fontSize: 11, color: colors.accent, paddingTop: 1 },
  tipText: { fontFamily: fonts.sans, fontSize: 12.5, color: colors.text, flex: 1, lineHeight: 18 },

  promptCard: { backgroundColor: '#17140F', borderRadius: radius.lg, padding: 4, maxWidth: 780 },
  promptHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10, paddingHorizontal: 14 },
  promptLabel: { fontFamily: 'monospace' as any, fontSize: 11, color: '#E3B15C' },
  copyBtn: { backgroundColor: '#E3B15C', borderRadius: radius.pill, paddingVertical: 6, paddingHorizontal: 13 },
  copyBtnCopied: { backgroundColor: colors.good },
  copyBtnText: { fontFamily: fonts.sansSemiBold, fontSize: 11.5, color: '#17140F' },
  copyBtnTextCopied: { color: '#fff' },
  promptBody: { fontFamily: 'monospace' as any, fontSize: 11, lineHeight: 17, color: '#F3EEE3', paddingHorizontal: 18, paddingBottom: 18 },

  rulesTable: { gap: 1, maxWidth: 640 },
  ruleRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border },
  ruleDont: { fontFamily: fonts.sansMedium, fontSize: 12.5, color: colors.danger, flex: 1 },
  ruleArrow: { color: colors.textSoft, fontSize: 12 },
  ruleDo: { fontFamily: fonts.sansMedium, fontSize: 12.5, color: colors.good, flex: 1 },

  checkList: { gap: 8, maxWidth: 640 },
  checkItem: { flexDirection: 'row', gap: 10, alignItems: 'flex-start', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: 12 },
  checkBox: { width: 14, height: 14, borderRadius: 4, borderWidth: 1.5, borderColor: colors.accent, marginTop: 2, flexShrink: 0 },
  checkText: { fontFamily: fonts.sans, fontSize: 12.5, color: colors.text, flex: 1, lineHeight: 18 },

  bannerNote: { backgroundColor: colors.accentSoft, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, padding: 18, maxWidth: 780 },
  bannerNoteText: { fontFamily: fonts.sans, fontSize: 12.5, color: colors.text, lineHeight: 19 },
});
