import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts, radius } from '@kicko/shared';

export default function AdminReliability() {
  return (
    <View>
      <Text style={styles.title}>M-Pesa STK push reliability</Text>
      <Text style={styles.subtitle}>How reliably players are able to pay via STK push. Trailing 7 days.</Text>

      <Text style={styles.secTitle}>Push outcomes</Text>
      <Text style={styles.secSub}>Of all STK pushes sent to players' phones</Text>
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Success rate</Text>
          <Text style={styles.statValue}>—</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Timeout rate</Text>
          <Text style={styles.statValue}>—</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Cancelled rate</Text>
          <Text style={styles.statValue}>—</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>No callback</Text>
          <Text style={styles.statValue}>—</Text>
        </View>
      </View>

      <Text style={styles.secTitle}>Callback lag</Text>
      <Text style={styles.secSub}>Time between push accepted and Safaricom's callback landing</Text>
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Average</Text>
          <Text style={styles.statValue}>—</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Median</Text>
          <Text style={styles.statValue}>—</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>P95</Text>
          <Text style={styles.statValue}>—</Text>
        </View>
      </View>

      <Text style={styles.secTitle}>By venue</Text>
      <Text style={styles.secSub}>Push outcomes broken down per venue, trailing 7 days</Text>
      <View style={styles.tablePanel}>
        <View style={styles.tableHeadRow}>
          {['Venue', 'Pushes sent', 'Success rate', 'Timeout rate', 'Avg callback lag'].map((c) => (
            <Text key={c} style={styles.tableHeadCell}>
              {c}
            </Text>
          ))}
        </View>
        <View style={styles.emptyRow}>
          <Text style={styles.emptyText}>No STK push data yet.</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  title: { fontFamily: fonts.serif, fontSize: 26, color: colors.text, marginBottom: 4 },
  subtitle: { fontFamily: fonts.sans, fontSize: 13.5, color: colors.textSoft },

  secTitle: { fontFamily: fonts.serifMedium, fontSize: 18, color: colors.text, marginTop: 32, marginBottom: 2 },
  secSub: { fontFamily: fonts.sans, fontSize: 12.5, color: colors.textSoft, marginBottom: 16 },

  statsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 18 },
  statCard: { flexGrow: 1, flexBasis: 160, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, padding: 18 },
  statLabel: { fontFamily: fonts.sansSemiBold, fontSize: 12.5, color: colors.textSoft, marginBottom: 10 },
  statValue: { fontFamily: fonts.serif, fontSize: 24, color: colors.text },

  tablePanel: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, padding: 22 },
  tableHeadRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: colors.border, paddingBottom: 12, gap: 16 },
  tableHeadCell: {
    flex: 1,
    fontFamily: fonts.sansSemiBold,
    fontSize: 11.5,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    color: colors.textSoft,
  },
  emptyRow: { paddingVertical: 30 },
  emptyText: { fontFamily: fonts.sans, fontSize: 13, color: colors.textSoft, textAlign: 'center' },
});
