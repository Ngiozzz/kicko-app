import { useCallback, useState } from 'react';
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Link, useFocusEffect } from 'expo-router';
import { colors, fonts, radius } from '@kicko/shared';
import { adminApi, AdminStats, AdminVenue } from '../../src/lib/adminApi';
import { SportIcon, Sport } from '../../src/components/SportIcon';
import { useIsMobile } from '../../src/lib/useIsMobile';

const ONE_HOUR_MS = 60 * 60 * 1000;

function StatCard({ label, value, sub, href, tone }: { label: string; value: string; sub?: string; href?: string; tone?: 'accent' | 'danger' }) {
  const toneStyle = tone === 'danger' ? styles.statLabelDanger : tone === 'accent' ? styles.statLabelAccent : null;
  const content = (
    <View style={[styles.statCard, tone === 'accent' && styles.statCardPriority, tone === 'danger' && styles.statCardDanger]}>
      <Text style={[styles.statLabel, toneStyle]}>{label}</Text>
      <Text style={[styles.statValue, toneStyle]}>{value}</Text>
      {sub ? <Text style={styles.statSub}>{sub}</Text> : null}
    </View>
  );
  if (!href) return content;
  return (
    <Link href={href} asChild>
      <Pressable>{content}</Pressable>
    </Link>
  );
}

const STATUS_LABEL: Record<AdminVenue['status'], string> = {
  pending: 'Pending review',
  verified: 'Verified',
  suspended: 'Suspended',
};

