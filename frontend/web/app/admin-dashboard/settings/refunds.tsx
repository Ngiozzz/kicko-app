import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '@kicko/shared';
import { usePlatformSettings } from '../../../src/lib/usePlatformSettings';
import { previewRefundPct } from '../../../src/lib/settingsApi';
import { PanelCard, PanelLoading, SaveRow, TileGrid, StatTile, TileStat, AddTile, PreviewBox, PreviewLine, InlineNumberSentence, refundColor } from '../../../src/components/admin/settingsPanel';

const PREVIEW_HOURS = [48, 10, 1];

export default function AdminCancellationRefunds() {
  const { settings, refundTiers, setRefundTiers, walkInPct, setWalkInPct, saving, saved, error, handleSave } = usePlatformSettings();

  function updateRefundTier(index: number, field: 'min_hours' | 'pct', text: string) {
    setRefundTiers((tiers) => tiers.map((t, i) => (i !== index ? t : { ...t, [field]: Number(text) })));
  }

  return (
    <View>
      <Text style={styles.title}>Cancellation refunds</Text>
      <Text style={styles.subtitle}>Refund % of the subtotal, by hours-to-kickoff at cancellation.</Text>

      {!settings && !error ? (
        <PanelLoading title="Cancellation refund tiers" />
      ) : (
        <PanelCard title="Cancellation refund tiers" subtitle="The service fee is never refunded, at any tier. Changes apply platform-wide, immediately.">
          <TileGrid>
            {refundTiers.map((tier, i) => (
              <StatTile key={i} title={`Tier ${i + 1}`} accentColor={refundColor(tier.pct)} onRemove={() => setRefundTiers((tiers) => tiers.filter((_, idx) => idx !== i))}>
                <TileStat subLabel="from" value={String(tier.min_hours)} onChangeText={(t) => updateRefundTier(i, 'min_hours', t)} unit="hrs left" />
                <TileStat subLabel="refund" spaced value={String(tier.pct)} onChangeText={(t) => updateRefundTier(i, 'pct', t)} unit="%" valueColor={refundColor(tier.pct)} />
              </StatTile>
            ))}
            <AddTile onPress={() => setRefundTiers((tiers) => [...tiers, { min_hours: 0, pct: 0 }])} />
          </TileGrid>

          <InlineNumberSentence before="Walk-in bookings (made same-day) always refund at" value={walkInPct} onChangeText={setWalkInPct} after="%." />

          <PreviewBox>
            {PREVIEW_HOURS.map((h) => {
              const pct = previewRefundPct(h, refundTiers);
              return <PreviewLine key={h} prefix={`${h}h left`} strong={`${pct}%`} strongColor={refundColor(pct)} />;
            })}
          </PreviewBox>

          <SaveRow error={error} saved={saved} saving={saving} label="Save cancellation refunds" onPress={handleSave} />
        </PanelCard>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  title: { fontFamily: fonts.serif, fontSize: 26, color: colors.text, marginBottom: 4 },
  subtitle: { fontFamily: fonts.sans, fontSize: 13.5, color: colors.textSoft, marginBottom: 26 },
});
