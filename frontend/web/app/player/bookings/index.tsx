import { useCallback, useState } from 'react';
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Link, useFocusEffect, useRouter } from 'expo-router';
import { colors, fonts, radius, supabase } from '@kicko/shared';
import { bookingsApi, Booking } from '../../../src/lib/bookingsApi';
import { sessionsApi, MatchSession } from '../../../src/lib/sessionsApi';
import { SportIcon, Sport } from '../../../src/components/SportIcon';
import { getSportContent } from '../../../src/content/sportContent';

function RowThumb({ photo, sport }: { photo: string | null; sport: string }) {
  return (
    <View style={styles.thumb}>
      {photo ? <Image source={{ uri: photo }} style={StyleSheet.absoluteFill} resizeMode="cover" /> : <View style={styles.thumbGradient} />}
      <View style={styles.thumbSportBadge}>
        <SportIcon sport={sport as Sport} size={12} />
      </View>
    </View>
  );
}

type Filter = 'all' | 'upcoming' | 'completed' | 'cancelled';
const TABS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'completed', label: 'Completed' },
  { key: 'cancelled', label: 'Cancelled' },
];

type Row = {
  key: string;
  href: string;
  sport: string;
  photo: string | null;
  venueName: string;
  location: string;
  startAt: string;
  amount: number;
  kind: 'solo' | 'session' | 'split';
  detailNote?: string;
  badge: { label: string; tone: 'good' | 'warn' | 'bad' };
  filterBucket: 'upcoming' | 'completed' | 'cancelled';
  bookingId?: string;
};

function bookingBadge(b: Booking): { label: string; tone: 'good' | 'warn' | 'bad' } {
  if (b.status === 'cancelled') return { label: `Cancelled${b.refund_pct ? ` · ${b.refund_pct}% refunded` : ''}`, tone: 'bad' };
  if (b.status === 'completed') return { label: 'Completed', tone: 'good' };
  if (b.payment_status === 'paid') return { label: 'Confirmed', tone: 'good' };
  return { label: 'Awaiting payment', tone: 'warn' };
}

function bookingBucket(b: Booking): Row['filterBucket'] {
  if (b.status === 'cancelled') return 'cancelled';
  if (b.status === 'completed') return 'completed';
  return 'upcoming';
}

function sessionBadge(s: MatchSession): { label: string; tone: 'good' | 'warn' | 'bad' } {
  if (s.phase === 'joining') return { label: 'Joining', tone: 'warn' };
  if (s.phase === 'paying') return { label: 'Paying', tone: 'warn' };
  if (s.phase === 'awaiting_decision') return { label: 'Needs a decision', tone: 'bad' };
  return { label: 'Cancelled', tone: 'bad' };
}