export default function AdminDashboard() {
  const isMobile = useIsMobile();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [recentVenues, setRecentVenues] = useState<AdminVenue[] | null>(null);
  const [recentErrorCount, setRecentErrorCount] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [statsRes, venuesRes, logsRes] = await Promise.all([adminApi.stats(), adminApi.listVenues(), adminApi.listLogs('error')]);
      setStats(statsRes);
      setRecentVenues(venuesRes.venues.slice(0, 5));
      const cutoff = Date.now() - ONE_HOUR_MS;
      setRecentErrorCount(logsRes.logs.filter((l) => new Date(l.timestamp).getTime() >= cutoff).length);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load dashboard data.');
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  return (
    <View>
      <View style={styles.welcome}>
        <Text style={styles.welcomeTitle}>Dashboard</Text>
        <Text style={styles.welcomeSub}>Platform-wide overview across every venue and account.</Text>
      </View>

      {error && <Text style={styles.error}>{error}</Text>}
      {!stats && !error && (
        <View style={styles.loading}>
          <ActivityIndicator color={colors.accent} />
        </View>
      )}

      {stats && (
        <>
          <View style={styles.statsRow}>
            <StatCard label="Total venues" value={String(stats.totalVenues)} />
            <StatCard label="Total users" value={String(stats.totalUsers)} sub={`${stats.usersByRole.player} players · ${stats.usersByRole.owner} owners`} />
            <StatCard
              label="Pending review"
              value={String(stats.venuesByStatus.pending)}
              sub="Venue listings awaiting a decision →"
              href="/admin-dashboard/venues?status=pending"
              tone="accent"
            />
            <StatCard label="Verified venues" value={String(stats.venuesByStatus.verified)} />
            <StatCard
              label="Errors (last hour)"
              value={recentErrorCount === null ? '—' : String(recentErrorCount)}
              sub="Backend 5xx responses →"
              href="/admin-dashboard/settings/logs"
              tone={recentErrorCount ? 'danger' : undefined}
            />
          </View>

          <View style={styles.dashGrid}>
            <View style={[styles.mainCol, isMobile && styles.mainColMobile]}>
              <View style={styles.secHead}>
                <Text style={styles.secTitle}>Recent venues</Text>
                <Link href="/admin-dashboard/venues" asChild>
                  <Pressable>
                    <Text style={styles.seeAll}>See all ›</Text>
                  </Pressable>
                </Link>
              </View>

              {recentVenues && recentVenues.length === 0 && <Text style={styles.emptyText}>No venues on the platform yet.</Text>}
              {recentVenues?.map((venue) => (
                <Link key={venue.id} href={`/admin-dashboard/venues/${venue.id}`} asChild>
                  <Pressable style={styles.listRow}>
                    <View style={styles.listRowInfo}>
                      <View style={styles.thumbSm}>
                        {venue.photos[0] && <Image source={{ uri: venue.photos[0] }} style={StyleSheet.absoluteFill} resizeMode="cover" />}
                      </View>
                      <View>
                        <Text style={styles.listRowTitle}>{venue.name}</Text>
                        <View style={styles.listRowMeta}>
                          <SportIcon sport={venue.sport as Sport} size={12} />
                          <Text style={styles.listRowMetaText}>
                            {venue.sport} · {venue.owner?.name ?? 'Unknown owner'}
                          </Text>
                        </View>
                      </View>
                    </View>
                    <View style={[styles.statusPill, venue.status === 'verified' && styles.statusVerified, venue.status === 'suspended' && styles.statusSuspended]}>
                      <Text
                        style={[
                          styles.statusPillText,
                          venue.status === 'verified' && styles.statusPillTextVerified,
                          venue.status === 'suspended' && styles.statusPillTextSuspended,
                        ]}
                      >
                        {STATUS_LABEL[venue.status]}
                      </Text>
                    </View>
                  </Pressable>
                </Link>
              ))}
            </View>

            <View style={[styles.sideCol, isMobile && styles.sideColMobile]}>
              <View style={styles.sideCard}>
                <Text style={styles.sideCardTitle}>Users by role</Text>
                {(['player', 'owner', 'manager', 'admin'] as const).map((role, i, arr) => (
                  <View key={role} style={[styles.roleRow, i === arr.length - 1 && styles.roleRowLast]}>
                    <Text style={styles.roleLabel}>{role.charAt(0).toUpperCase() + role.slice(1)}s</Text>
                    <Text style={styles.roleValue}>{stats.usersByRole[role]}</Text>
                  </View>
                ))}
              </View>

              <View style={styles.sideCard}>
                <Text style={styles.sideCardTitle}>Venues by status</Text>
                {(['pending', 'verified', 'suspended'] as const).map((s, i, arr) => (
                  <View key={s} style={[styles.roleRow, i === arr.length - 1 && styles.roleRowLast]}>
                    <Text style={styles.roleLabel}>{STATUS_LABEL[s]}</Text>
                    <Text style={styles.roleValue}>{stats.venuesByStatus[s]}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  welcome: { marginBottom: 26 },
  welcomeTitle: { fontFamily: fonts.serif, fontSize: 26, color: colors.text, marginBottom: 4 },
  welcomeSub: { fontFamily: fonts.sans, fontSize: 14, color: colors.textSoft },

  loading: { paddingVertical: 40, alignItems: 'center' },
  error: { fontFamily: fonts.sans, fontSize: 13.5, color: colors.danger },
  emptyText: { fontFamily: fonts.sans, fontSize: 13.5, color: colors.textSoft },

  statsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 18, marginBottom: 36 },
  statCard: { flexGrow: 1, flexBasis: 220, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, padding: 20 },
  statCardPriority: { borderColor: colors.accent },
  statCardDanger: { borderColor: colors.danger },
  statLabel: { fontFamily: fonts.sansSemiBold, fontSize: 12.5, color: colors.textSoft, marginBottom: 14 },
  statLabelAccent: { color: colors.accent },
  statLabelDanger: { color: colors.danger },
  statValue: { fontFamily: fonts.serif, fontSize: 26, color: colors.text },
  statSub: { fontFamily: fonts.sans, fontSize: 12, color: colors.textSoft, marginTop: 6 },

  dashGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 28, alignItems: 'flex-start' },
  mainCol: { flex: 1.65, minWidth: 320 },
  sideCol: { flex: 1, minWidth: 260 },
  mainColMobile: { minWidth: 0, flexBasis: '100%' },
  sideColMobile: { minWidth: 0, flexBasis: '100%' },

  secHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 18, flexWrap: 'wrap', gap: 10 },
  secTitle: { fontFamily: fonts.serifMedium, fontSize: 19, color: colors.text },
  seeAll: { fontFamily: fonts.sansSemiBold, fontSize: 13, color: colors.accent },

  listRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 16,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: 16,
    marginBottom: 12,
  },
  listRowInfo: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  thumbSm: { width: 48, height: 48, borderRadius: 10, backgroundColor: colors.accentSoft, overflow: 'hidden' },
  listRowTitle: { fontFamily: fonts.sansSemiBold, fontSize: 14, color: colors.text },
  listRowMeta: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 },
  listRowMetaText: { fontFamily: fonts.sans, fontSize: 12.5, color: colors.textSoft, textTransform: 'capitalize' },

  statusPill: { backgroundColor: colors.surface2, borderRadius: radius.pill, paddingVertical: 4, paddingHorizontal: 10 },
  statusVerified: { backgroundColor: 'rgba(60,122,92,0.14)' },
  statusSuspended: { backgroundColor: 'rgba(196,69,63,0.12)' },
  statusPillText: { fontFamily: fonts.sansSemiBold, fontSize: 10.5, color: colors.textSoft },
  statusPillTextVerified: { color: colors.good },
  statusPillTextSuspended: { color: colors.danger },

  sideCard: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, padding: 20, marginBottom: 20 },
  sideCardTitle: { fontFamily: fonts.sansSemiBold, fontSize: 14, color: colors.text, marginBottom: 14 },
  roleRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border },
  roleRowLast: { borderBottomWidth: 0 },
  roleLabel: { fontFamily: fonts.sans, fontSize: 13, color: colors.textSoft },
  roleValue: { fontFamily: fonts.sansSemiBold, fontSize: 13, color: colors.text },
});
