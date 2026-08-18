import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { colors, fonts, radius } from '@kicko/shared';
import { adminApi, AdminSession } from '../../../src/lib/adminApi';
import { Drawer } from '../../../src/components/owner/Drawer';

const PHASE_LABEL: Record<AdminSession['phase'], string> = {
  joining: 'Joining',
  paying: 'Paying',
  awaiting_decision: 'Awaiting decision',
  funded: 'Funded',
  cancelled: 'Cancelled',
};

function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailField}>
      <Text style={styles.detailFieldLabel}>{label}</Text>
      <Text style={styles.detailFieldValue}>{value}</Text>
    </View>
  );
}

// Full metadata for one session — the cancellation reason lives here instead
// of a table cell, since it's free text and can run long (see the "Issue"
// column it used to be, which made rows wrap unpredictably).
function SessionDetailDrawer({ session, onClose }: { session: AdminSession | null; onClose: () => void }) {
  if (!session) return null;
  return (
    <Drawer visible={Boolean(session)} onClose={onClose} title={session.venue?.name ?? 'Session'}>
      <View style={styles.detailFieldGrid}>
        <DetailField label="Date" value={new Date(session.start_at).toLocaleString('en-KE', { weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })} />
        <DetailField label="Host" value={session.organizer?.name ?? '—'} />
        <DetailField label="Filled" value={`${session.filled}/${session.capacity}`} />
        <DetailField label="Status" value={PHASE_LABEL[session.phase]} />
        <DetailField label="Created" value={new Date(session.created_at).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' })} />
        <DetailField label="Session ID" value={session.id} />
      </View>

      <Text style={styles.sectionTitle}>Cancellation reason</Text>
      <Text style={styles.reasonText}>{session.cancellation_reason ?? 'Not cancelled, or no reason recorded.'}</Text>
    </Drawer>
  );
}

export default function AdminMatchSessions() {
  const [sessions, setSessions] = useState<AdminSession[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<AdminSession | null>(null);

  const load = useCallback(async () => {
    try {
      const { sessions } = await adminApi.listSessions();
      setSessions(sessions);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load match sessions.');
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const total = sessions?.length ?? 0;
  const funded = sessions?.filter((s) => s.phase === 'funded').length ?? 0;
  const cancelled = sessions?.filter((s) => s.phase === 'cancelled').length ?? 0;
  // Excludes still-in-progress sessions (joining/paying/awaiting_decision) from the
  // denominator — a success *rate* should only judge sessions that have actually resolved.
  const resolved = funded + cancelled;
  const successRate = resolved > 0 ? `${Math.round((funded / resolved) * 100)}%` : '—';

  return (
    <View>
      <Text style={styles.title}>Match sessions</Text>
      <Text style={styles.subtitle}>Bookings turned into shared sessions — invited players, split cost.</Text>

      {error && <Text style={styles.error}>{error}</Text>}

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Total sessions</Text>
          <Text style={styles.statValue}>{sessions ? total : '—'}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Success rate</Text>
          <Text style={styles.statValue}>{successRate}</Text>
          <Text style={styles.statSub}>Funded ÷ (funded + cancelled)</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Funded</Text>
          <Text style={styles.statValue}>{sessions ? funded : '—'}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Cancelled</Text>
          <Text style={styles.statValue}>{sessions ? cancelled : '—'}</Text>
        </View>
      </View>

      <View style={styles.tablePanel}>
        <View style={styles.tableHeadRow}>
          {['Venue', 'Date', 'Host', 'Filled', 'Status'].map((c) => (
            <Text key={c} style={styles.tableHeadCell}>
              {c}
            </Text>
          ))}
          <Text style={[styles.tableHeadCell, styles.actionCol]} />
        </View>

        {sessions === null && !error && (
          <View style={styles.loadingRow}>
            <ActivityIndicator color={colors.accent} />
          </View>
        )}
        {sessions && sessions.length === 0 && (
          <View style={styles.emptyRow}>
            <Text style={styles.emptyText}>No match sessions yet.</Text>
          </View>
        )}

        {sessions?.map((s) => (
          <View key={s.id} style={styles.tableRow}>
            <Text style={styles.cell}>{s.venue?.name ?? '—'}</Text>
            <Text style={styles.cell}>{new Date(s.start_at).toLocaleDateString('en-KE', { day: 'numeric', month: 'short' })}</Text>
            <Text style={styles.cell}>{s.organizer?.name ?? '—'}</Text>
            <Text style={styles.cell}>
              {s.filled}/{s.capacity}
            </Text>
            <Text style={[styles.cell, s.phase === 'funded' && styles.cellGood, s.phase === 'cancelled' && styles.cellBad]}>{PHASE_LABEL[s.phase]}</Text>
            <View style={styles.actionCol}>
              <Pressable onPress={() => setSelected(s)}>
                <Text style={styles.moreLink}>More →</Text>
              </Pressable>
            </View>
          </View>
        ))}
      </View>

      <SessionDetailDrawer session={selected} onClose={() => setSelected(null)} />
    </View>
  );
}

const styles = StyleSheet.create({
  title: { fontFamily: fonts.serif, fontSize: 26, color: colors.text, marginBottom: 4 },
  subtitle: { fontFamily: fonts.sans, fontSize: 13.5, color: colors.textSoft, maxWidth: 520 },
  error: { fontFamily: fonts.sans, fontSize: 13, color: colors.danger, marginTop: 12 },

  statsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 18, marginTop: 22, marginBottom: 8 },
  statCard: { flexGrow: 1, flexBasis: 200, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, padding: 18 },
  statLabel: { fontFamily: fonts.sansSemiBold, fontSize: 12.5, color: colors.textSoft, marginBottom: 10 },
  statValue: { fontFamily: fonts.serif, fontSize: 24, color: colors.text },
  statSub: { fontFamily: fonts.sans, fontSize: 11, color: colors.textSoft, marginTop: 6 },

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
  tableRow: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.border },
  cell: { flex: 1, fontFamily: fonts.sans, fontSize: 13, color: colors.text },
  cellGood: { color: colors.good },
  cellBad: { color: colors.danger },
  actionCol: { flex: 0.7, minWidth: 60, alignItems: 'flex-end' },
  moreLink: { fontFamily: fonts.sansSemiBold, fontSize: 12.5, color: colors.accent },

  loadingRow: { paddingVertical: 30, alignItems: 'center' },
  emptyRow: { paddingVertical: 30 },
  emptyText: { fontFamily: fonts.sans, fontSize: 13, color: colors.textSoft, textAlign: 'center' },

  detailFieldGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16, marginBottom: 24 },
  detailField: { flexBasis: '45%', flexGrow: 1 },
  detailFieldLabel: { fontFamily: fonts.sansBold, fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5, color: colors.textSoft, marginBottom: 4 },
  detailFieldValue: { fontFamily: fonts.sansMedium, fontSize: 13.5, color: colors.text },

  sectionTitle: { fontFamily: fonts.serifMedium, fontSize: 14.5, color: colors.text, marginBottom: 10 },
  reasonText: { fontFamily: fonts.sans, fontSize: 13, color: colors.text, lineHeight: 20 },
});