export default function PlayerBookings() {
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[] | null>(null);
  const [sessions, setSessions] = useState<MatchSession[] | null>(null);
  const [awaitingDecision, setAwaitingDecision] = useState<MatchSession[]>([]);
  const [awaitingCompletion, setAwaitingCompletion] = useState<MatchSession[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>('all');
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [{ bookings }, { sessions }, decision, completion, {
        data: { session: authSession },
      }] = await Promise.all([
        bookingsApi.mine(),
        sessionsApi.mine(),
        sessionsApi.awaitingDecision(),
        sessionsApi.awaitingCompletion(),
        supabase.auth.getSession(),
      ]);
      setBookings(bookings);
      setSessions(sessions);
      setAwaitingDecision(decision.sessions);
      setAwaitingCompletion(completion.sessions);
      setUserId(authSession?.user.id ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load your bookings.');
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  async function handleCancel(id: string) {
    setCancellingId(id);
    try {
      const { booking } = await bookingsApi.cancel(id);
      setBookings((prev) => (prev ? prev.map((b) => (b.id === id ? booking : b)) : prev));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not cancel this booking.');
    } finally {
      setCancellingId(null);
    }
  }

  let rows: Row[] | null = null;
  if (bookings && sessions) {
    // A session materializes into a real bookings row the instant it's
    // funded — so that row is authoritative for a funded session, and any
    // still-live (non-funded) session row takes precedence over a stale
    // booking row left behind by a since-reopened session. Neither side is
    // ever shown twice.
    const activeSessionIds = new Set(sessions.filter((s) => s.phase !== 'funded').map((s) => s.id));

    const bookingRows: Row[] = bookings
      .filter((b) => !(b.session_id && activeSessionIds.has(b.session_id)))
      .map((b) => ({
        key: `booking-${b.id}`,
        href: b.booking_type === 'session' && b.session_id ? `/player/sessions/${b.session_id}` : `/player/bookings/${b.id}`,
        sport: b.venue.sport,
        photo: b.venue.photos[0] ?? null,
        venueName: b.venue.name,
        location: b.venue.location,
        startAt: b.start_at,
        amount: b.total_amount,
        kind: b.booking_type === 'session' ? 'session' : b.booking_type === 'split' ? 'split' : 'solo',
        detailNote:
          b.booking_type === 'session'
            ? b.player_id === userId
              ? 'Organized by you'
              : undefined
            : b.booking_type === 'split'
              ? b.player_id === userId
                ? 'Organized by you'
                : 'Invited to split this booking'
              : b.format
                ? getSportContent(b.venue.sport).sessionFormats.find((f) => f.key === b.format)?.label ?? b.format
                : undefined,
        badge: bookingBadge(b),
        filterBucket: bookingBucket(b),
        bookingId: b.booking_type === 'individual' && (b.status === 'pending_payment' || b.status === 'confirmed') ? b.id : undefined,
      }));

    const sessionRows: Row[] = sessions
      .filter((s) => s.phase !== 'funded')
      .map((s) => ({
        key: `session-${s.id}`,
        href: `/player/sessions/${s.id}`,
        sport: s.venue.sport,
        photo: s.venue.photos[0] ?? null,
        venueName: s.venue.name,
        location: s.venue.location,
        startAt: s.start_at,
        amount: s.total_cost,
        kind: 'session',
        detailNote: `${s.format ? `${getSportContent(s.venue.sport).sessionFormats.find((f) => f.key === s.format)?.label ?? s.format} · ` : ''}${s.accepted_count ?? 0} player${s.accepted_count === 1 ? '' : 's'} accepted · ${s.organizer_id === userId ? 'Organized by you' : "Joined a friend's session"}`,
        badge: sessionBadge(s),
        filterBucket: s.phase === 'cancelled' ? 'cancelled' : 'upcoming',
      }));

    rows = [...bookingRows, ...sessionRows].sort((a, b) => new Date(b.startAt).getTime() - new Date(a.startAt).getTime());
  }

  const filtered = rows?.filter((r) => filter === 'all' || r.filterBucket === filter) ?? [];
  const upcomingCount = rows?.filter((r) => r.filterBucket === 'upcoming').length ?? 0;

  return (
    <View>
      <View style={styles.headRow}>
        <View>
          <Text style={styles.title}>Bookings</Text>
          <Text style={styles.subtitle}>Every venue you've booked — solo or split with friends, past and upcoming.</Text>
        </View>
        <View style={styles.tabs}>
          {TABS.map((tab) => (
            <Pressable key={tab.key} onPress={() => setFilter(tab.key)} style={[styles.tab, filter === tab.key && styles.tabActive]}>
              <Text style={[styles.tabText, filter === tab.key && styles.tabTextActive]}>{tab.label}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.statsRow}>
        <View style={[styles.statCard, styles.statCardPriority]}>
          <Text style={styles.statLabelAccent}>Upcoming</Text>
          <Text style={styles.statValueAccent}>{upcomingCount}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Total bookings</Text>
          <Text style={styles.statValue}>{rows?.length ?? 0}</Text>
        </View>
      </View>

      {awaitingDecision.length > 0 && (
        <View style={styles.callout}>
          <Text style={styles.calloutTitle}>Needs your decision</Text>
          {awaitingDecision.map((s) => (
            <Link key={s.id} href={`/player/sessions/${s.id}`} asChild>
              <Pressable style={styles.calloutRow}>
                <Text style={styles.calloutRowText}>{s.venue.name} — funding stalled, resplit / pay the gap / cancel</Text>
              </Pressable>
            </Link>
          ))}
        </View>
      )}

      {awaitingCompletion.length > 0 && (
        <View style={styles.callout}>
          <Text style={styles.calloutTitle}>Waiting on you to close invites</Text>
          {awaitingCompletion.map((s) => (
            <Link key={s.id} href={`/player/sessions/${s.id}`} asChild>
              <Pressable style={styles.calloutRow}>
                <Text style={styles.calloutRowText}>{s.venue.name} — the other side's roster is ready, yours isn't</Text>
              </Pressable>
            </Link>
          ))}
        </View>
      )}

      {rows === null && !error && (
        <View style={styles.loading}>
          <ActivityIndicator color={colors.accent} />
        </View>
      )}
      {error && <Text style={styles.error}>{error}</Text>}
      {rows && filtered.length === 0 && (
        <View style={styles.emptyState}>
          <View style={styles.emptyIconRing}>
            <Text style={styles.emptyIcon}>⚽</Text>
          </View>
          <Text style={styles.emptyTitle}>{rows.length === 0 ? 'No bookings yet' : 'Nothing here yet'}</Text>
          <Text style={styles.emptyBody}>
            {rows.length === 0
              ? "Once you book a venue solo or start a match session, it'll show up here."
              : 'No bookings match this filter — try a different tab.'}
          </Text>
          {rows.length === 0 && (
            <Pressable style={styles.emptyCta} onPress={() => router.push('/player/explore')}>
              <Text style={styles.emptyCtaText}>Explore venues →</Text>
            </Pressable>
          )}
        </View>
      )}

      {filtered.map((r) => (
        <Link key={r.key} href={r.href as any} asChild>
          <Pressable style={styles.row}>
          <View style={styles.rowInfo}>
            <RowThumb photo={r.photo} sport={r.sport} />
            <View style={{ flex: 1, minWidth: 0 }}>
              <View style={styles.rowTitleLine}>
                <Text style={styles.rowTitle}>{r.venueName}</Text>
                <Text style={[styles.kindTag, r.kind === 'session' || r.kind === 'split' ? styles.kindTagSession : styles.kindTagSolo]}>
                  {r.kind === 'session' ? 'Match session' : r.kind === 'split' ? 'Split booking' : 'Solo'}
                </Text>
              </View>
              <Text style={styles.rowMeta}>
                {new Date(r.startAt).toLocaleString('en-KE', { weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })}
                {' · '}
                {r.location}
                {' · '}KES {r.amount.toLocaleString()}
              </Text>
              {r.detailNote && <Text style={styles.rowDetail}>{r.detailNote}</Text>}
            </View>
          </View>
          <View style={styles.rowActions}>
            <Text style={[styles.badge, styles[`badge_${r.badge.tone}`]]}>{r.badge.label}</Text>
            {r.bookingId && (
              <Pressable
                disabled={cancellingId === r.bookingId}
                onPress={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  handleCancel(r.bookingId!);
                }}
              >
                <Text style={styles.cancelLink}>{cancellingId === r.bookingId ? 'Cancelling…' : 'Cancel'}</Text>
              </Pressable>
            )}
          </View>
          </Pressable>
        </Link>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  headRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16, marginBottom: 8 },
  title: { fontFamily: fonts.serif, fontSize: 26, color: colors.text, marginBottom: 4 },
  subtitle: { fontFamily: fonts.sans, fontSize: 13.5, color: colors.textSoft },

  tabs: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tab: { paddingVertical: 9, paddingHorizontal: 16, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  tabActive: { backgroundColor: colors.accent, borderColor: 'transparent' },
  tabText: { fontFamily: fonts.sansSemiBold, fontSize: 13, color: colors.textSoft },
  tabTextActive: { color: colors.accentText },

  statsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 18, marginTop: 22, marginBottom: 22 },
  statCard: { flexGrow: 1, flexBasis: 180, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, padding: 18 },
  statCardPriority: { borderColor: colors.accent },
  statLabel: { fontFamily: fonts.sansSemiBold, fontSize: 12.5, color: colors.textSoft, marginBottom: 10 },
  statLabelAccent: { fontFamily: fonts.sansSemiBold, fontSize: 12.5, color: colors.accent, marginBottom: 10 },
  statValue: { fontFamily: fonts.serif, fontSize: 24, color: colors.text },
  statValueAccent: { fontFamily: fonts.serif, fontSize: 24, color: colors.accent },

  callout: { backgroundColor: colors.accentSoft, borderRadius: radius.lg, padding: 16, marginBottom: 18 },
  calloutTitle: { fontFamily: fonts.sansBold, fontSize: 12.5, color: colors.accent, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  calloutRow: { paddingVertical: 6 },
  calloutRowText: { fontFamily: fonts.sansSemiBold, fontSize: 13, color: colors.text },

  loading: { paddingVertical: 40, alignItems: 'center' },
  error: { fontFamily: fonts.sans, fontSize: 13, color: colors.danger, marginBottom: 16 },
  emptyState: { alignItems: 'center', paddingVertical: 56, paddingHorizontal: 20 },
  emptyIconRing: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    backgroundImage: `radial-gradient(circle, ${colors.accentSoft}, transparent 70%)`,
  } as any,
  emptyIcon: { fontSize: 30 },
  emptyTitle: { fontFamily: fonts.serifMedium, fontSize: 17, color: colors.text, marginBottom: 8 },
  emptyBody: { fontFamily: fonts.sans, fontSize: 13.5, color: colors.textSoft, textAlign: 'center', lineHeight: 20, maxWidth: 340, marginBottom: 18 },
  emptyCta: { backgroundColor: colors.accent, borderRadius: radius.pill, paddingVertical: 12, paddingHorizontal: 22 },
  emptyCtaText: { fontFamily: fonts.sansBold, fontSize: 13, color: colors.accentText },

  row: {
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
  thumb: { width: 56, height: 56, borderRadius: radius.md, overflow: 'hidden', backgroundColor: colors.accentSoft, flexShrink: 0 },
  thumbGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundImage: `linear-gradient(135deg, ${colors.accent}, ${colors.surface2})`,
  } as any,
  thumbSportBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(20,20,22,0.65)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowInfo: { flexDirection: 'row', alignItems: 'center', gap: 14, flex: 1, minWidth: 0 },
  rowTitleLine: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rowTitle: { fontFamily: fonts.sansSemiBold, fontSize: 14, color: colors.text },
  rowMeta: { fontFamily: fonts.sans, fontSize: 12.5, color: colors.textSoft, marginTop: 2 },
  rowDetail: { fontFamily: fonts.sansMedium, fontSize: 12, color: colors.accent, marginTop: 4 },

  kindTag: { fontFamily: fonts.sansBold, fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.4, paddingVertical: 3, paddingHorizontal: 8, borderRadius: radius.pill, overflow: 'hidden' },
  kindTagSolo: { backgroundColor: colors.surface2, color: colors.textSoft },
  kindTagSession: { backgroundColor: colors.accentSoft, color: colors.accent },

  rowActions: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  badge: { fontFamily: fonts.sansSemiBold, fontSize: 11.5, paddingVertical: 6, paddingHorizontal: 12, borderRadius: radius.pill, overflow: 'hidden' },
  badge_good: { backgroundColor: colors.accentSoft, color: colors.accent },
  badge_warn: { backgroundColor: colors.surface2, color: colors.textSoft },
  badge_bad: { backgroundColor: colors.surface2, color: colors.danger },
  cancelLink: { fontFamily: fonts.sansSemiBold, fontSize: 12.5, color: colors.danger },
});
