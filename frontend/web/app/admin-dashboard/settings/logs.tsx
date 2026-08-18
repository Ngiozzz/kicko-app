import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { colors, fonts, radius } from '@kicko/shared';
import { adminApi, LogLevel, ServerLog } from '../../../src/lib/adminApi';

const AUTO_REFRESH_MS = 20_000;

type Filter = 'all' | LogLevel;
const TABS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'error', label: 'Errors' },
  { key: 'warn', label: 'Warnings' },
  { key: 'info', label: 'Info' },
];

const LEVEL_STYLE: Record<LogLevel, { bg: string; color: string; label: string }> = {
  error: { bg: 'rgba(196,69,63,0.12)', color: colors.danger, label: 'Error' },
  warn: { bg: colors.accentSoft, color: colors.accent, label: 'Warning' },
  info: { bg: 'rgba(90,95,102,0.14)', color: colors.textSoft, label: 'Info' },
};

function formatTime(iso: string): string {
  return new Date(iso).toLocaleString('en-KE', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function LogRow({ log, expanded, onToggle }: { log: ServerLog; expanded: boolean; onToggle: () => void }) {
  const style = LEVEL_STYLE[log.level];
  const canExpand = Boolean(log.detail);

  return (
    <Pressable onPress={canExpand ? onToggle : undefined} style={[styles.row, { borderLeftColor: style.color }]}>
      <View style={styles.rowTop}>
        <View style={[styles.badge, { backgroundColor: style.bg }]}>
          <Text style={[styles.badgeText, { color: style.color }]}>{style.label}</Text>
        </View>
        <Text style={styles.message} numberOfLines={expanded ? undefined : 1}>
          {log.message}
        </Text>
        {log.durationMs != null && <Text style={styles.duration}>{log.durationMs}ms</Text>}
        <Text style={styles.time}>{formatTime(log.timestamp)}</Text>
      </View>
      {canExpand && (
        <Text style={styles.expandHint}>{expanded ? '▲ Hide stack trace' : '▼ Show stack trace'}</Text>
      )}
      {expanded && log.detail && (
        <View style={styles.detailBox}>
          <Text style={styles.detailText}>{log.detail}</Text>
        </View>
      )}
    </Pressable>
  );
}

export default function AdminServerLogs() {
  const [logs, setLogs] = useState<ServerLog[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const { logs } = await adminApi.listLogs();
      setLogs(logs);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load server logs.');
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
      const interval = setInterval(load, AUTO_REFRESH_MS);
      return () => clearInterval(interval);
    }, [load])
  );

  const counts = {
    all: logs?.length ?? 0,
    error: logs?.filter((l) => l.level === 'error').length ?? 0,
    warn: logs?.filter((l) => l.level === 'warn').length ?? 0,
    info: logs?.filter((l) => l.level === 'info').length ?? 0,
  };
  const visible = logs?.filter((l) => filter === 'all' || l.level === filter) ?? [];

  return (
    <View>
      <View style={styles.headRow}>
        <View>
          <Text style={styles.title}>Server logs</Text>
          <Text style={styles.subtitle}>
            The most recent requests handled by the backend, newest first. Errors and warnings are flagged so they're easy to spot — this refreshes
            automatically every {AUTO_REFRESH_MS / 1000}s.
          </Text>
        </View>
        <Pressable onPress={load} style={styles.refreshBtn}>
          <Text style={styles.refreshBtnText}>Refresh</Text>
        </Pressable>
      </View>

      <View style={styles.tabs}>
        {TABS.map((tab) => (
          <Pressable key={tab.key} onPress={() => setFilter(tab.key)} style={[styles.tab, filter === tab.key && styles.tabActive]}>
            <Text style={[styles.tabText, filter === tab.key && styles.tabTextActive]}>
              {tab.label} ({counts[tab.key]})
            </Text>
          </Pressable>
        ))}
      </View>

      {error && <Text style={styles.error}>{error}</Text>}
      {logs === null && !error && (
        <View style={styles.loading}>
          <ActivityIndicator color={colors.accent} />
        </View>
      )}
      {logs && visible.length === 0 && <Text style={styles.emptyNote}>No log entries yet — activity will appear here as requests come in.</Text>}

      {visible.length > 0 && (
        <View style={styles.panel}>
          {visible.map((log) => (
            <LogRow key={log.id} log={log} expanded={expandedId === log.id} onToggle={() => setExpandedId((id) => (id === log.id ? null : log.id))} />
          ))}
        </View>
      )}

      <Text style={styles.footNote}>
        Logs live in the backend process's memory and reset on every restart or redeploy — this is a quick-triage view, not a durable log store. For
        longer retention on Render, add a Log Stream to forward logs to an external service.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  headRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16, marginBottom: 20 },
  title: { fontFamily: fonts.serif, fontSize: 26, color: colors.text, marginBottom: 4 },
  subtitle: { fontFamily: fonts.sans, fontSize: 13.5, color: colors.textSoft, maxWidth: 560, lineHeight: 19 },

  refreshBtn: { backgroundColor: colors.accent, borderRadius: radius.pill, paddingVertical: 10, paddingHorizontal: 18 },
  refreshBtnText: { fontFamily: fonts.sansBold, fontSize: 13, color: colors.accentText },

  tabs: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginBottom: 18 },
  tab: { paddingVertical: 9, paddingHorizontal: 16, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  tabActive: { backgroundColor: colors.accent, borderColor: 'transparent' },
  tabText: { fontFamily: fonts.sansSemiBold, fontSize: 13, color: colors.textSoft },
  tabTextActive: { color: colors.accentText },

  loading: { paddingVertical: 40, alignItems: 'center' },
  error: { fontFamily: fonts.sans, fontSize: 13.5, color: colors.danger, marginBottom: 12 },
  emptyNote: { fontFamily: fonts.sans, fontSize: 13, color: colors.textSoft, textAlign: 'center', paddingVertical: 24 },

  panel: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, overflow: 'hidden' },

  row: { borderLeftWidth: 3, paddingVertical: 12, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: colors.border },
  rowTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },

  badge: { borderRadius: radius.pill, paddingVertical: 3, paddingHorizontal: 10, flexShrink: 0 },
  badgeText: { fontFamily: fonts.sansBold, fontSize: 10.5, textTransform: 'uppercase', letterSpacing: 0.4 },

  message: { flex: 1, fontFamily: fonts.sans, fontSize: 12.5, color: colors.text, minWidth: 0 },
  duration: { fontFamily: fonts.sans, fontSize: 11.5, color: colors.textSoft, flexShrink: 0 },
  time: { fontFamily: fonts.sans, fontSize: 11.5, color: colors.textSoft, flexShrink: 0, minWidth: 120, textAlign: 'right' },

  expandHint: { fontFamily: fonts.sansMedium, fontSize: 11, color: colors.accent, marginTop: 6, marginLeft: 24 },
  detailBox: { backgroundColor: colors.bg, borderRadius: radius.md, padding: 12, marginTop: 8 },
  detailText: { fontFamily: fonts.sans, fontSize: 11.5, color: colors.text, lineHeight: 17 },

  footNote: { fontFamily: fonts.sans, fontSize: 11.5, color: colors.textSoft, marginTop: 16, lineHeight: 16, maxWidth: 640 },
});
