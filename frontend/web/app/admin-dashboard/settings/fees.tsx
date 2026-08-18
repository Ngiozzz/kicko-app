import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '@kicko/shared';
import { usePlatformSettings } from '../../../src/lib/usePlatformSettings';
import { computeServiceFee } from '../../../src/lib/settingsApi';
import { PanelCard, PanelLoading, SaveRow, TileGrid, StatTile, TileStat, AddTile, PreviewBox, PreviewLine } from '../../../src/components/admin/settingsPanel';

const PREVIEW_SUBTOTALS = [100, 500, 1500];

export default function AdminServiceFees() {
  const { settings, feeTiers, setFeeTiers, saving, saved, error, handleSave } = usePlatformSettings();

  function updateFeeTier(index: number, field: 'max' | 'fee', text: string) {
    setFeeTiers((tiers) => tiers.map((t, i) => (i !== index ? t : { ...t, [field]: field === 'max' && text.trim() === '' ? null : Number(text) })));
  }

  return (
    <View>
      <Text style={styles.title}>Service fees</Text>
      <Text style={styles.subtitle}>Flat fee added on top of the subtotal, by price bracket.</Text>

      {!settings && !error ? (
        <PanelLoading title="Service fee tiers" />
      ) : (
        <PanelCard title="Service fee tiers" subtitle="Leave the last tier's “up to” blank for no cap. Changes apply platform-wide, immediately.">
          <TileGrid>
            {feeTiers.map((tier, i) => (
              <StatTile key={i} title={`Tier ${i + 1}`} onRemove={() => setFeeTiers((tiers) => tiers.filter((_, idx) => idx !== i))}>
                <TileStat subLabel="up to" value={tier.max === null ? '' : String(tier.max)} placeholder="no cap" onChangeText={(t) => updateFeeTier(i, 'max', t)} unit="KES" />
                <TileStat subLabel="fee" spaced value={String(tier.fee)} onChangeText={(t) => updateFeeTier(i, 'fee', t)} unit="KES" />
              </StatTile>
            ))}
            <AddTile onPress={() => setFeeTiers((tiers) => [...tiers, { max: null, fee: 0 }])} />
          </TileGrid>

          <PreviewBox>
            {PREVIEW_SUBTOTALS.map((s) => (
              <PreviewLine key={s} prefix={`KES ${s}`} strong={`+${computeServiceFee(s, feeTiers)}`} />
            ))}
          </PreviewBox>

          <SaveRow error={error} saved={saved} saving={saving} label="Save service fees" onPress={handleSave} />
        </PanelCard>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  title: { fontFamily: fonts.serif, fontSize: 26, color: colors.text, marginBottom: 4 },
  subtitle: { fontFamily: fonts.sans, fontSize: 13.5, color: colors.textSoft, marginBottom: 26 },
});
