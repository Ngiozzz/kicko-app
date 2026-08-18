import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '@kicko/shared';
import { usePlatformSettings } from '../../../src/lib/usePlatformSettings';
import { PanelCard, PanelLoading, SaveRow, TileGrid, StatTile, TileStat } from '../../../src/components/admin/settingsPanel';

export default function AdminMatchWindows() {
  const { settings, joinMin, setJoinMin, payMin, setPayMin, graceMin, setGraceMin, maxPerSide, setMaxPerSide, saving, saved, error, handleSave } = usePlatformSettings();

  const tiles = [
    { title: 'Join window', value: joinMin, setValue: setJoinMin, unit: 'min', hint: 'How long invited players have to accept before the roster locks.' },
    { title: 'Pay window', value: payMin, setValue: setPayMin, unit: 'min', hint: 'How long everyone has to pay their share once the roster is set.' },
    { title: 'Decision grace', value: graceMin, setValue: setGraceMin, unit: 'min', hint: 'How long the organizer has to resplit, top up, or cancel a stalled session.' },
    { title: 'Max per side', value: maxPerSide, setValue: setMaxPerSide, unit: 'players', hint: 'The most players either side of a match session can hold.' },
  ];

  return (
    <View>
      <Text style={styles.title}>Match windows</Text>
      <Text style={styles.subtitle}>How long each phase of a shared match session stays open before it advances.</Text>

      {!settings && !error ? (
        <PanelLoading title="Match session windows" />
      ) : (
        <PanelCard title="Match session windows" subtitle="Changes apply platform-wide, immediately.">
          <TileGrid>
            {tiles.map((tile) => (
              <StatTile key={tile.title} title={tile.title} hint={tile.hint}>
                <TileStat value={tile.value} onChangeText={tile.setValue} unit={tile.unit} />
              </StatTile>
            ))}
          </TileGrid>

          <SaveRow error={error} saved={saved} saving={saving} label="Save match windows" onPress={handleSave} />
        </PanelCard>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  title: { fontFamily: fonts.serif, fontSize: 26, color: colors.text, marginBottom: 4 },
  subtitle: { fontFamily: fonts.sans, fontSize: 13.5, color: colors.textSoft, marginBottom: 26 },
});
