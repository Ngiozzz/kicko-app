import { useCallback, useState } from 'react';
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Link, useFocusEffect } from 'expo-router';
import { colors, fonts, radius } from '@kicko/shared';
import { venuesApi, Venue } from '../../src/lib/venuesApi';
import { SportIcon, Sport } from '../../src/components/SportIcon';

function StatCard({
  label,
  value,
  unit,
  sub,
  href,
  priority,
}: {
  label: string;
  value: string;
  unit?: string;
  sub?: string;
  href?: string;
  priority?: boolean;
}) {
  const content = (
    <View style={[styles.statCard, priority && styles.statCardPriority]}>
      <Text style={[styles.statLabel, priority && styles.statLabelAccent]}>{label}</Text>
      <Text style={[styles.statValue, priority && styles.statLabelAccent]}>
        {value}
        {unit ? <Text style={styles.statUnit}> {unit}</Text> : null}
      </Text>
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

const BAR_HEIGHTS = [8, 8, 8, 8, 8, 8, 8];

export default function OwnerHome() {
  const [venues, setVenues] = useState<Venue[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const { venues } = await venuesApi.list();
      setVenues(venues);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load your venues.');
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
        <Text style={styles.welcomeTitle}>Home</Text>
      </View>

      <View style={styles.statsRow}>
        <StatCard label="My venues" value={venues ? String(venues.length) : '0'} unit="listed" />
        <StatCard label="Pending approvals" value="0" sub="Awaiting a decision →" href="/owner/bookings" priority />
        <StatCard label="Approval turnaround" value="0m" sub="Avg time to decide, across all venues" />
        <StatCard label="Total earnings" value="KES 0" />
      </View>

      <View style={styles.dashGrid}>
        <View style={styles.mainCol}>
          <View style={styles.secHead}>
            <Text style={styles.secTitle}>My venues</Text>
            <View style={styles.secHeadActions}>
              <Link href="/owner/venues" asChild>
                <Pressable>
                  <Text style={styles.seeAll}>See all ›</Text>
                </Pressable>
              </Link>
              <Link href="/owner/venues/new" asChild>
                <Pressable style={styles.btnSm}>
                  <Text style={styles.btnSmText}>+ Add venue</Text>
                </Pressable>
              </Link>
            </View>
          </View>

          {venues === null && !error && (
            <View style={styles.loading}>
              <ActivityIndicator color={colors.accent} />
            </View>
          )}
          {error && <Text style={styles.error}>{error}</Text>}
          {venues && venues.length === 0 && <Text style={styles.emptyText}>You haven't added a venue yet.</Text>}
          {venues?.slice(0, 3).map((venue) => (
            <Link key={venue.id} href={`/owner/venues/${venue.id}`} asChild>
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
                        {venue.sport} · {venue.location}
                      </Text>
                    </View>
                  </View>
                </View>
                <Text style={styles.listRowAmount}>From KES {venue.price_off_peak.toLocaleString()}/hr</Text>
              </Pressable>
            </Link>
          ))}

          <View style={[styles.secHead, { marginTop: 32 }]}>
            <Text style={styles.secTitle}>Earnings trend</Text>
          </View>
          <View style={styles.earnCard}>
            <View>
              <Text style={styles.earnLabel}>Gross bookings</Text>
              <Text style={styles.earnValue}>KES 0</Text>
              <Text style={styles.earnNote}>Everything players have actually paid</Text>
            </View>
            <View>
              <Text style={styles.earnLabel}>Net payout</Text>
              <Text style={styles.earnValue}>KES 0</Text>
              <Text style={styles.earnNote}>After Kicko's fee — only what's actually landed</Text>
            </View>
          </View>
          <View style={styles.barsCard}>
            {BAR_HEIGHTS.map((h, i) => (
              <View key={i} style={[styles.bar, { height: `${h}%` }]} />
            ))}
          </View>

          <View style={[styles.secHead, { marginTop: 32 }]}>
            <Text style={styles.secTitle}>Pending bookings</Text>
          </View>
          <Text style={styles.emptyText}>No pending bookings.</Text>
        </View>

        <View style={styles.sideCol}>
          <View style={styles.sideCard}>
            <Text style={styles.sideCardTitle}>⚡ Quick actions</Text>
            <Link href="/owner/venues/new" asChild>
              <Pressable style={styles.actionItem}>
                <View style={styles.actionIcon}>
                  <Text>🏟</Text>
                </View>
                <View style={styles.actionTextWrap}>
                  <Text style={styles.actionTitle}>Add a venue</Text>
                  <Text style={styles.actionSub}>List a new venue</Text>
                </View>
                <Text style={styles.actionArrow}>›</Text>
              </Pressable>
            </Link>
            <Link href="/owner/managers" asChild>
              <Pressable style={StyleSheet.flatten([styles.actionItem, styles.actionItemLast])}>
                <View style={styles.actionIcon}>
                  <Text>👥</Text>
                </View>
                <View style={styles.actionTextWrap}>
                  <Text style={styles.actionTitle}>Assign a manager</Text>
                  <Text style={styles.actionSub}>Let someone run a venue for you</Text>
                </View>
                <Text style={styles.actionArrow}>›</Text>
              </Pressable>
            </Link>
          </View>

          <View style={styles.sideCard}>
            <Text style={styles.sideCardTitle}>My managers</Text>
            <Text style={styles.emptyText}>No managers yet.</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  welcome: { marginBottom: 26 },
  welcomeTitle: { fontFamily: fonts.serif, fontSize: 26, color: colors.text },

  statsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 18, marginBottom: 36 },
  statCard: {
    flexGrow: 1,
    flexBasis: 220,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: 20,
  },
  statCardPriority: { borderColor: colors.accent },
  statLabel: { fontFamily: fonts.sansSemiBold, fontSize: 12.5, color: colors.textSoft, marginBottom: 14 },
  statLabelAccent: { color: colors.accent },
  statValue: { fontFamily: fonts.serif, fontSize: 26, color: colors.text },
  statUnit: { fontFamily: fonts.sans, fontSize: 12, fontWeight: '500', color: colors.textSoft },
  statSub: { fontFamily: fonts.sans, fontSize: 12, color: colors.textSoft, marginTop: 6 },

  dashGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 28, alignItems: 'flex-start' },
  mainCol: { flex: 1.65, minWidth: 320 },
  sideCol: { flex: 1, minWidth: 260 },

  secHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 18, flexWrap: 'wrap', gap: 10 },
  secTitle: { fontFamily: fonts.serifMedium, fontSize: 19, color: colors.text },
  secHeadActions: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  seeAll: { fontFamily: fonts.sansSemiBold, fontSize: 13, color: colors.accent },
  btnSm: { backgroundColor: colors.accent, borderRadius: radius.pill, paddingVertical: 10, paddingHorizontal: 16 },
  btnSmText: { fontFamily: fonts.sansBold, fontSize: 13, color: colors.accentText },

  loading: { paddingVertical: 30, alignItems: 'center' },
  error: { fontFamily: fonts.sans, fontSize: 13, color: colors.danger },
  emptyText: { fontFamily: fonts.sans, fontSize: 13.5, color: colors.textSoft },

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
  listRowAmount: { fontFamily: fonts.sansBold, fontSize: 13, color: colors.accent },

  earnCard: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 36,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: 22,
    marginBottom: 16,
  },
  earnLabel: { fontFamily: fonts.sansBold, fontSize: 11.5, textTransform: 'uppercase', letterSpacing: 0.5, color: colors.textSoft, marginBottom: 4 },
  earnValue: { fontFamily: fonts.serif, fontSize: 22, color: colors.text },
  earnNote: { fontFamily: fonts.sans, fontSize: 12, color: colors.textSoft, marginTop: 2 },

  barsCard: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    height: 120,
    padding: 22,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
  },
  bar: { flex: 1, backgroundColor: colors.accentSoft, borderRadius: 6 },

  sideCard: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, padding: 20, marginBottom: 20 },
  sideCardTitle: { fontFamily: fonts.sansSemiBold, fontSize: 14, color: colors.text, marginBottom: 14 },
  actionItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
  actionItemLast: { borderBottomWidth: 0 },
  actionIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionTextWrap: { flex: 1 },
  actionTitle: { fontFamily: fonts.sansSemiBold, fontSize: 13.5, color: colors.text },
  actionSub: { fontFamily: fonts.sans, fontSize: 12, color: colors.textSoft },
  actionArrow: { color: colors.textSoft, fontSize: 16 },
});
