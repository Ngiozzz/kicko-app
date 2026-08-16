import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts, radius } from '@kicko/shared';

export default function AdminMatchSessions() {
  return (
    <View>
      <Text style={styles.title}>Match sessions</Text>
      <Text style={styles.subtitle}>Bookings turned into shared sessions — invited players, split cost. Trailing 30 days.</Text>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Total sessions</Text>
          <Text style={styles.statValue}>0</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Success rate</Text>
          <Text style={styles.statValue}>—</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Didn't fill in time</Text>
          <Text style={styles.statValue}>0</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Payment dropout</Text>
          <Text style={styles.statValue}>0</Text>
        </View>
      </View>

      <View style={styles.tablePanel}>
        <View style={styles.tableHeadRow}>
          {['Venue', 'Date', 'Host', 'Filled', 'Status', 'Issue'].map((c) => (
            <Text key={c} style={styles.tableHeadCell}>
              {c}
            </Text>
          ))}
        </View>
        <View style={styles.emptyRow}>
          <Text style={styles.emptyText}>No match sessions yet.</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  title: { fontFamily: fonts.serif, fontSize: 26, color: colors.text, marginBottom: 4 },
  subtitle: { fontFamily: fonts.sans, fontSize: 13.5, color: colors.textSoft, maxWidth: 520 },

  statsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 18, marginTop: 22, marginBottom: 8 },
  statCard: { flexGrow: 1, flexBasis: 200, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, padding: 18 },
  statLabel: { fontFamily: fonts.sansSemiBold, fontSize: 12.5, color: colors.textSoft, marginBottom: 10 },
  statValue: { fontFamily: fonts.serif, fontSize: 24, color: colors.text },

  tablePanel: { marginTop: 22, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, padding: 22 },
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
